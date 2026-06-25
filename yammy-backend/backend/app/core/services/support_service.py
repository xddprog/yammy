from uuid import UUID

from app.core.clients.support_telegram_client import SupportTelegramClient
from app.core.dto.pagination import PaginationRequestModel, PaginationResponseModel
from app.core.dto.support import (
    SupportConversationDetailSchema,
    SupportConversationListItemSchema,
    SupportMessageSchema,
    SupportUserPreviewSchema,
)
from app.core.repositories.support_repository import SupportRepository
from app.core.repositories.user_repository import UserRepository
from app.infrastructure.database.models.support_conversation import SupportConversation
from app.infrastructure.database.models.user import User
from app.infrastructure.errors.base import NotFoundException
from app.utils.constants.enums import (
    SupportConversationStatusEnum,
    SupportMessageDirectionEnum,
    SupportRequestTypeEnum,
)


STAFF_REPLY_PREFIX = "💬 <b>Ответ поддержки:</b>\n"
TICKET_CREATED_REPLY = (
    "✅ Тикет создан! Номер: <code>{ticket_id}</code>\n"
    "Мы ответим как можно скорее. Новые сообщения по открытому тикету можно писать здесь."
)
MESSAGE_APPENDED_REPLY = "✅ Сообщение добавлено в тикет <code>{ticket_id}</code>."


