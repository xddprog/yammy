from aiogram import Dispatcher
from aiogram.fsm.storage.redis import RedisStorage
from redis.asyncio import Redis

from app.infrastructure.config.config import REDIS_CONFIG
from app.support_bot.handlers import create_ticket, messages, my_tickets, start
from app.support_bot.middlewares.db import SupportServiceMiddleware
from app.infrastructure.database.adapters.pg_connection import DatabaseConnection


def create_dispatcher(db_connection: DatabaseConnection) -> Dispatcher:
    redis = Redis(host=REDIS_CONFIG.REDIS_HOST, port=REDIS_CONFIG.REDIS_PORT)
    storage = RedisStorage(redis=redis)
    dp = Dispatcher(storage=storage)
    dp.update.middleware(SupportServiceMiddleware(db_connection))
    dp.include_router(start.router)
    dp.include_router(create_ticket.router)
    dp.include_router(my_tickets.router)
    dp.include_router(messages.router)
    return dp
