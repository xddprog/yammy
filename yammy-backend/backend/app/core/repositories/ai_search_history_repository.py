from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base import SqlAlchemyRepository
from app.infrastructure.database.models.ai_search_history import AiSearchHistory
from app.utils.constants.enums import AiSearchHistoryStatusEnum


class AiSearchHistoryRepository(SqlAlchemyRepository[AiSearchHistory]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, AiSearchHistory)

    async def list_by_user(self, user_id: UUID, limit: int = 50) -> list[AiSearchHistory]:
        result = await self.session.execute(
            select(AiSearchHistory)
            .where(AiSearchHistory.user_id == user_id)
            .order_by(AiSearchHistory.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_id_and_user(self, history_id: UUID, user_id: UUID) -> AiSearchHistory | None:
        result = await self.session.execute(
            select(AiSearchHistory).where(
                AiSearchHistory.id == history_id,
                AiSearchHistory.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def count_since(self, user_id: UUID, since: datetime) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(AiSearchHistory)
            .where(
                AiSearchHistory.user_id == user_id,
                AiSearchHistory.created_at >= since,
                AiSearchHistory.status != AiSearchHistoryStatusEnum.FAILED,
            )
        )
        return int(result.scalar_one())
