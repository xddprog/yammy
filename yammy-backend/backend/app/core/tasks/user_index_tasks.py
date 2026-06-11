from datetime import datetime
from uuid import UUID

from dishka.integrations.taskiq import FromDishka, inject

from app.core.clients.redis_client import RedisClient
from app.core.clients.taskiq_client import broker
from app.core.services.user_index_service import UserIndexService
from app.infrastructure.logging.logger import get_logger
from app.utils.constants.cache_keys import PresenceKeys


logger = get_logger(__name__)


@broker.task("reindex_user_in_es", retry_on_error=True, max_retries=8, delay=20)
@inject(patch_module=True)
async def reindex_user_in_es(
    user_id: str,
    include_personality_vector: bool,
    user_index_service: FromDishka[UserIndexService],
) -> None:
    await user_index_service.upsert_user(
        UUID(user_id),
        include_personality_vector=include_personality_vector,
    )


@broker.task("sync_user_ban_status_to_es", retry_on_error=True, max_retries=8, delay=20)
@inject(patch_module=True)
async def sync_user_ban_status_to_es(
    user_id: str,
    is_banned: bool,
    user_index_service: FromDishka[UserIndexService],
) -> None:
    await user_index_service.update_ban_status(UUID(user_id), is_banned=is_banned)


@broker.task(
    "flush_presence_last_seen_to_es",
    schedule=[{"cron": "*/5 * * * *"}],
    retry_on_error=True,
    max_retries=5,
    delay=20,
)
@inject(patch_module=True)
async def flush_presence_last_seen_to_es(
    redis_client: FromDishka[RedisClient],
    user_index_service: FromDishka[UserIndexService],
) -> dict[str, int]:
    data = await redis_client.hgetall(PresenceKeys.LAST_SEEN_BUFFER_PROCESSING)
    if not data:
        swapped = await redis_client.rename_key(
            PresenceKeys.LAST_SEEN_BUFFER,
            PresenceKeys.LAST_SEEN_BUFFER_PROCESSING,
        )
        if not swapped:
            return {"flushed": 0}
        data = await redis_client.hgetall(PresenceKeys.LAST_SEEN_BUFFER_PROCESSING)

    if not data:
        await redis_client.delete_by_key(PresenceKeys.LAST_SEEN_BUFFER_PROCESSING)
        return {"flushed": 0}

    flushed = 0
    for user_id, iso_datetime in data.items():
        try:
            parsed_dt = datetime.fromisoformat(iso_datetime)
            await user_index_service.update_last_seen(UUID(user_id), parsed_dt)
            flushed += 1
        except Exception:
            logger.exception("presence_last_seen_sync_failed", user_id=user_id)

    await redis_client.delete_by_key(PresenceKeys.LAST_SEEN_BUFFER_PROCESSING)
    return {"flushed": flushed}


@broker.task(
    "reconcile_users_index_daily",
    schedule=[{"cron": "0 4 * * *"}],
    retry_on_error=True,
    max_retries=3,
    delay=60,
)
@inject(patch_module=True)
async def reconcile_users_index_daily(
    user_index_service: FromDishka[UserIndexService],
) -> dict[str, int]:
    synced = await user_index_service.reconcile_recent_users(hours_back=48, limit=1000)
    return {"synced": synced}
