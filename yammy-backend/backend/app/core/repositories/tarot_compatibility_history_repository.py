from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories.base import SqlAlchemyRepository
from app.infrastructure.database.models.tarot_compatibility_history import TarotCompatibilityHistory
from app.utils.constants.enums import AiSearchHistoryStatusEnum


class TarotCompatibilityHistoryRepository(SqlAlchemyRepository[TarotCompatibilityHistory]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, TarotCompatibilityHistory)

    async def list_by_user(self, user_id: UUID, limit: int = 50) -> list[TarotCompatibilityHistory]:
        result = await self.session.execute(
            select(TarotCompatibilityHistory)
            .where(TarotCompatibilityHistory.user_id == user_id)
            .order_by(TarotCompatibilityHistory.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_id_and_user(self, history_id: UUID, user_id: UUID) -> TarotCompatibilityHistory | None:
        result = await self.session.execute(
            select(TarotCompatibilityHistory).where(
                TarotCompatibilityHistory.id == history_id,
                TarotCompatibilityHistory.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_latest_for_pair(
        self,
        user_id: UUID,
        partner_user_id: UUID,
    ) -> TarotCompatibilityHistory | None:
        result = await self.session.execute(
            select(TarotCompatibilityHistory)
            .where(
                TarotCompatibilityHistory.user_id == user_id,
                TarotCompatibilityHistory.partner_user_id == partner_user_id,
            )
            .order_by(TarotCompatibilityHistory.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_latest_ready_for_pair(
        self,
        user_id: UUID,
        partner_user_id: UUID,
    ) -> TarotCompatibilityHistory | None:
        result = await self.session.execute(
            select(TarotCompatibilityHistory)
            .where(
                TarotCompatibilityHistory.user_id == user_id,
                TarotCompatibilityHistory.partner_user_id == partner_user_id,
                TarotCompatibilityHistory.status == AiSearchHistoryStatusEnum.READY,
            )
            .order_by(TarotCompatibilityHistory.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def count_since(self, user_id: UUID, since: datetime) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(TarotCompatibilityHistory)
            .where(
                TarotCompatibilityHistory.user_id == user_id,
                TarotCompatibilityHistory.created_at >= since,
                TarotCompatibilityHistory.status != AiSearchHistoryStatusEnum.FAILED,
            )
        )
        return int(result.scalar_one())
