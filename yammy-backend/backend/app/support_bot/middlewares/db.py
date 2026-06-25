from typing import Any, Awaitable, Callable, Dict

from aiogram import BaseMiddleware
from aiogram.types import TelegramObject

from app.core.clients.support_telegram_client import SupportTelegramClient
from app.core.repositories.support_repository import SupportRepository
from app.core.repositories.user_repository import UserRepository
from app.core.services.support_service import SupportService
from app.infrastructure.database.adapters.pg_connection import DatabaseConnection


class SupportServiceMiddleware(BaseMiddleware):
    def __init__(self, db_connection: DatabaseConnection):
        self._db_connection = db_connection
        self._telegram_client = SupportTelegramClient()

    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        session = await self._db_connection.get_session()
        try:
            data["support_service"] = SupportService(
                support_repository=SupportRepository(session=session),
                user_repository=UserRepository(session=session),
                support_telegram_client=self._telegram_client,
            )
            return await handler(event, data)
        finally:
            await session.close()
