from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dto.pagination import PaginationRequestModel
from app.core.repositories.base import SqlAlchemyRepository
from app.infrastructure.database.models.support_conversation import SupportConversation
from app.infrastructure.database.models.support_message import SupportMessage
from app.infrastructure.database.models.user import User
from app.utils.constants.enums import (
    SupportConversationStatusEnum,
    SupportMessageDirectionEnum,
    SupportRequestTypeEnum,
)


class SupportRepository(SqlAlchemyRepository[SupportConversation]):
    def __init__(self, session: AsyncSession):
        super().__init__(session=session, model=SupportConversation)

    async def get_by_telegram_message_id(self, telegram_message_id: int) -> SupportMessage | None:
        query = select(SupportMessage).where(
            SupportMessage.telegram_message_id == telegram_message_id
        )
        result = await self.session.execute(query)
        return result.scalars().one_or_none()

    async def get_open_conversation(self, telegram_id: int) -> SupportConversation | None:
        query = (
            select(SupportConversation)
            .where(
                SupportConversation.telegram_id == telegram_id,
                SupportConversation.status == SupportConversationStatusEnum.OPEN,
            )
            .order_by(desc(SupportConversation.last_message_at))
            .limit(1)
        )
        result = await self.session.execute(query)
        return result.scalars().one_or_none()

    async def list_by_telegram_id(self, telegram_id: int, limit: int = 20) -> list[SupportConversation]:
        query = (
            select(SupportConversation)
            .where(SupportConversation.telegram_id == telegram_id)
            .options(selectinload(SupportConversation.messages))
            .order_by(desc(SupportConversation.last_message_at), desc(SupportConversation.created_at))
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def list_for_admin(
        self,
        pagination: PaginationRequestModel,
        status: SupportConversationStatusEnum | None = None,
    ) -> tuple[list[SupportConversation], int]:
        query = select(SupportConversation).options(selectinload(SupportConversation.messages))
        if status is not None:
            query = query.where(SupportConversation.status == status)
        query = query.order_by(
            desc(SupportConversation.last_message_at),
            desc(SupportConversation.created_at),
        )
        total = await self.get_total(query)
        query = query.offset(pagination.offset).limit(pagination.size)
        result = await self.session.execute(query)
        return list(result.scalars().unique().all()), total

    async def get_with_messages(self, conversation_id: UUID) -> SupportConversation | None:
        query = (
            select(SupportConversation)
            .where(SupportConversation.id == conversation_id)
            .options(selectinload(SupportConversation.messages))
        )
        result = await self.session.execute(query)
        return result.scalars().unique().one_or_none()

    async def list_messages(
        self,
        conversation_id: UUID,
        pagination: PaginationRequestModel,
    ) -> tuple[list[SupportMessage], int]:
        query = (
            select(SupportMessage)
            .where(SupportMessage.conversation_id == conversation_id)
            .order_by(SupportMessage.created_at)
        )
        total = await self.get_total(query)
        query = query.offset(pagination.offset).limit(pagination.size)
        result = await self.session.execute(query)
        return list(result.scalars().all()), total

    async def get_user_preview(self, user_id: UUID) -> User | None:
        query = select(User).where(User.id == user_id).options(selectinload(User.photos))
        result = await self.session.execute(query)
        return result.scalars().one_or_none()

    async def create_conversation(
        self,
        *,
        telegram_id: int,
        user_id: UUID | None,
        request_type: SupportRequestTypeEnum,
    ) -> SupportConversation:
        now = datetime.now(timezone.utc)
        conversation = SupportConversation(
            telegram_id=telegram_id,
            user_id=user_id,
            request_type=request_type,
            status=SupportConversationStatusEnum.OPEN,
            last_message_at=now,
        )
        self.session.add(conversation)
        await self.session.flush()
        return conversation

    async def add_message(
        self,
        *,
        conversation_id: UUID,
        direction: SupportMessageDirectionEnum,
        content: str,
        admin_id: UUID | None = None,
        telegram_message_id: int | None = None,
    ) -> SupportMessage:
        message = SupportMessage(
            conversation_id=conversation_id,
            direction=direction,
            content=content,
            admin_id=admin_id,
            telegram_message_id=telegram_message_id,
        )
        self.session.add(message)
        now = datetime.now(timezone.utc)
        await self.session.execute(
            SupportConversation.__table__.update()
            .where(SupportConversation.id == conversation_id)
            .values(last_message_at=now)
        )
        await self.session.flush()
        return message

    async def update_status(
        self,
        conversation_id: UUID,
        status: SupportConversationStatusEnum,
    ) -> SupportConversation | None:
        conversation = await self.session.get(SupportConversation, conversation_id)
        if conversation is None:
            return None
        conversation.status = status
        await self.session.flush()
        return conversation

    async def get_last_message_preview(self, conversation_id: UUID) -> str | None:
        query = (
            select(SupportMessage.content)
            .where(SupportMessage.conversation_id == conversation_id)
            .order_by(desc(SupportMessage.created_at))
            .limit(1)
        )
        return await self.session.scalar(query)

    async def count_open_for_telegram(self, telegram_id: int) -> int:
        query = select(func.count()).select_from(SupportConversation).where(
            SupportConversation.telegram_id == telegram_id,
            SupportConversation.status == SupportConversationStatusEnum.OPEN,
        )
        return int(await self.session.scalar(query) or 0)

    async def commit(self) -> None:
        await self.session.commit()

    async def rollback(self) -> None:
        await self.session.rollback()
