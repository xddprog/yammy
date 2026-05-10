from uuid import UUID

from app.core.repositories.appearance_rating_repository import AppearanceRatingRepository
from app.core.clients.redis_client import RedisClient
from app.utils.constants.cache_keys import AppearanceRatingCacheKeys
from app.infrastructure.logging.logger import get_logger


logger = get_logger(__name__)


class AppearanceRatingService:
    RATED_TTL = 60 * 60 
    
    def __init__(
        self, 
        appearance_rating_repository: AppearanceRatingRepository,
        redis_client: RedisClient
    ):
        self.appearance_rating_repository = appearance_rating_repository
        self.redis_client = redis_client
    
    async def add_appearance_rating(self, rater_user_id: UUID, rated_user_id: UUID, score: int):
        field = f"{rater_user_id}:{rated_user_id}:{score}"
        await self.redis_client.sadd(AppearanceRatingCacheKeys.APPEARANCE_RATING_BUFFER, field)
        
        rated_key = AppearanceRatingCacheKeys.APPEARANCE_RATED_USERS.format(user_id=rater_user_id)
        await self.redis_client.sadd(rated_key, str(rated_user_id), ttl=self.RATED_TTL)
        
        logger.info(
            "Appearance rating added to buffer",
            rater_user_id=str(rater_user_id),
            rated_user_id=str(rated_user_id),
            score=score
        )
    
    async def flush_appearance_ratings_to_db(self) -> dict[str, int]:
        all_ratings = await self.redis_client.smembers(AppearanceRatingCacheKeys.APPEARANCE_RATING_BUFFER)
        
        if not all_ratings:
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
                "score": int(score)
            })
        
        if not values:
            return {"flushed": 0}
        
        await self.appearance_rating_repository.batch_create_appearance_ratings(values)
        await self.redis_client.delete_by_key(AppearanceRatingCacheKeys.APPEARANCE_RATING_BUFFER)
        
        logger.info("Appearance ratings flushed to DB", count=len(values))
        
        return {"flushed": len(values)}
