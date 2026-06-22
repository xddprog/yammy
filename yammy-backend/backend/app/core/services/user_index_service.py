from datetime import datetime, timedelta, timezone
from uuid import UUID

from app.core.clients.elasticsearch_client import ElasticsearchClient
from app.core.services.ml_service import MLService
from app.core.dto.user import UserSearchResponseSchema
from app.core.repositories.user_repository import UserRepository
from app.infrastructure.logging.logger import get_logger


logger = get_logger(__name__)


class UserIndexService:
    def __init__(
        self,
        user_repository: UserRepository,
        elasticsearch_client: ElasticsearchClient,
        ml_service: MLService,
    ) -> None:
        self.user_repository = user_repository
        self.elasticsearch_client = elasticsearch_client
        self.ml_service = ml_service

    async def _build_document(self, user_id: UUID, include_personality_vector: bool) -> dict | None:
        user = await self.user_repository.get_user_for_index(user_id)
        if not user:
            return None

        es_data = UserSearchResponseSchema.model_validate(user, from_attributes=True)
        doc = es_data.model_dump(mode="json", by_alias=True, exclude_none=True)
        doc.update(
            {
                "subscription_tier": user.subscription_tier,
                "boost_expires_at": user.boost_expires_at,
                "last_seen": user.last_seen,
                "is_banned": user.is_banned,
                "adequacy_score": user.adequacy_score,
                "superlikes_balance": user.superlikes_balance,
                "boosts_balance": user.boosts_balance,
                "notifications_enabled": user.notifications_enabled,
                "language": user.language,
                "subscription_expires_at": user.subscription_expires_at,
            }
        )

        doc["filter_option_ids"] = [str(opt.id) for opt in user.filters]
        doc["specs"] = [
            f"{opt.subcategory.category.slug}:{opt.subcategory.slug}:{opt.slug}"
            for opt in user.filters
        ]

        if include_personality_vector:
            doc["personality_vector"] = await self.ml_service.get_embedding(user.bio)

        return doc

    async def build_document(self, user_id: UUID, include_personality_vector: bool) -> dict | None:
        return await self._build_document(user_id, include_personality_vector=include_personality_vector)

    async def upsert_user(self, user_id: UUID, include_personality_vector: bool = False) -> bool:
        doc = await self._build_document(user_id, include_personality_vector=include_personality_vector)
        if not doc:
            logger.warning("user_index_user_not_found", user_id=str(user_id))
            return False

        await self.elasticsearch_client.index_document(
            index="users",
            doc_id=str(user_id),
            document=doc,
        )
        return True

    async def update_ban_status(self, user_id: UUID, is_banned: bool) -> None:
        try:
            await self.elasticsearch_client.update_document(
                index="users",
                doc_id=str(user_id),
                document={"is_banned": is_banned},
            )
        except Exception:
            await self.upsert_user(user_id, include_personality_vector=False)

    async def update_last_seen(self, user_id: UUID, at: datetime) -> None:
        try:
            await self.elasticsearch_client.update_document(
                index="users",
                doc_id=str(user_id),
                document={"last_seen": at},
            )
        except Exception:
            await self.upsert_user(user_id, include_personality_vector=False)

    async def reconcile_recent_users(
        self,
        *,
        hours_back: int = 48,
        limit: int = 500,
    ) -> int:
        since = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        users = await self.user_repository.get_users_updated_since(since=since, limit=limit)
        synced = 0
        for user in users:
            ok = await self.upsert_user(user.id, include_personality_vector=False)
            if ok:
                synced += 1
        return synced
