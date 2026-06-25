import asyncio
import logging

from aiogram import Bot
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiohttp import web

from app.infrastructure.config.config import APP_CONFIG, SUPPORT_TELEGRAM_CONFIG
from app.infrastructure.database.adapters.pg_connection import DatabaseConnection
from app.infrastructure.logging.logger import get_logger
from app.support_bot.bot import create_dispatcher

logger = get_logger(__name__)


def _webhook_public_url() -> str | None:
    base_url = APP_CONFIG.BASE_URL.rstrip("/")
    if not base_url.startswith("https://"):
        return None
    return f"{base_url}/api/v1/support/telegram/webhook"


async def _run_polling(bot: Bot, dp) -> None:
    await bot.delete_webhook(drop_pending_updates=True)
    logger.info("support_bot_polling_started")
    await dp.start_polling(bot)


async def _run_webhook(bot: Bot, dp) -> None:
    from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application

    webhook_url = _webhook_public_url()
    if not webhook_url:
        raise RuntimeError("BASE_URL must be HTTPS for support bot webhook mode")

    app = web.Application()
    webhook_handler = SimpleRequestHandler(
        dispatcher=dp,
        bot=bot,
        secret_token=SUPPORT_TELEGRAM_CONFIG.WEBHOOK_SECRET or None,
    )
    webhook_handler.register(app, path=SUPPORT_TELEGRAM_CONFIG.WEBHOOK_PATH)

    async def on_startup(_app: web.Application) -> None:
        try:
            await bot.set_webhook(
                webhook_url,
                secret_token=SUPPORT_TELEGRAM_CONFIG.WEBHOOK_SECRET or None,
                drop_pending_updates=True,
            )
            logger.info("support_bot_webhook_set", url=webhook_url)
        except Exception:
            logger.exception(
                "support_bot_webhook_set_failed",
                url=webhook_url,
                hint="Set webhook manually if outbound to api.telegram.org is blocked",
            )

    async def on_shutdown(_app: web.Application) -> None:
        await bot.session.close()

    app.on_startup.append(on_startup)
    app.on_shutdown.append(on_shutdown)
    setup_application(app, dp, bot=bot)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(
        runner,
        host=SUPPORT_TELEGRAM_CONFIG.LISTEN_HOST,
        port=SUPPORT_TELEGRAM_CONFIG.LISTEN_PORT,
    )
    await site.start()
    logger.info(
        "support_bot_webhook_listening",
        host=SUPPORT_TELEGRAM_CONFIG.LISTEN_HOST,
        port=SUPPORT_TELEGRAM_CONFIG.LISTEN_PORT,
    )
    await asyncio.Event().wait()


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    token = SUPPORT_TELEGRAM_CONFIG.BOT_TOKEN
    if not token:
        raise RuntimeError("SUPPORT_TELEGRAM_CONFIG__BOT_TOKEN is required")

    bot = Bot(token=token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    db_connection = DatabaseConnection()
    dp = create_dispatcher(db_connection)

    if _webhook_public_url():
        await _run_webhook(bot, dp)
    else:
        await _run_polling(bot, dp)


if __name__ == "__main__":
    asyncio.run(main())
