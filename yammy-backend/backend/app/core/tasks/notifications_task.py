from uuid import UUID

from dishka.integrations.taskiq import FromDishka, inject

from app.core.clients.redis_client import RedisClient
from app.core.clients.taskiq_client import broker
from app.core.repositories.user_repository import UserRepository
from app.core.services.notification_service import NotificationService
from app.core.services.presence_service import PresenceService
from app.infrastructure.logging.logger import get_logger
from app.utils.constants.cache_keys import AppearanceRatingCacheKeys, LikeCacheKeys, MessageCacheKeys


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


@broker.task("send_chat_message_notification", retry_on_error=True, max_retries=10, delay=15)
@inject(patch_module=True)
async def send_chat_message_notification(
    recipient_id: str,
    sender_name: str,
    message_id: str,
    user_repository: FromDishka[UserRepository],
    notification_service: FromDishka[NotificationService],
    presence_service: FromDishka[PresenceService],
    redis_client: FromDishka[RedisClient],
) -> None:
    if await presence_service.is_user_online(UUID(recipient_id)):
        logger.info(
            "chat_message_notification_skipped_user_online",
            recipient_id=recipient_id,
            message_id=message_id,
        )
        return

    dedup_key = MessageCacheKeys.NOTIFY_CHAT_MESSAGE_SENT.format(message_id=message_id)
    allowed = await redis_client.set_if_not_exists(dedup_key, "1", ttl=NOTIFICATION_DEDUP_TTL)
    if not allowed:
        logger.info(
            "chat_message_notification_skipped_duplicate",
            recipient_id=recipient_id,
            message_id=message_id,
        )
        return

    recipient = await user_repository.get_item(recipient_id)
    if not recipient:
        logger.warning("chat_message_notification_user_not_found", recipient_id=recipient_id)
        return

    await notification_service.notify_new_chat_message(recipient, sender_name)


@broker.task("send_appearance_rating_notification", retry_on_error=True, max_retries=10, delay=15)
@inject(patch_module=True)
async def send_appearance_rating_notification(
    rated_user_id: str,
    rater_id: str,
    rater_name: str,
    score: int,
    user_repository: FromDishka[UserRepository],
    notification_service: FromDishka[NotificationService],
    redis_client: FromDishka[RedisClient],
) -> None:
    dedup_key = AppearanceRatingCacheKeys.NOTIFY_APPEARANCE_RATING_SENT.format(
        rated_user_id=rated_user_id,
        rater_id=rater_id,
        score=score,
    )
    allowed = await redis_client.set_if_not_exists(dedup_key, "1", ttl=NOTIFICATION_DEDUP_TTL)
    if not allowed:
        logger.info(
            "appearance_rating_notification_skipped_duplicate",
            rated_user_id=rated_user_id,
            rater_id=rater_id,
            score=score,
        )
        return

    recipient = await user_repository.get_item(rated_user_id)
    if not recipient:
        logger.warning("appearance_rating_notification_user_not_found", rated_user_id=rated_user_id)
        return

    await notification_service.notify_user_appearance_rated(recipient, rater_name, score)


@broker.task("send_mutual_appearance_rating_notification", retry_on_error=True, max_retries=10, delay=15)
@inject(patch_module=True)
async def send_mutual_appearance_rating_notification(
    user_a_id: str,
    user_b_id: str,
    pair_id: str,
    user_repository: FromDishka[UserRepository],
    notification_service: FromDishka[NotificationService],
    redis_client: FromDishka[RedisClient],
) -> None:
    dedup_key = AppearanceRatingCacheKeys.NOTIFY_MUTUAL_RATING_SENT.format(pair_id=pair_id)
    allowed = await redis_client.set_if_not_exists(dedup_key, "1", ttl=NOTIFICATION_DEDUP_TTL)
    if not allowed:
        logger.info("mutual_appearance_rating_notification_skipped_duplicate", pair_id=pair_id)
        return

    user_a = await user_repository.get_item(user_a_id)
    user_b = await user_repository.get_item(user_b_id)
    if not user_a or not user_b:
        logger.warning(
            "mutual_appearance_rating_notification_users_not_found",
            user_a_id=user_a_id,
            user_b_id=user_b_id,
        )
        return

    await notification_service.notify_mutual_appearance_rating(user_a, user_b)
    await notification_service.notify_mutual_appearance_rating(user_b, user_a)
    