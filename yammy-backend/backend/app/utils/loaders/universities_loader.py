import asyncio
import json
import re

from aiohttp import ClientSession, ClientTimeout

from app.core.clients.redis_client import RedisClient
from app.infrastructure.config.config import GIGDATA_CONFIG
from app.infrastructure.logging.logger import get_logger
from app.utils.constants.cache_keys import UniversityCacheKeys

logger = get_logger(__name__)


def clean_whitespace(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip()


async def fetch_suggestions(session: ClientSession, letter: str) -> list[dict]:
    payload = {
        "query": letter,
        "count": 2000
    }
    headers = {
        "authorization": GIGDATA_CONFIG.API_KEY_SUGGEST_EDUCATIONS,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    async with session.post(GIGDATA_CONFIG.API_URL_SUGGEST_EDUCATIONS, json=payload, headers=headers) as response:
        data = await response.json()
        return [
            clean_whitespace(suggestion["name"])
            for suggestion in data.get("suggestions", [])
        ]


async def load_university_names_to_redis(redis: RedisClient) -> None:
    if await redis.redis.exists(UniversityCacheKeys.NAMES):
        return

    letters = [chr(c) for c in range(ord("а"), ord("я") + 1)]

    seen: set[str] = set()
    async with ClientSession() as session:
        for letter in letters:
            batch = await fetch_suggestions(session, letter)
            seen.update(batch)

    if not seen:
        logger.warning("university_names_gigdata_empty_no_redis_write")
        return

    names = sorted(seen)
    await redis.redis.set(UniversityCacheKeys.NAMES, json.dumps(names, ensure_ascii=False))
    logger.info("university_names_loaded_to_redis", count=len(names))
