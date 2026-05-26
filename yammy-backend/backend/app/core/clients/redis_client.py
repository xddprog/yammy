from typing import Any
import json
from typing import Set
from redis.asyncio.client import Redis

from app.infrastructure.config.config import REDIS_CONFIG


class RedisClient:
    def __init__(self) -> None:
        self.redis: Redis = Redis(host=REDIS_CONFIG.REDIS_HOST, port=REDIS_CONFIG.REDIS_PORT)

    async def set(self, key: str, value: Any, ttl: int = None) -> None:
        if ttl:
            await self.redis.set(key, value, ex=ttl)
        else: 
            await self.redis.set(key, value)

    async def get(self, key: str) -> Any:
        value = await self.redis.get(key)
        if value:
            return json.loads(value)
        return None

    async def delete_by_key(self, key: str) -> None:
        await self.redis.delete(key)

    async def exists(self, key: str) -> bool:
        return bool(await self.redis.exists(key))

    async def expire(self, key: str, ttl: int) -> bool:
        return bool(await self.redis.expire(key, ttl))

    async def delete_by_prefix(self, prefix: str) -> None:
        keys = await self.redis.keys(prefix)
        if not keys:
            return
        await self.redis.delete(*keys)

    async def reset(self) -> None:
        await self.redis.flushall(asynchronous=True)
    
    
    async def sadd(self, key: str, *values: str, ttl: int | None = None) -> int:
        result = await self.redis.sadd(key, *values)
        if ttl:
            await self.redis.expire(key, ttl)
        return result
    
    async def smembers(self, key: str) -> Set[str]:
        members = await self.redis.smembers(key)
        return {member.decode() if isinstance(member, bytes) else member for member in members}
    
    async def sismember(self, key: str, value: str) -> bool:
        return await self.redis.sismember(key, value)
    
    async def srem(self, key: str, *values: str) -> int:
        return await self.redis.srem(key, *values)
    
    async def scard(self, key: str) -> int:
        return await self.redis.scard(key)

    async def clear(self):
        return await self.redis.flushdb()