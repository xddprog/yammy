from typing import Any

from app.core.clients.telegram_client import TelegramClient
from app.core.services.referral_service import ReferralService
from app.infrastructure.logging.logger import get_logger

logger = get_logger(__name__)

START_WELCOME_TEXT = """Привет! 👋 Добро пожаловать в Yammy!

В Yammy можно знакомиться по-разному: листаешь ленту или оцениваешь внешность от 1 до 10 и смотришь, кто поставил тебе взаимно!.

А если хочется точнее — настрой фильтры или опиши в AI-поиске, кого ищешь.

Может, нужный человек уже на следующей карточке ✨

Жми кнопку ниже — и вперёд!"""


class TelegramBotService:
    def __init__(
        self,
        telegram_client: TelegramClient,
        referral_service: ReferralService,
    ):
        self._telegram = telegram_client
        self._referral_service = referral_service

    async def handle_update(self, update: dict[str, Any]) -> None:
        message = update.get("message")
        if not message:
            return

        text = (message.get("text") or "").strip()
        if not text.startswith("/start"):
            return

        chat = message.get("chat") or {}
        chat_id = chat.get("id")
        if chat_id is None:
            return

        from_user = message.get("from") or {}
        telegram_id = from_user.get("id")
        if telegram_id is not None:
            parts = text.split(maxsplit=1)
            if len(parts) > 1:
                await self._referral_service.save_pending_referral(telegram_id, parts[1])

        await self._telegram.send_message(
            chat_id,
            START_WELCOME_TEXT,
            reply_markup=self._telegram.mini_app_reply_markup(),
        )
        logger.info("telegram_start_welcome_sent", chat_id=str(chat_id))
