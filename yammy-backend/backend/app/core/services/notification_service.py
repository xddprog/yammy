from app.core.clients.telegram_client import TelegramClient
from app.infrastructure.database.models.user import User


class NotificationService:
    def __init__(self, telegram_client: TelegramClient):
        self._telegram = telegram_client

    async def notify_user_liked(self, recipient: User, liker_name: str) -> None:
        if not recipient.notifications_enabled:
            return
        await self._telegram.send_message(
            recipient.telegram_id,
            f"{liker_name} лайкнул вас",
        )

    async def notify_user_superliked(self, recipient: User, liker_name: str) -> None:
        if not recipient.notifications_enabled:
            return
        await self._telegram.send_message(
            recipient.telegram_id,
            f"{liker_name} отправил вам суперлайк",
        )

    async def notify_new_match(self, recipient: User) -> None:
        if not recipient.notifications_enabled:
            return
        await self._telegram.send_message(recipient.telegram_id, "У вас новый метч!")

    async def notify_mutual_appearance_rating(self, recipient: User, other: User) -> None:
        if not recipient.notifications_enabled:
            return
        link = f'<a href="tg://user?id={other.telegram_id}">Написать в Telegram</a>'
        await self._telegram.send_message(
            recipient.telegram_id,
            f"Взаимная оценка внешности! {link}",
        )
    