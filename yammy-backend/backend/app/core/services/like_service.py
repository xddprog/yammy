from uuid import UUID
from app.core.repositories.like_repository import LikeRepository
from app.core.clients.redis_client import RedisClient
from app.utils.constants.cache_keys import LikeCacheKeys, UserCacheKeys
from app.utils.constants.enums import LikeTypeEnum
from app.infrastructure.logging.logger import get_logger


logger = get_logger(__name__)


class LikeService:
    SEEN_TTL = 60 * 60
    
    def __init__(self, like_repository: LikeRepository, redis_client: RedisClient):
        self.like_repository = like_repository
        self.redis_client = redis_client

    async def add_like(self, user_from_id: UUID, user_to_id: UUID):
        #TODO: notification to user_to
        await self.like_repository.add_item(
            user_from_id=user_from_id, 
            user_to_id=user_to_id, 
            like_type=LikeTypeEnum.LIKE
        )
        await self._add_to_seen(user_from_id, user_to_id)
    
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
        #TODO: notification to user_from

        await self.add_like(user_from_id, user_to_id)
        await self.like_repository.create_match(user_from_id, user_to_id)