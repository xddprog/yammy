from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, load_only, noload, selectinload

from app.core.repositories.base import SqlAlchemyRepository
from app.infrastructure.database.models import Message, User
from app.infrastructure.database.models.message import MessagePhoto


class MessageRepository(SqlAlchemyRepository[Message]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Message)

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

        for order, path in enumerate(images):
            self.session.add(
                MessagePhoto(
                    message_id=message.id,
                    file_path=path,
                    order=order,
                )
            )

        await self.session.commit()
        await self.session.refresh(message)

        query = (
            select(Message)
            .where(Message.id == message.id)
            .options(
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
        )
        result = await self.session.execute(query)
        return result.scalar_one()

    async def delete_item(self, message_id: UUID, user_id: UUID):
        message = await self.get_item(message_id)
        if not message or message.sender_id != user_id or message.is_deleted:
            return None

        message.is_deleted = True
        await self.session.commit()
        await self.session.refresh(message)
        return message
