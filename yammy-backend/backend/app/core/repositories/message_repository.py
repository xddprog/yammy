from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.database.models import Message
from app.core.repositories.base import SqlAlchemyRepository


class MessageRepository(SqlAlchemyRepository[Message]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Message)
    
    async def delete_item(self, message_id: UUID, user_id: UUID):
        message = await self.get_item(message_id)
        if not message or message.sender_id != user_id or message.is_deleted:
            return None
        
        message.is_deleted = True
        await self.session.commit()
        await self.session.refresh(message)
        return message