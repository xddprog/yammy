from uuid import UUID

from sqlalchemy import select
from app.infrastructure.database.models.like import Like
from app.infrastructure.database.models.match import Match
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.core.repositories.base import SqlAlchemyRepository
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils.enums import LikeTypeEnum

class LikeRepository(SqlAlchemyRepository[Like]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Like)

    async def add_item(self, user_from_id: UUID, user_to_id: UUID, like_type: LikeTypeEnum):
        query = (
            pg_insert(Like)
            .values(
                [
                    {
                        "user_from_id": user_from_id,
                        "user_to_id": user_to_id,
                        "like_type": like_type
                    }
                ]
            )
            .on_conflict_do_nothing(index_elements=["user_from_id", "user_to_id"])
        )
        await self.session.execute(query)
        await self.session.commit()
    
    async def batch_create_dislikes(self, dislike_buffer: list[dict[str, str]]):
        query = (
            pg_insert(Like)
            .values(
                [
                    {
                        "user_from_id": dislike["user_from_id"], 
                        "user_to_id": dislike["user_to_id"], 
                        "like_type": LikeTypeEnum.DISLIKE
                    }
                    for dislike in dislike_buffer
                ]
            )
            .on_conflict_do_nothing(index_elements=["user_from_id", "user_to_id"])
        )
        await self.session.execute(query)
        await self.session.commit()

    async def get_all_seen_user_ids(self, user_id: UUID) -> list[UUID]:
        query_sent = select(Like.user_to_id).where(Like.user_from_id == user_id)
        query_received = select(Like.user_from_id).where(Like.user_to_id == user_id)
        
        query = query_sent.union(query_received)
        
        result = await self.session.execute(query)
        return [str(row) for row in result.scalars().all()]

    async def create_match(self, user_from_id: UUID, user_to_id: UUID):
        query = (
            pg_insert(Match)
            .values(
                [
                    {
                        "user1_id": user_from_id,
                        "user2_id": user_to_id
                    }
                ]
            )
            .on_conflict_do_nothing(index_elements=["user1_id", "user2_id"])
        )
        await self.session.execute(query)
        await self.session.commit()