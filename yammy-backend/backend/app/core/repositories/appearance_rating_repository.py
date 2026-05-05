from uuid import UUID
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.repositories.base import SqlAlchemyRepository
from app.infrastructure.database.models.rating import Rating


class AppearanceRatingRepository(SqlAlchemyRepository[Rating]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Rating)
    
    async def batch_create_appearance_ratings(self, rating_buffer: list[dict[str, str | int]]):
        query = (
            pg_insert(Rating)
            .values(
                [
                    {
                        "rater_user_id": rating["rater_user_id"],
                        "rated_user_id": rating["rated_user_id"],
                        "score": rating["score"]
                    }
                    for rating in rating_buffer
                ]
            )
            .on_conflict_do_nothing(index_elements=["rater_user_id", "rated_user_id"])
        )
        await self.session.execute(query)
        await self.session.commit()
    
    async def get_all_rated_user_ids(self, user_id: UUID) -> list[str]:
        query = select(Rating.rated_user_id).where(Rating.rater_user_id == user_id)
        result = await self.session.execute(query)
        return [str(row[0]) for row in result.scalars().all()]
