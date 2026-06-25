import aiohttp

from app.infrastructure.config.config import SUPPORT_TELEGRAM_CONFIG
from app.infrastructure.logging.logger import get_logger

logger = get_logger(__name__)


class SupportTelegramClient:
    def __init__(self):
        self.bot_token = SUPPORT_TELEGRAM_CONFIG.BOT_TOKEN

    async def send_message(self, chat_id: str | int, text: str) -> bool:
        if not self.bot_token:
            logger.warning("support_bot_token_not_configured")
            return False

        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        return True
                    error_data = await response.json()
                    logger.error(
                        "support_telegram_message_failed",
                        chat_id=str(chat_id),
                        status=response.status,
                        error=error_data,
                    )
                    return False
        except Exception as e:
            logger.error(
                "support_telegram_message_error",
                chat_id=str(chat_id),
                error=str(e),
                exc_info=True,
            )
            return False

    async def set_webhook(self, url: str, secret_token: str | None = None) -> bool:
        if not self.bot_token:
            logger.warning("support_bot_token_not_configured")
            return False

        api_url = f"https://api.telegram.org/bot{self.bot_token}/setWebhook"
        payload: dict[str, str] = {"url": url}
        if secret_token:
            payload["secret_token"] = secret_token

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(api_url, json=payload) as response:
                    data = await response.json()
                    if response.status == 200 and data.get("ok"):
                        logger.info("support_telegram_webhook_set", url=url)
                        return True
                    logger.error(
                        "support_telegram_webhook_set_failed",
                        url=url,
                        status=response.status,
                        error=data,
                    )
                    return False
        except Exception as e:
            logger.error("support_telegram_webhook_set_error", url=url, error=str(e), exc_info=True)
            return False

    async def delete_webhook(self) -> bool:
        if not self.bot_token:
            return False
        api_url = f"https://api.telegram.org/bot{self.bot_token}/deleteWebhook"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(api_url, json={}) as response:
                    data = await response.json()
                    return response.status == 200 and data.get("ok", False)
        except Exception:
            return False
