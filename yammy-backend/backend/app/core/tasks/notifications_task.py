from dishka.integrations.taskiq import FromDishka, inject

from app.core.clients.redis_client import RedisClient
from app.core.clients.taskiq_client import broker
from app.core.repositories.user_repository import UserRepository
from app.core.services.notification_service import NotificationService
from app.infrastructure.logging.logger import get_logger
from app.utils.constants.cache_keys import LikeCacheKeys


logger = get_logger(__name__)

NOTIFICATION_DEDUP_TTL = 60 * 60


@broker.task("send_like_notification", retry_on_error=True, max_retries=10, delay=15)
@inject(patch_module=True)
async def send_like_notification(
    recipient_id: str,
    liker_name: str,
    like_type: str,
    user_repository: FromDishka[UserRepository],
    notification_service: FromDishka[NotificationService],
    redis_client: FromDishka[RedisClient],
) -> None:
    dedup_key = LikeCacheKeys.NOTIFY_LIKE_SENT.format(
        user_to_id=recipient_id,
        liker_name=liker_name,
        like_type=like_type,
    )
    allowed = await redis_client.set_if_not_exists(dedup_key, "1", ttl=NOTIFICATION_DEDUP_TTL)
    if not allowed:
        logger.info("like_notification_skipped_duplicate", recipient_id=recipient_id, like_type=like_type)
        return

    recipient = await user_repository.get_item(recipient_id)
    if not recipient:
        logger.warning("like_notification_user_not_found", recipient_id=recipient_id)
        return

    if like_type == "superlike":
        await notification_service.notify_user_superliked(recipient, liker_name)
    else:
        await notification_service.notify_user_liked(recipient, liker_name)


@broker.task("send_match_notification", retry_on_error=True, max_retries=10, delay=15)
@inject(patch_module=True)
async def send_match_notification(
    recipient_id: str,
    user_from_id: str,
    user_to_id: str,
    user_repository: FromDishka[UserRepository],
    notification_service: FromDishka[NotificationService],
    redis_client: FromDishka[RedisClient],
) -> None:
    pair_key = ":".join(sorted((user_from_id, user_to_id)))
    dedup_key = LikeCacheKeys.NOTIFY_MATCH_SENT.format(recipient_id=recipient_id, pair_key=pair_key)
    allowed = await redis_client.set_if_not_exists(dedup_key, "1", ttl=NOTIFICATION_DEDUP_TTL)
    if not allowed:
        logger.info("match_notification_skipped_duplicate", recipient_id=recipient_id, pair_key=pair_key)
        return

    recipient = await user_repository.get_item(recipient_id)
    if not recipient:
        logger.warning("match_notification_user_not_found", recipient_id=recipient_id)
        return

    await notification_service.notify_new_match(recipient)
    