class SupportService:
    def __init__(
        self,
        support_repository: SupportRepository,
        user_repository: UserRepository,
        support_telegram_client: SupportTelegramClient,
    ):
        self._support = support_repository
        self._users = user_repository
        self._telegram = support_telegram_client

    async def create_ticket(
        self,
        telegram_id: int,
        request_type: SupportRequestTypeEnum,
        content: str,
        telegram_message_id: int | None = None,
    ) -> SupportConversation:
        if telegram_message_id is not None:
            existing = await self._support.get_by_telegram_message_id(telegram_message_id)
            if existing is not None:
                conv = await self._support.get_with_messages(existing.conversation_id)
                if conv is not None:
                    return conv

        user = await self._users.get_by_telegram_id(telegram_id)
        conversation = await self._support.create_conversation(
            telegram_id=telegram_id,
            user_id=user.id if user else None,
            request_type=request_type,
        )
        await self._support.add_message(
            conversation_id=conversation.id,
            direction=SupportMessageDirectionEnum.USER,
            content=content,
            telegram_message_id=telegram_message_id,
        )
        await self._support.commit()
        await self._telegram.send_message(
            telegram_id,
            TICKET_CREATED_REPLY.format(ticket_id=str(conversation.id)[:8]),
        )
        return conversation

    async def append_user_message(
        self,
        telegram_id: int,
        content: str,
        telegram_message_id: int | None = None,
    ) -> SupportConversation | None:
        if telegram_message_id is not None:
            existing = await self._support.get_by_telegram_message_id(telegram_message_id)
            if existing is not None:
                return await self._support.get_with_messages(existing.conversation_id)

        conversation = await self._support.get_open_conversation(telegram_id)
        if conversation is None:
            return None

        await self._support.add_message(
            conversation_id=conversation.id,
            direction=SupportMessageDirectionEnum.USER,
            content=content,
            telegram_message_id=telegram_message_id,
        )
        await self._support.commit()
        await self._telegram.send_message(
            telegram_id,
            MESSAGE_APPENDED_REPLY.format(ticket_id=str(conversation.id)[:8]),
        )
        return conversation

    async def list_user_tickets(self, telegram_id: int) -> list[SupportConversation]:
        return await self._support.list_by_telegram_id(telegram_id)

    async def list_conversations_for_admin(
        self,
        pagination: PaginationRequestModel,
        status: SupportConversationStatusEnum | None = None,
    ) -> PaginationResponseModel[SupportConversationListItemSchema]:
        items, total = await self._support.list_for_admin(pagination, status=status)
        return PaginationResponseModel(
            total=total,
            page=pagination.page,
            size=pagination.size,
            items=[await self._to_list_item(c) for c in items],
        )

    async def get_conversation_detail(self, conversation_id: UUID) -> SupportConversationDetailSchema:
        conversation = await self._support.get_with_messages(conversation_id)
        if conversation is None:
            raise NotFoundException()
        user_preview = await self._user_preview(conversation.user_id)
        return SupportConversationDetailSchema(
            id=conversation.id,
            telegram_id=conversation.telegram_id,
            request_type=conversation.request_type,
            status=conversation.status,
            last_message_at=conversation.last_message_at,
            created_at=conversation.created_at,
            user=user_preview,
        )

    async def list_messages(
        self,
        conversation_id: UUID,
        pagination: PaginationRequestModel,
    ) -> PaginationResponseModel[SupportMessageSchema]:
        conversation = await self._support.get_with_messages(conversation_id)
        if conversation is None:
            raise NotFoundException()
        messages, total = await self._support.list_messages(conversation_id, pagination)
        return PaginationResponseModel(
            total=total,
            page=pagination.page,
            size=pagination.size,
            items=[
                SupportMessageSchema(
                    id=m.id,
                    direction=m.direction,
                    content=m.content,
                    admin_id=m.admin_id,
                    created_at=m.created_at,
                )
                for m in messages
            ],
        )

    async def reply_as_staff(
        self,
        conversation_id: UUID,
        admin_id: UUID,
        content: str,
    ) -> SupportMessageSchema:
        conversation = await self._support.get_with_messages(conversation_id)
        if conversation is None:
            raise NotFoundException()

        message = await self._support.add_message(
            conversation_id=conversation_id,
            direction=SupportMessageDirectionEnum.STAFF,
            content=content,
            admin_id=admin_id,
        )
        await self._support.commit()
        await self._telegram.send_message(
            conversation.telegram_id,
            f"{STAFF_REPLY_PREFIX}{content}",
        )
        return SupportMessageSchema(
            id=message.id,
            direction=message.direction,
            content=message.content,
            admin_id=message.admin_id,
            created_at=message.created_at,
        )

    async def set_status(
        self,
        conversation_id: UUID,
        status: SupportConversationStatusEnum,
    ) -> SupportConversationDetailSchema:
        conversation = await self._support.update_status(conversation_id, status)
        if conversation is None:
            raise NotFoundException()
        await self._support.commit()
        if status == SupportConversationStatusEnum.CLOSED:
            await self._telegram.send_message(
                conversation.telegram_id,
                "Тикет закрыт. Чтобы создать новый — нажмите «Создать тикет» в меню.",
            )
        return await self.get_conversation_detail(conversation_id)

    async def _to_list_item(self, conversation: SupportConversation) -> SupportConversationListItemSchema:
        preview = None
        if conversation.messages:
            preview = conversation.messages[-1].content[:120]
        else:
            preview = await self._support.get_last_message_preview(conversation.id)

        return SupportConversationListItemSchema(
            id=conversation.id,
            telegram_id=conversation.telegram_id,
            request_type=conversation.request_type,
            status=conversation.status,
            last_message_at=conversation.last_message_at,
            created_at=conversation.created_at,
            last_message_preview=preview,
            user=await self._user_preview(conversation.user_id),
        )

    async def _user_preview(self, user_id: UUID | None) -> SupportUserPreviewSchema | None:
        if user_id is None:
            return None
        user = await self._support.get_user_preview(user_id)
        if user is None:
            return None
        return self._map_user_preview(user)

    @staticmethod
    def _map_user_preview(user: User) -> SupportUserPreviewSchema:
        main_photo = None
        if user.photos:
            main = next((p for p in user.photos if p.is_main), user.photos[0])
            main_photo = main.file_path
        return SupportUserPreviewSchema(
            id=user.id,
            name=user.name,
            age=user.age,
            city=user.city,
            main_photo=main_photo,
        )
