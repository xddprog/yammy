from typing import Annotated
from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends, HTTPException

from app.api.v1.dependency.providers.request import get_current_user
from app.core.dto.auth import (
    CurrentUserSessionSchema,
    DevAuthTokenRequestSchema,
    RefreshTokenSchema,
    TelegramAuthSchema,
    TokenSchema,
)
from app.core.services.auth_service import AuthService
from app.infrastructure.config.config import APP_CONFIG
from app.infrastructure.errors.auth_errors import InvalidCredentials, InvalidTelegramData
from app.infrastructure.errors.error_extra import error_response
from app.infrastructure.database.models.user import User


router = APIRouter()


@router.post(
    "/telegram",
    responses={
        **error_response(InvalidCredentials),
        **error_response(InvalidTelegramData),
    },
)
@inject
async def login_telegram(
    telegram_auth: TelegramAuthSchema,
    auth_service: FromDishka[AuthService],
) -> TokenSchema:
    return await auth_service.authenticate_telegram(telegram_auth)


@router.post("/dev/token", response_model=TokenSchema)
@inject
async def dev_token_by_user_id(
    body: DevAuthTokenRequestSchema,
    auth_service: FromDishka[AuthService],
) -> TokenSchema:
    if APP_CONFIG.ENVIRONMENT != "development":
        raise HTTPException(status_code=404, detail="Not found")
    return await auth_service.login_dev_by_user_id(body.user_id)


@router.get("/current_user")
@inject
async def get_current_admin_info(
    current_user: Annotated[User, Depends(get_current_user)]
):
    return CurrentUserSessionSchema.from_user(current_user)


@router.post("/refresh", responses={**error_response(InvalidCredentials)})
@inject
async def refresh_token(
    refresh_data: RefreshTokenSchema,
    auth_service: FromDishka[AuthService],
) -> TokenSchema:
    return await auth_service.refresh_user_token(refresh_data.refresh_token)

