from uuid import UUID

from sqlalchemy import exists, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, load_only, noload, selectinload

from app.core.repositories.base import SqlAlchemyRepository
from app.core.dto.pagination import PaginationRequestModel
from app.infrastructure.database.models import Message, User
from app.infrastructure.database.models.message import MessagePhoto


class MessageRepository(SqlAlchemyRepository[Message]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Message)

    @staticmethod
    def _message_load_options():
        return 

    async def get_message_short_info(self, message_id: UUID) -> Message | None:
        return await self.session.get(Message, message_id)

    def _item_options(self):
        return (
            selectinload(Message.sender).options(
                joinedload(User.main_photo),
                load_only(User.id, User.name, User.last_seen),
            ),
            selectinload(Message.images),
            selectinload(Message.reply_to).options(
                selectinload(Message.sender).options(
                    joinedload(User.main_photo),
                    load_only(User.id, User.name, User.last_seen),
                ),
                selectinload(Message.images),
                noload(Message.reply_to),
            ),
        )

    async def list_for_chat(
        self, chat_id: UUID, pagination: PaginationRequestModel
    ) -> tuple[int, list[Message]]:
        base = (
            select(Message)
            .where(Message.chat_id == chat_id)
            .order_by(Message.created_at.desc())
        )
        total = await self.get_total(base)
        query = base.offset(pagination.offset).limit(pagination.size).options(*self._item_options())
        result = await self.session.execute(query)
        return total, list(result.scalars().all())

    async def list_text_excerpts_for_chat(self, chat_id: UUID) -> list[tuple[UUID, str, object, bool]]:
        has_photos = (
            select(1)
            .where(MessagePhoto.message_id == Message.id)
            .correlate(Message)
            .exists()
        )
        query = (
            select(Message.sender_id, Message.content, Message.created_at, has_photos)
            .where(
                Message.chat_id == chat_id,
                Message.is_deleted.is_(False),
            )
            .order_by(Message.created_at.asc(), Message.id.asc())
        )
        result = await self.session.execute(query)
        return list(result.tuples().all())

    async def get_item(self, item_id: str) -> Message | None:
        query = (
            select(Message)
            .where(Message.id == item_id)
            .options(*self._item_options())
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def add_item(
        self,
        chat_id: UUID,
        sender_id: UUID,
        content: str,
        reply_to_id: UUID | None = None,
        images: list[str] | None = None,
    ) -> Message:
        message = Message(
            chat_id=chat_id,
            sender_id=sender_id,
            content=content,
            reply_to_id=reply_to_id,
        )
        self.session.add(message)
        await self.session.flush()
        
        message_id = message.id

        for order, path in enumerate(images or []):
            self.session.add(
                MessagePhoto(
                    message_id=message_id,
                    file_path=path,
                    order=order,
                )
            )

        await self.session.commit()
        return await self.get_item(message_id)

    async def update_item(self, item_id: str, **update_values) -> Message | None:
        await super().update_item(item_id, **update_values)
        return await self.get_item(item_id)

    async def delete_item(self, message_id: UUID, user_id: UUID) -> tuple[Message | None, list[str]]:
        query = (
            select(Message)
            .where(Message.id == message_id)
            .options(selectinload(Message.images))
        )
        result = await self.session.execute(query)
        message = result.scalar_one_or_none()
        if not message or message.sender_id != user_id or message.is_deleted:
            return None, []

        image_paths = [photo.file_path for photo in message.images]
        for photo in list(message.images):
            await self.session.delete(photo)

        message.previous_version = message.content
        message.is_deleted = True
        message.content = "Сообщение было удалено"
        await self.session.commit()
        return await self.get_item(message_id), image_paths
