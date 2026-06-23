from uuid import UUID

from app.core.repositories.user_repository import UserRepository
from app.core.services.user_index_service import UserIndexService
from app.infrastructure.logging.logger import get_logger
from app.utils.constants.moderation_constants import (
    ADEQUACY_SCORE_MAX,
    ADEQUACY_SCORE_MIN,
    REPORT_ADEQUACY_PENALTY,
)


logger = get_logger(__name__)


class AdequacyScoreService:
    def __init__(
        self,
        user_repository: UserRepository,
        user_index_service: UserIndexService,
    ):
        self.user_repository = user_repository
        self.user_index_service = user_index_service

    @staticmethod
    def _clamp_score(score: float) -> float:
        return round(max(ADEQUACY_SCORE_MIN, min(ADEQUACY_SCORE_MAX, score)), 1)

    async def _sync_user(self, user_id: UUID) -> None:
        await self.user_index_service.upsert_user(user_id, include_personality_vector=False)

    async def apply_report_penalty(self, user_id: UUID) -> float | None:
        new_score = await self.user_repository.adjust_adequacy_score(
            user_id,
            -REPORT_ADEQUACY_PENALTY,
        )
        if new_score is None:
            return None

        await self._sync_user(user_id)
        logger.info(
            "adequacy_score_report_penalty_applied",
            user_id=str(user_id),
            penalty=REPORT_ADEQUACY_PENALTY,
            adequacy_score=new_score,
        )
        return new_score

    async def restore_report_penalty(self, user_id: UUID) -> float | None:
        new_score = await self.user_repository.adjust_adequacy_score(
            user_id,
            REPORT_ADEQUACY_PENALTY,
        )
        if new_score is None:
            return None

        await self._sync_user(user_id)
        logger.info(
            "adequacy_score_report_penalty_restored",
            user_id=str(user_id),
            penalty=REPORT_ADEQUACY_PENALTY,
            adequacy_score=new_score,
        )
        return new_score
