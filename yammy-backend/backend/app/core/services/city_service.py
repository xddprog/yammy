from app.core.clients.redis_client import RedisClient
from app.utils.constants.cache_keys import CityCacheKeys


class CityService:
    def __init__(self, redis_client: RedisClient) -> None:
        self._redis = redis_client

    async def suggest(self, query: str, limit: int = 10) -> list[str]:
        names = await self._redis.get(CityCacheKeys.NAMES)
        if not isinstance(names, list):
            return []
            
        prefix = query.strip().lower()

        result = []
        for name in names:
            if name.lower().startswith(prefix):
                result.append(name)
                if len(result) >= limit:
                    break
        return result