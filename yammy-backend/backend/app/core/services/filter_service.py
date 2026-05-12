import json

from app.core.clients.redis_client import RedisClient
from app.core.dto.filter import FilterCategorySchema
from app.core.repositories.filter_repository import FilterRepository
from app.utils.constants.cache_keys import CacheTTL, FilterCacheKeys


class FilterService:
    def __init__(
        self,
        filter_repository: FilterRepository,
        redis_client: RedisClient
    ):
        self.filter_repository = filter_repository
        self.redis = redis_client

    async def get_all_filters(self) -> list[FilterCategorySchema]:
        cached = await self.redis.get(FilterCacheKeys.ALL)
        if cached:
            return [FilterCategorySchema.model_validate(item) for item in cached]
        
        filters = await self.filter_repository.get_all_with_relations()
        schemas = [FilterCategorySchema.model_validate(f, from_attributes=True) for f in filters]
        
        serialized = json.dumps([s.model_dump(mode="json") for s in schemas])
        await self.redis.set(FilterCacheKeys.ALL, serialized, ttl=CacheTTL.MINUTE * 60)
        return schemas
