from typing import Annotated, Any

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Header, HTTPException, Request

from app.core.services.telegram_bot_service import TelegramBotService
from app.infrastructure.config.config import TELEGRAM_CONFIG


router = APIRouter()


@router.post("/webhook")
@inject
async def telegram_webhook(
    request: Request,
    bot_service: FromDishka[TelegramBotService],
    x_telegram_bot_api_secret_token: Annotated[str | None, Header()] = None,
) -> dict[str, bool]:
    secret = TELEGRAM_CONFIG.WEBHOOK_SECRET
    if secret and x_telegram_bot_api_secret_token != secret:
        raise HTTPException(status_code=403, detail="Invalid webhook secret")

    update: dict[str, Any] = await request.json()
    await bot_service.handle_update(update)
    return {"ok": True}
