from uuid import UUID

from app.core.dto.chat import ChatListItemSchema, ChatPeerDetailSchema, ChatSchema, ChatTypingSchema
from app.core.dto.message import MessageSchema
from app.core.dto.pagination import PaginationRequestModel, PaginationResponseModel
from app.core.repositories.chat_repository import ChatRepository
from app.core.repositories.message_repository import MessageRepository
from app.infrastructure.errors.base import BadRequestException, NotFoundException


class ChatService:
    def __init__(
        self,
        chat_repository: ChatRepository,
        message_repository: MessageRepository,
    ):
        self.chat_repository = chat_repository
        self.message_repository = message_repository

    async def list_user_chats(
        self,
        user_id: UUID,
        pagination: PaginationRequestModel,
        name_query: str | None = None,
    ) -> PaginationResponseModel[ChatListItemSchema]:
        total, rows = await self.chat_repository.list_for_user(
            user_id,
            pagination,
            name_query=name_query,
        )
        return PaginationResponseModel(
            total=total,
            page=pagination.page,
            size=pagination.size,
            items=[ChatListItemSchema.model_validate(row, from_attributes=True) for row in rows],
        )

    async def get_chat_by_match_id(self, match_id: UUID, user_id: UUID) -> ChatSchema:
        row = await self.chat_repository.get_chat_by_match_id(match_id, user_id)
        if not row:
            raise NotFoundException(detail="Чат не найден")
        return ChatSchema.model_validate(row, from_attributes=True)

    async def list_messages(
        self,
        match_id: UUID,
        user_id: UUID,
        pagination: PaginationRequestModel,
    ) -> PaginationResponseModel[MessageSchema]:
        chat = await self.chat_repository.get_chat_by_match_id(match_id, user_id)
        if not chat:
            raise NotFoundException(detail="Чат не найден")
        total, rows = await self.message_repository.list_for_chat(chat.id, pagination)
        return PaginationResponseModel(
            total=total,
            page=pagination.page,
            size=pagination.size,
            items=[
                MessageSchema.model_validate(row, from_attributes=True) 
                for row in reversed(rows)
            ],
        )

    async def build_typing_event(
        self,
        match_id: UUID,
        chat_id: UUID,
        user_id: UUID,
        is_typing: bool,
    ) -> ChatTypingSchema:
        chat = await self.chat_repository.get_chat_by_match_id(match_id, user_id)
        if not chat or chat.id != chat_id:
            raise NotFoundException(detail="Чат не найден")

        is_peer_banned = await self.chat_repository.get_peer_ban_status_by_chat_id(
            chat_id,
            user_id,
        )
        if is_peer_banned:
            raise BadRequestException(
                "Нельзя отправлять, изменять, удалять или отвечать на сообщения "
                "в чате с забаненным пользователем"
            )

        return ChatTypingSchema(
            user_id=user_id,
            chat_id=chat_id,
            is_typing=is_typing,
        )
