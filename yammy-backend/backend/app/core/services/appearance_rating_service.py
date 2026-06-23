from uuid import UUID

from app.core.repositories.appearance_rating_repository import AppearanceRatingRepository
from app.core.repositories.like_repository import LikeRepository
from app.core.repositories.user_repository import UserRepository
from app.core.clients.redis_client import RedisClient
from app.core.services.notification_service import NotificationService
from app.core.dto.appearance_rating import (
    AppearanceRatingPairState,
    AppearanceRatingReceivedItem,
)
from app.core.dto.pagination import PaginationRequestModel, PaginationResponseModel
from app.core.dto.user import UserSearchResponseSchema
from app.infrastructure.database.models.user import User
from app.infrastructure.errors.base import BadRequestException
from app.utils.constants.cache_keys import AppearanceRatingCacheKeys
from app.infrastructure.logging.logger import get_logger


logger = get_logger(__name__)


class AppearanceRatingService:
    RATED_TTL = 60 * 60

    def __init__(
        self,
        appearance_rating_repository: AppearanceRatingRepository,
        user_repository: UserRepository,
        like_repository: LikeRepository,
        redis_client: RedisClient,
        notification_service: NotificationService,
    ):
        self.appearance_rating_repository = appearance_rating_repository
        self.user_repository = user_repository
        self.like_repository = like_repository
        self.redis_client = redis_client
        self.notification_service = notification_service

    async def get_received_appearance_ratings(
        self,
        current_user: User,
        pagination: PaginationRequestModel,
    ) -> PaginationResponseModel[AppearanceRatingReceivedItem]:
        total, received_rows = await self.appearance_rating_repository.get_received_ratings(
            current_user.id,
            pagination,
        )
        if not received_rows:
            return PaginationResponseModel(
                total=0,
                page=pagination.page,
                size=pagination.size,
                items=[],
            )

        user_ids = [row.other_user_id for row in received_rows]
        users = await self.user_repository.get_users_for_search_feed_by_ids(user_ids)
        user_map = {str(user.id): user for user in users}

        results: list[AppearanceRatingReceivedItem] = []
        for row in received_rows:
            user = user_map.get(str(row.other_user_id))
            if user is None:
                continue
            user_schema = UserSearchResponseSchema.model_validate(user, from_attributes=True)
            results.append(
                AppearanceRatingReceivedItem(
                    **user_schema.model_dump(),
                    score=row.score,
                    my_score=row.my_score,
                    is_mutual=row.is_mutual,
                )
            )

        return PaginationResponseModel(
            total=total,
            page=pagination.page,
            size=pagination.size,
            items=results,
        )

    async def add_appearance_rating(self, rater_user_id: UUID, rated_user_id: UUID, score: int):
        if rater_user_id == rated_user_id:
            raise BadRequestException("Нельзя оценить внешность самого себя")

        if await self.like_repository.has_match(rater_user_id, rated_user_id):
            raise BadRequestException("Нельзя оценивать внешность пользователя, с которым у вас метч")

        rated_key = AppearanceRatingCacheKeys.APPEARANCE_RATED_USERS.format(user_id=rater_user_id)
        await self.redis_client.sadd(rated_key, str(rated_user_id), ttl=self.RATED_TTL)

        pair = await self.appearance_rating_repository.upsert_score(
            rater_user_id=rater_user_id,
            rated_user_id=rated_user_id,
            score=score,
        )

        rater = await self.user_repository.get_item(str(rater_user_id))
        if rater:
            await self._notify_appearance_rating_async(
                rated_user_id,
                rater_user_id,
                rater.name,
                score,
            )

        await self._maybe_notify_mutual(pair, rater_user_id, rated_user_id)

        logger.info(
            "Appearance rating added",
            rater_user_id=str(rater_user_id),
            rated_user_id=str(rated_user_id),
            score=score,
        )

    async def _maybe_notify_mutual(
        self,
        pair: AppearanceRatingPairState,
        rater_user_id: UUID,
        rated_user_id: UUID,
    ) -> bool:
        if pair.score_by_a is None or pair.score_by_b is None:
            return False
        if pair.mutual_notified_at is not None:
            return False

        from app.core.tasks.notifications_task import send_mutual_appearance_rating_notification

        marked = await self.appearance_rating_repository.mark_mutual_notified(pair.id)
        if not marked:
            return False

        await send_mutual_appearance_rating_notification.kiq(
            str(pair.user_a_id),
            str(pair.user_b_id),
            str(pair.id),
        )

        logger.info(
            "mutual_appearance_rating_notification_queued",
            pair_id=str(pair.id),
            rater_user_id=str(rater_user_id),
            rated_user_id=str(rated_user_id),
        )
        return True

    async def _notify_appearance_rating_async(
        self,
        rated_user_id: UUID,
        rater_user_id: UUID,
        rater_name: str,
        score: int,
    ) -> None:
        from app.core.tasks.notifications_task import send_appearance_rating_notification

        try:
            await send_appearance_rating_notification.kiq(
                str(rated_user_id),
                str(rater_user_id),
                rater_name,
                score,
            )
        except Exception:
            recipient = await self.user_repository.get_item(str(rated_user_id))
            if not recipient:
                return
            await self.notification_service.notify_user_appearance_rated(
                recipient,
                rater_name,
                score,
            )
