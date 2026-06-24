from app.core.clients.telegram_client import TelegramClient
from app.infrastructure.database.models.user import User

_OPEN_APP_HINT = "\n\nЗайди в приложение — посмотри, кто это"


class NotificationService:
    def __init__(self, telegram_client: TelegramClient):
        self._telegram = telegram_client

    def _mini_app_markup(self) -> dict:
        return self._telegram.mini_app_reply_markup()

    async def notify_user_liked(self, recipient: User, liker_name: str) -> None:
        if not recipient.notifications_enabled:
            return
        await self._telegram.send_message(
            recipient.telegram_id,
            f"{liker_name} лайкнул вас{_OPEN_APP_HINT}",
            reply_markup=self._mini_app_markup(),
        )

    async def notify_user_superliked(self, recipient: User, liker_name: str) -> None:
        if not recipient.notifications_enabled:
            return
        await self._telegram.send_message(
            recipient.telegram_id,
            f"{liker_name} отправил вам суперлайк{_OPEN_APP_HINT}",
            reply_markup=self._mini_app_markup(),
        )

    async def notify_new_match(self, recipient: User) -> None:
        if not recipient.notifications_enabled:
            return
        await self._telegram.send_message(
            recipient.telegram_id,
            f"У вас новый метч!{_OPEN_APP_HINT}",
            reply_markup=self._mini_app_markup(),
        )

    async def notify_new_chat_message(self, recipient: User, sender_name: str) -> None:
        if not recipient.notifications_enabled:
            return
        await self._telegram.send_message(
            recipient.telegram_id,
            f"{sender_name} написал вам новое сообщение",
            reply_markup=self._mini_app_markup(),
        )

    async def notify_user_appearance_rated(self, recipient: User, rater_name: str, score: int) -> None:
        if not recipient.notifications_enabled:
            return
        await self._telegram.send_message(
            recipient.telegram_id,
            f"{rater_name} оценил вас на {score}{_OPEN_APP_HINT}",
            reply_markup=self._mini_app_markup(),
        )

    async def notify_mutual_appearance_rating(self, recipient: User, other: User) -> None:
        if not recipient.notifications_enabled:
            return
        link = f'<a href="tg://user?id={other.telegram_id}">Написать</a>'
        await self._telegram.send_message(
            recipient.telegram_id,
            f"Взаимная оценка внешности! {link}",
            reply_markup=self._mini_app_markup(),
        )
