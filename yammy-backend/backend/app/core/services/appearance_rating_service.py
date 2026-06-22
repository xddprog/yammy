from uuid import UUID

from app.core.repositories.appearance_rating_repository import AppearanceRatingRepository
from app.core.repositories.user_repository import UserRepository
from app.core.clients.redis_client import RedisClient
from app.core.dto.appearance_rating import (
    AppearanceRatingPairState,
    AppearanceRatingReceivedItem,
)
from app.core.dto.pagination import PaginationRequestModel, PaginationResponseModel
from app.core.dto.user import UserSearchResponseSchema
from app.infrastructure.database.models.user import User
from app.utils.constants.cache_keys import AppearanceRatingCacheKeys
from app.infrastructure.logging.logger import get_logger


logger = get_logger(__name__)


class AppearanceRatingService:
    RATED_TTL = 60 * 60

    def __init__(
        self,
        appearance_rating_repository: AppearanceRatingRepository,
        user_repository: UserRepository,
        redis_client: RedisClient,
    ):
        self.appearance_rating_repository = appearance_rating_repository
        self.user_repository = user_repository
        self.redis_client = redis_client

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
        field = f"{rater_user_id}:{rated_user_id}:{score}"
        await self.redis_client.sadd(AppearanceRatingCacheKeys.APPEARANCE_RATING_BUFFER, field)

        rated_key = AppearanceRatingCacheKeys.APPEARANCE_RATED_USERS.format(user_id=rater_user_id)
        await self.redis_client.sadd(rated_key, str(rated_user_id), ttl=self.RATED_TTL)

        pair = await self.appearance_rating_repository.upsert_score(
            rater_user_id=rater_user_id,
            rated_user_id=rated_user_id,
            score=score,
        )

        await self._maybe_notify_mutual(pair, rater_user_id, rated_user_id)

        logger.info(
            "Appearance rating added",
            rater_user_id=str(rater_user_id),
            rated_user_id=str(rated_user_id),
            score=score,
        )

    async def flush_appearance_ratings_to_db(self) -> dict[str, int]:
        processing_key = f"{AppearanceRatingCacheKeys.APPEARANCE_RATING_BUFFER}:processing"
        all_ratings = await self.redis_client.smembers(processing_key)
        if not all_ratings:
            swapped = await self.redis_client.rename_key(
                AppearanceRatingCacheKeys.APPEARANCE_RATING_BUFFER,
                processing_key,
            )
            if not swapped:
                return {"flushed": 0}
            all_ratings = await self.redis_client.smembers(processing_key)

        if not all_ratings:
            await self.redis_client.delete_by_key(processing_key)
            return {"flushed": 0}

        values = []
        for field in all_ratings:
            parts = field.split(":")
            if len(parts) != 3:
                logger.warning("Invalid appearance rating buffer entry", entry=field)
                continue

            rater_id, rated_id, score = parts
            values.append({
                "rater_user_id": rater_id,
                "rated_user_id": rated_id,
                "score": int(score),
            })

        if not values:
            await self.redis_client.delete_by_key(processing_key)
            return {"flushed": 0}

        pairs = await self.appearance_rating_repository.batch_upsert_scores(values)
        await self.redis_client.delete_by_key(processing_key)

        notified = 0
        for rating, pair in zip(values, pairs):
            if await self._maybe_notify_mutual(
                pair,
                UUID(str(rating["rater_user_id"])),
                UUID(str(rating["rated_user_id"])),
            ):
                notified += 1

        logger.info("Appearance ratings flushed to DB", count=len(values), mutual_notified=notified)

        return {"flushed": len(values), "mutual_notified": notified}

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
