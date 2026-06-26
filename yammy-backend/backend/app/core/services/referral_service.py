import re
from uuid import UUID

from app.core.clients.redis_client import RedisClient
from app.core.repositories.user_repository import UserRepository
from app.core.services.notification_service import NotificationService
from app.core.services.user_index_service import UserIndexService
from app.infrastructure.logging.logger import get_logger
from app.utils.constants.cache_keys import ReferralCacheKeys
from app.utils.constants.referral_constants import (
    REFERRAL_CODE_LENGTH,
    REFERRAL_CODE_PREFIX,
    REFERRAL_PENDING_TTL_SECONDS,
    REFERRAL_REWARD_BOOSTS,
    REFERRAL_REWARD_SUPERLIKES,
)

logger = get_logger(__name__)

_REFERRAL_CODE_PATTERN = re.compile(
    rf"^{re.escape(REFERRAL_CODE_PREFIX)}[A-F0-9]{{{REFERRAL_CODE_LENGTH - len(REFERRAL_CODE_PREFIX)}}}$"
)


class ReferralService:
    def __init__(
        self,
        redis_client: RedisClient,
        user_repository: UserRepository,
        user_index_service: UserIndexService,
        notification_service: NotificationService,
    ):
        self._redis = redis_client
        self._user_repository = user_repository
        self._user_index_service = user_index_service
        self._notification_service = notification_service

    @staticmethod
    def normalize_referral_code(raw: str | None) -> str | None:
        if not raw:
            return None
        code = raw.strip().upper()
        if not _REFERRAL_CODE_PATTERN.match(code):
            return None
        return code

    async def save_pending_referral(self, telegram_id: int, raw_code: str) -> None:
        code = self.normalize_referral_code(raw_code)
        if not code:
            return

        key = ReferralCacheKeys.pending(telegram_id)
        stored = await self._redis.set_if_not_exists(
            key,
            code,
            ttl=REFERRAL_PENDING_TTL_SECONDS,
        )
        if stored:
            logger.info("referral_pending_saved", telegram_id=telegram_id, code=code)

    async def _read_pending_code(self, telegram_id: int) -> str | None:
        key = ReferralCacheKeys.pending(telegram_id)
        raw = await self._redis.redis.get(key)
        if not raw:
            return None
        if isinstance(raw, bytes):
            raw = raw.decode()
        return self.normalize_referral_code(str(raw))

    async def clear_pending(self, telegram_id: int) -> None:
        await self._redis.delete_by_key(ReferralCacheKeys.pending(telegram_id))

    async def resolve_referrer_id(
        self,
        telegram_id: int,
        explicit_code: str | None = None,
    ) -> UUID | None:
        code = self.normalize_referral_code(explicit_code)
        if not code:
            code = await self._read_pending_code(telegram_id)
        if not code:
            return None

        referrer = await self._user_repository.get_by_referral_code(code)
        if not referrer:
            logger.warning("referral_code_not_found", code=code, telegram_id=telegram_id)
            return None

        if referrer.telegram_id == telegram_id:
            logger.info("referral_self_rejected", telegram_id=telegram_id, code=code)
            return None

        return referrer.id

    async def grant_referrer_reward(self, referrer_id: UUID, referee_name: str) -> None:
        await self._user_repository.grant_referral_rewards(
            referrer_id,
            superlikes=REFERRAL_REWARD_SUPERLIKES,
            boosts=REFERRAL_REWARD_BOOSTS,
        )
        await self._user_index_service.upsert_user(
            referrer_id,
            include_personality_vector=False,
        )

        referrer = await self._user_repository.get_item(str(referrer_id))
        if referrer:
            await self._notification_service.notify_referral_reward(referrer, referee_name)

        logger.info(
            "referral_reward_granted",
            referrer_id=str(referrer_id),
            superlikes=REFERRAL_REWARD_SUPERLIKES,
            boosts=REFERRAL_REWARD_BOOSTS,
        )
