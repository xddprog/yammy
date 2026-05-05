from uuid import UUID
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base import SqlAlchemyRepository
from app.infrastructure.database.models.chat import Chat
from app.infrastructure.database.models import Match, Message, User
from sqlalchemy.orm import selectinload


class ChatRepository(SqlAlchemyRepository[Chat]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Chat)

    async def get_chat_by_match_id(self, match_id: UUID, user_id: UUID) -> Chat | None:
        query = (
            select(Chat)
            .join(Match, Match.id == Chat.match_id)
            .where(
                Match.id == match_id,
                or_(
                    Match.user1_id == user_id,
                    Match.user2_id == user_id
                )
            )
            .options(
                selectinload(Chat.messages).options(
                    selectinload(Message.sender).load_only(
                        User.id, 
                        User.name, 
                        User.main_photo,
                        User.last_seen,
                    ),
                    selectinload(Message.reply_to).selectinload(
                        Message.sender
                    ).load_only(User.name)
                )
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()