import asyncio
import json

from aiohttp import ClientError, ClientSession, ClientTimeout

from app.infrastructure.config.config import OPENROUTER_CONFIG
from app.infrastructure.logging.logger import get_logger


logger = get_logger(__name__)


class OpenRouterClient:
    async def pick_candidates_with_highlights(
        self,
        *,
        query_text: str,
        seeker_profile: dict,
        candidates: list[dict],
        min_count: int,
        target_gender: str | None = None,
    ) -> list[dict]:
        if not candidates:
            return []

        api_key = (OPENROUTER_CONFIG.API_KEY or "").strip()
        if not api_key:
            raise RuntimeError("OPENROUTER_CONFIG__API_KEY is not set")

        prompt = self._build_prompt(
            query_text=query_text,
            seeker_profile=seeker_profile,
            candidates=candidates,
            min_count=min_count,
            target_gender=target_gender,
        )
        payload = {
            "model": OPENROUTER_CONFIG.MODEL,
            "temperature": 0.2,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Ты подбираешь анкеты в dating-приложении. "
                        "Строго следуй пожеланиям пользователя и выбирай только из переданного списка id. "
                        "Верни только JSON-массив объектов "
                        '{"id":"uuid","highlights":"короткий текст на русском <= 120 символов","match_percentage":0..100} '
                        "без markdown."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        timeout = ClientTimeout(total=OPENROUTER_CONFIG.REQUEST_TIMEOUT)
        url = f"{OPENROUTER_CONFIG.API_URL.rstrip('/')}/chat/completions"
        max_attempts = OPENROUTER_CONFIG.MAX_RETRIES + 1

        for attempt in range(max_attempts):
            try:
                async with ClientSession(timeout=timeout) as session:
                    async with session.post(url, json=payload, headers=headers) as response:
                        body_text = await response.text()
                        data = self._parse_response_body(body_text)
                        if response.status >= 400:
                            retry_after = self._retry_after_seconds(data, response.status)
                            logger.warning(
                                "openrouter_request_failed",
                                status=response.status,
                                attempt=attempt,
                                retry_after_seconds=retry_after,
                                model=OPENROUTER_CONFIG.MODEL,
                                response=data,
                                body_preview=body_text[:500],
                            )
                            if retry_after is not None and attempt < max_attempts - 1:
                                await asyncio.sleep(retry_after)
                            continue
                        content = data["choices"][0]["message"]["content"]
                        return self._safe_parse(content, candidates, min_count)
            except asyncio.TimeoutError:
                logger.warning(
                    "openrouter_request_exception",
                    attempt=attempt,
                    exc_type="TimeoutError",
                    error=f"timed out after {OPENROUTER_CONFIG.REQUEST_TIMEOUT}s",
                    model=OPENROUTER_CONFIG.MODEL,
                )
            except ClientError as exc:
                logger.warning(
                    "openrouter_request_exception",
                    attempt=attempt,
                    exc_type=type(exc).__name__,
                    error=str(exc) or repr(exc),
                    model=OPENROUTER_CONFIG.MODEL,
                )
            except (KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError) as exc:
                logger.warning(
                    "openrouter_request_exception",
                    attempt=attempt,
                    exc_type=type(exc).__name__,
                    error=str(exc) or repr(exc),
                    model=OPENROUTER_CONFIG.MODEL,
                )

        raise RuntimeError("OpenRouter request failed after retries")

    @staticmethod
    def _retry_after_seconds(data: dict, status: int) -> float | None:
        if status != 429:
            return None
        error = data.get("error")
        if not isinstance(error, dict):
            return 30.0
        metadata = error.get("metadata")
        if not isinstance(metadata, dict):
            return 30.0
        raw = metadata.get("retry_after_seconds")
        if raw is None:
            return 30.0
        try:
            return min(float(raw) + 1.0, 120.0)
        except (TypeError, ValueError):
            return 30.0

    @staticmethod
    def _parse_response_body(body_text: str) -> dict:
        if not body_text.strip():
            return {}
        try:
            parsed = json.loads(body_text)
        except json.JSONDecodeError as exc:
            raise ValueError(f"invalid JSON response: {exc}") from exc
        if not isinstance(parsed, dict):
            raise ValueError("OpenRouter response must be a JSON object")
        return parsed

    def _safe_parse(self, raw: str, candidates: list[dict], min_count: int) -> list[dict]:
        parsed = json.loads(raw)
        if not isinstance(parsed, list):
            raise ValueError("OpenRouter response must be a JSON array")

        seen: set[str] = set()
        items: list[dict] = []
        allowed_ids = {item["id"] for item in candidates}
        for item in parsed:
            if not isinstance(item, dict):
                continue
            cid = str(item.get("id", "")).strip()
            hl = str(item.get("highlights", "")).strip()
            mp_raw = item.get("match_percentage")
            if not cid or cid in seen or cid not in allowed_ids:
                continue
            if not hl:
                continue
            try:
                match_percentage = int(mp_raw)
            except (TypeError, ValueError):
                continue
            match_percentage = max(0, min(100, match_percentage))
            seen.add(cid)
            items.append({"id": cid, "highlights": hl[:120], "match_percentage": match_percentage})

        return items

    def _build_prompt(
        self,
        *,
        query_text: str,
        seeker_profile: dict,
        candidates: list[dict],
        min_count: int,
        target_gender: str | None = None,
    ) -> str:
        gender_block = ""
        if target_gender == "female":
            gender_block = (
                "Жёсткий фильтр: в списке только женщины. "
                "Не выбирай кандидатов, которые не подходят под пожелания.\n\n"
            )
        elif target_gender == "male":
            gender_block = (
                "Жёсткий фильтр: в списке только мужчины. "
                "Не выбирай кандидатов, которые не подходят под пожелания.\n\n"
            )

        wishes = query_text.strip() or "Без дополнительных пожеланий"

        return (
            "Подбери лучших кандидатов по пожеланиям пользователя.\n\n"
            f"{gender_block}"
            "Правила:\n"
            "1. Используй только id из списка кандидатов.\n"
            "2. Пожелания читай буквально: внешность, стиль, характер, занятия, город, цели.\n"
            "3. Например если просят спортивного/качка/атлетичного — ищи признаки спорта и фитнеса в bio/job.\n"
            "4. Если просят девушку/парня — пол уже отфильтрован, не противоречь ему.\n"
            "5. Не добавляй людей, которые явно не соответствуют пожеланиям.\n"
            "6. highlights — одна короткая фраза на русском, почему именно этот человек подходит с учетом пожеланий пользователя.\n"
            "7. match_percentage — насколько кандидат соответствует пожеланиям и самому пользователю (0–100).\n"
            f"8. Верни минимум {min_count} лучших кандидатов, если столько подходящих есть, возвращай дейтсительно подходящих кандидато\n\n"
            f"Пожелания пользователя:\n{wishes}\n\n"
            "Анкета пользователя, для которого подбираем (JSON):\n"
            f"{json.dumps(seeker_profile, ensure_ascii=False)}\n\n"
            "Кандидаты (JSON):\n"
            f"{json.dumps(candidates, ensure_ascii=False)}\n\n"
            "Верни только JSON-массив объектов с полями id, highlights и match_percentage."
        )
