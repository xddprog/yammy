from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import and_, case, func, or_, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dto.appearance_rating import (
    AppearanceRatingPairState,
    AppearanceRatingReceivedRow,
    AppearanceRatingStatsSchema,
)
from app.core.dto.pagination import PaginationRequestModel
from app.core.repositories.base import SqlAlchemyRepository
from app.infrastructure.database.models.appearance_rating_pair import AppearanceRatingPair
from app.utils.helpers.appearance_rating_pair import canonical_pair


class AppearanceRatingRepository(SqlAlchemyRepository[AppearanceRatingPair]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, AppearanceRatingPair)

    @staticmethod
    def _received_filter(user_id: UUID):
        return or_(
            and_(
                AppearanceRatingPair.user_a_id == user_id,
                AppearanceRatingPair.score_by_b.is_not(None),
            ),
            and_(
                AppearanceRatingPair.user_b_id == user_id,
                AppearanceRatingPair.score_by_a.is_not(None),
            ),
        )

    @staticmethod
    def _pending_received_filter(user_id: UUID):
        """Входящие оценки, на которые пользователь ещё не ответил."""
        return or_(
            and_(
                AppearanceRatingPair.user_a_id == user_id,
                AppearanceRatingPair.score_by_b.is_not(None),
                AppearanceRatingPair.score_by_a.is_(None),
            ),
            and_(
                AppearanceRatingPair.user_b_id == user_id,
                AppearanceRatingPair.score_by_a.is_not(None),
                AppearanceRatingPair.score_by_b.is_(None),
            ),
        )

    @staticmethod
    def _received_score_expr(user_id: UUID):
        return case(
            (AppearanceRatingPair.user_a_id == user_id, AppearanceRatingPair.score_by_b),
            else_=AppearanceRatingPair.score_by_a,
        )

    @staticmethod
    def _received_at_expr(user_id: UUID):
        return case(
            (AppearanceRatingPair.user_a_id == user_id, AppearanceRatingPair.score_by_b_at),
            else_=AppearanceRatingPair.score_by_a_at,
        )

    async def upsert_score(
        self,
        rater_user_id: UUID,
        rated_user_id: UUID,
        score: int,
    ) -> AppearanceRatingPairState:
        user_a_id, user_b_id, rater_is_a = canonical_pair(rater_user_id, rated_user_id)
        now = datetime.now(timezone.utc)

        if rater_is_a:
            insert_values = {
                "user_a_id": user_a_id,
                "user_b_id": user_b_id,
                "score_by_a": score,
                "score_by_a_at": now,
            }
            update_values = {
                "score_by_a": score,
                "score_by_a_at": now,
            }
        else:
            insert_values = {
                "user_a_id": user_a_id,
                "user_b_id": user_b_id,
                "score_by_b": score,
                "score_by_b_at": now,
            }
            update_values = {
                "score_by_b": score,
                "score_by_b_at": now,
            }

        query = (
            pg_insert(AppearanceRatingPair)
            .values(**insert_values)
            .on_conflict_do_update(
                index_elements=["user_a_id", "user_b_id"],
                set_=update_values,
            )
            .returning(AppearanceRatingPair)
        )
        result = await self.session.execute(query)
        pair = result.scalar_one()
        state = AppearanceRatingPairState.model_validate(pair)
        await self.session.commit()
        return state

    async def get_pair(self, user_x: UUID, user_y: UUID) -> AppearanceRatingPair | None:
        user_a_id, user_b_id, _ = canonical_pair(user_x, user_y)
        query = select(AppearanceRatingPair).where(
            AppearanceRatingPair.user_a_id == user_a_id,
            AppearanceRatingPair.user_b_id == user_b_id,
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def mark_mutual_notified(self, pair_id: UUID) -> bool:
        now = datetime.now(timezone.utc)
        query = (
            update(AppearanceRatingPair)
            .where(
                AppearanceRatingPair.id == pair_id,
                AppearanceRatingPair.mutual_notified_at.is_(None),
                AppearanceRatingPair.score_by_a.is_not(None),
                AppearanceRatingPair.score_by_b.is_not(None),
            )
            .values(mutual_notified_at=now)
            .returning(AppearanceRatingPair.id)
        )
        result = await self.session.execute(query)
        marked = result.scalar_one_or_none() is not None
        await self.session.commit()
        return marked

    async def batch_upsert_scores(
        self, rating_buffer: list[dict[str, str | int]]
    ) -> list[AppearanceRatingPairState]:
        pairs: list[AppearanceRatingPairState] = []
        for rating in rating_buffer:
            pair = await self.upsert_score(
                rater_user_id=UUID(str(rating["rater_user_id"])),
                rated_user_id=UUID(str(rating["rated_user_id"])),
                score=int(rating["score"]),
            )
            pairs.append(pair)
        return pairs

    async def get_rated_user_ids(self, user_id: UUID) -> list[str]:
        query = select(AppearanceRatingPair).where(
            or_(
                and_(
                    AppearanceRatingPair.user_a_id == user_id,
                    AppearanceRatingPair.score_by_a.is_not(None),
                ),
                and_(
                    AppearanceRatingPair.user_b_id == user_id,
                    AppearanceRatingPair.score_by_b.is_not(None),
                ),
            )
        )
        result = await self.session.execute(query)
        rows = result.scalars().all()
        other_ids: list[str] = []
        for row in rows:
            if row.user_a_id == user_id:
                other_ids.append(str(row.user_b_id))
            else:
                other_ids.append(str(row.user_a_id))
        return other_ids

    async def get_received_rating_stats(self, user_id: UUID) -> AppearanceRatingStatsSchema:
        received_score = self._received_score_expr(user_id)
        count_query = select(func.count()).where(self._pending_received_filter(user_id))
        avg_query = select(func.avg(received_score)).where(self._received_filter(user_id))

        count_result = await self.session.execute(count_query)
        avg_result = await self.session.execute(avg_query)
        count = int(count_result.scalar_one())
        average = avg_result.scalar_one()
        average_score = round(float(average), 1) if average is not None else None
        return AppearanceRatingStatsSchema(
            received_count=count,
            average_score=average_score,
        )

    async def get_received_ratings(
        self,
        user_id: UUID,
        pagination: PaginationRequestModel,
    ) -> tuple[int, list[AppearanceRatingReceivedRow]]:
        pending_filter = self._pending_received_filter(user_id)
        sort_key = self._received_at_expr(user_id)
        query = (
            select(AppearanceRatingPair)
            .where(pending_filter)
            .order_by(sort_key.desc())
            .offset(pagination.offset)
            .limit(pagination.size)
        )
        result = await self.session.execute(query)
        pairs = list(result.scalars().all())

        if not pairs:
            return 0, []

        count_query = select(func.count()).select_from(AppearanceRatingPair).where(pending_filter)
        total_result = await self.session.execute(count_query)
        total = int(total_result.scalar_one())

        rows: list[AppearanceRatingReceivedRow] = []
        for pair in pairs:
            if pair.user_a_id == user_id:
                rows.append(
                    AppearanceRatingReceivedRow(
                        other_user_id=pair.user_b_id,
                        score=pair.score_by_b,  # type: ignore[arg-type]
                        my_score=None,
                        is_mutual=False,
                        pair_id=pair.id,
                    )
                )
            else:
                rows.append(
                    AppearanceRatingReceivedRow(
                        other_user_id=pair.user_a_id,
                        score=pair.score_by_a,  # type: ignore[arg-type]
                        my_score=None,
                        is_mutual=False,
                        pair_id=pair.id,
                    )
                )

        return total, rows
