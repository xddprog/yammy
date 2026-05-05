import aiohttp

from app.infrastructure.config.config import TELEGRAM_CONFIG
from app.infrastructure.logging.logger import get_logger

logger = get_logger(__name__)




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

    async def send_message(
        self, 
        chat_id: str | int, 
        text: str,
        disable_notification: bool = False
    ) -> bool:
        if not self.bot_token:
            logger.warning("BOT_TOKEN not configured, skipping Telegram message")
            return False

        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
            "disable_notification": disable_notification
        }

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
