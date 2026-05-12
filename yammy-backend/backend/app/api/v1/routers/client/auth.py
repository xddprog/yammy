from typing import Annotated
from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends

from app.api.v1.dependency.providers.request import get_current_user
from app.core.dto.auth import CurrentUserSessionSchema, LoginSchema, RefreshTokenSchema, TelegramAuthSchema, TokenSchema
from app.core.services.auth_service import AuthService
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

