import re
from aiohttp import ClientSession, ClientTimeout

from app.infrastructure.config.config import GIGDATA_CONFIG
from app.infrastructure.logging.logger import get_logger

logger = get_logger(__name__)


def _clean_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


class UniversityService:
    async def search(self, query: str, limit: int = 20) -> list[str]:
        if not query or not query.strip():
            return []

        payload = {"query": query.strip(), "count": limit}
        headers = {
            "Authorization": f"Token {GIGDATA_CONFIG.API_KEY_SUGGEST_EDUCATIONS}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        try:
            async with ClientSession() as session:
                timeout = ClientTimeout(total=GIGDATA_CONFIG.REQUEST_TIMEOUT_SUGGEST_EDUCATIONS)
                async with session.post(
                    GIGDATA_CONFIG.API_URL_SUGGEST_EDUCATIONS,
                    json=payload,
                    headers=headers,
                    timeout=timeout,
                ) as response:
                    if response.status != 200:
                        logger.error(
                            "Education API error",
                            status=response.status,
                            body=await response.json(),
                        )
                        return []

                    data = await response.json()
                    suggestions = data.get("suggestions", [])

            seen = set()
            result = []
            for item in suggestions:
                name = item.get("value") if isinstance(item, dict) else item
                if name:
                    cleaned = _clean_whitespace(name)
                    if cleaned and cleaned not in seen:
                        seen.add(cleaned)
                        result.append(cleaned)
                        if len(result) >= limit:
                            break
            return result

        except Exception as e:
            logger.error("Education API request failed", error=str(e))
            return []
