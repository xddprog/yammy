from typing import Any

import aiohttp

from app.infrastructure.config.config import TELEGRAM_CONFIG
from app.infrastructure.logging.logger import get_logger

logger = get_logger(__name__)

MINI_APP_BUTTON_TEXT = "Открыть Yammy"


class TelegramClient:
    def __init__(self):
        self.bot_token = TELEGRAM_CONFIG.BOT_TOKEN
        self.admin_chat_id = TELEGRAM_CONFIG.ADMIN_CHAT_ID
        self.status_messages = {
            "pending": "Ожидание оплаты",
            "paid": "Оплачен",
            "failed": "Ошибка",
            "processing": "Обрабатывается",
            "completed": "Выполнен",
            "cancelled": "Отменен",
        }

    @staticmethod
    def mini_app_reply_markup() -> dict[str, Any]:
        button: dict[str, Any] = {
            "text": MINI_APP_BUTTON_TEXT,
            "web_app": {"url": TelegramClient.mini_app_web_url()},
        }
        return {"inline_keyboard": [[button]]}

    @staticmethod
    def mini_app_web_url() -> str:
        url = TELEGRAM_CONFIG.MINI_APP_URL.strip()
        if not url:
            logger.warning("MINI_APP_URL not configured, inline web_app button may fail")
        return url

    async def send_message(
        self,
        chat_id: str | int,
        text: str,
        disable_notification: bool = False,
        reply_markup: dict[str, Any] | None = None,
    ) -> bool:
        if not self.bot_token:
            logger.warning("BOT_TOKEN not configured, skipping Telegram message")
            return False

        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        payload: dict[str, Any] = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
            "disable_notification": disable_notification,
        }
        if reply_markup is not None:
            payload["reply_markup"] = reply_markup

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        logger.info(
                            "telegram_message_sent",
                            chat_id=str(chat_id),
                            message_length=len(text)
                        )
                        return True
                    else:
                        error_data = await response.json()
                        logger.error(
                            "telegram_message_failed",
                            chat_id=str(chat_id),
                            status=response.status,
                            error=error_data
                        )
                        return False
        except Exception as e:
            logger.error(
                "telegram_message_error",
                chat_id=str(chat_id),
                error=str(e),
                exc_info=True
            )
            return False

    async def set_webhook(self, url: str, secret_token: str | None = None) -> bool:
        if not self.bot_token:
            logger.warning("BOT_TOKEN not configured, skipping Telegram webhook setup")
            return False

        api_url = f"https://api.telegram.org/bot{self.bot_token}/setWebhook"
        payload: dict[str, Any] = {"url": url}
        if secret_token:
            payload["secret_token"] = secret_token

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(api_url, json=payload) as response:
                    data = await response.json()
                    if response.status == 200 and data.get("ok"):
                        logger.info("telegram_webhook_set", url=url)
                        return True
                    logger.error(
                        "telegram_webhook_set_failed",
                        url=url,
                        status=response.status,
                        error=data,
                    )
                    return False
        except Exception as e:
            logger.error("telegram_webhook_set_error", url=url, error=str(e), exc_info=True)
            return False
