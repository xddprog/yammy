from uuid import UUID

from starlette.responses import JSONResponse, Response

from app.core.repositories.like_repository import LikeRepository
from app.core.repositories.user_repository import UserRepository
from app.core.services.notification_service import NotificationService
from app.core.clients.redis_client import RedisClient
from app.utils.constants.cache_keys import LikeCacheKeys, UserCacheKeys
from app.utils.constants.enums import LikeTypeEnum
from app.infrastructure.logging.logger import get_logger


logger = get_logger(__name__)


class LikeService:
    SEEN_TTL = 60 * 60
    
    def __init__(
        self,
        like_repository: LikeRepository,
        user_repository: UserRepository,
        redis_client: RedisClient,
        notification_service: NotificationService,
    ):
        self.like_repository = like_repository
        self.user_repository = user_repository
        self.redis_client = redis_client
        self.notification_service = notification_service

    async def _upsert_like(self, user_from_id: UUID, user_to_id: UUID) -> bool:
        if await self.like_repository.has_liked(user_to_id, user_from_id):
            await self.like_repository.update_like(
                user_to_id,
                user_from_id,
                LikeTypeEnum.LIKE,
            )
            return True
        await self.like_repository.add_item(
            user_from_id=user_from_id,
            user_to_id=user_to_id,
            like_type=LikeTypeEnum.LIKE,
        )
        return False

    async def add_like(self, user_from_id: UUID, user_to_id: UUID) -> Response:
        is_match = await self._upsert_like(user_from_id, user_to_id)
        await self._add_to_seen(user_from_id, user_to_id)

        liker = await self.user_repository.get_item(str(user_from_id))
        recipient = await self.user_repository.get_item(str(user_to_id))

        if is_match:
            await self.like_repository.create_match(user_from_id, user_to_id)
            if liker:
                await self.notification_service.notify_new_match(liker)
            if recipient:
                await self.notification_service.notify_new_match(recipient)
            return JSONResponse(content={"message": "У вас новый метч!"})

        if liker and recipient:
            await self.notification_service.notify_user_liked(recipient, liker.name)

        return Response(status_code=204)
    
    async def add_dislike(self, user_from_id: UUID, user_to_id: UUID):
        field = f"{user_from_id}:{user_to_id}"
        await self.redis_client.sadd(LikeCacheKeys.DISLIKE_BUFFER, field)
        await self._add_to_seen(user_from_id, user_to_id)
    
    async def flush_dislikes_to_db(self) -> dict[str, int]:
        all_dislikes = await self.redis_client.smembers(LikeCacheKeys.DISLIKE_BUFFER)
        
        if not all_dislikes:
            return {"flushed": 0}
        
        values = []
        for field in all_dislikes:
            user_from, user_to = field.split(":")
            values.append({
                "user_from_id": user_from,
                "user_to_id": user_to
            })
        
        if not values:
            return {"flushed": 0}
        
        await self.like_repository.batch_create_dislikes(values)
        await self.redis_client.delete_by_key(LikeCacheKeys.DISLIKE_BUFFER)
        
        return {"flushed": len(values)}
    
    async def _add_to_seen(self, user_from_id: UUID, user_to_id: UUID):
        seen_key = UserCacheKeys.SEEN_USERS.format(user_id=user_from_id)
        await self.redis_client.sadd(seen_key, str(user_to_id), ttl=self.SEEN_TTL)

    async def like_and_match(self, user_from_id: UUID, user_to_id: UUID):
        await self._upsert_like(user_from_id, user_to_id)
        await self._add_to_seen(user_from_id, user_to_id)
        await self.like_repository.create_match(user_from_id, user_to_id)

        liker = await self.user_repository.get_item(str(user_from_id))
        recipient = await self.user_repository.get_item(str(user_to_id))
        
        if liker:
            await self.notification_service.notify_new_match(liker)
        if recipient:
            await self.notification_service.notify_new_match(recipient)