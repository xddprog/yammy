import json
from pathlib import Path
from typing import Any

from app.core.clients.redis_client import RedisClient
from app.infrastructure.config.config import BASE_DIR
from app.utils.constants.cache_keys import CityCacheKeys

_DEFAULT_JSON = BASE_DIR / "russian-cities.json"


def _city_names(raw: list[dict[str, Any]]) -> list[str]:
    names: set[str] = set()
    for item in raw:
        n = (item.get("name") or "").strip()
        if n:
            names.add(n)
    return sorted(names)


async def load_russian_city_names_to_redis(redis: RedisClient, *, json_path: Path | None = None) -> None:
    if await redis.redis.exists(CityCacheKeys.NAMES):
        return
    path = json_path or _DEFAULT_JSON
    if not path.is_file():
        raise FileNotFoundError(str(path))
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("expected JSON array")
    names = _city_names(data)
    if not names:
        return
    await redis.redis.set(CityCacheKeys.NAMES, json.dumps(names, ensure_ascii=False))
