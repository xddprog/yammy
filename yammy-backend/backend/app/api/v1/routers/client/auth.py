from typing import Annotated
from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.api.v1.dependency.providers.request import (
    get_current_user,
    get_onboarding_telegram_id,
)
from app.core.dto.auth import (
    CurrentUserSessionSchema,
    DevAuthTokenRequestSchema,
    DevOnboardingTokenRequestSchema,
    ModerateTextRequest,
    OnboardingFinishRequest,
    RefreshTokenSchema,
    TelegramAuthSchema,
    TokenSchema,
)
from app.core.dto.filter import FilterCategorySchema
from app.core.services.auth_service import AuthService
from app.core.services.city_service import CityService
from app.core.services.filter_service import FilterService
from app.core.services.moderation_service import ModerationService
from app.core.services.user_service import UserService
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


@router.post("/dev/onboarding", response_model=TokenSchema)
@inject
async def dev_onboarding_token(
    body: DevOnboardingTokenRequestSchema,
    auth_service: FromDishka[AuthService],
) -> TokenSchema:
    if APP_CONFIG.ENVIRONMENT != "development":
        raise HTTPException(status_code=404, detail="Not found")
    return await auth_service.login_dev_onboarding(body.telegram_id)


@router.get("/current_user")
@inject
async def get_current_admin_info(
    current_user: Annotated[User, Depends(get_current_user)]
):
    return CurrentUserSessionSchema.from_user(current_user)


@router.post("/onboarding/finish", response_model=TokenSchema)
@inject
async def finish_onboarding(
    profile: Annotated[str, Form()],
    images: Annotated[list[UploadFile], File()],
    auth_service: FromDishka[AuthService],
    user_service: FromDishka[UserService],
    telegram_id: Annotated[int, Depends(get_onboarding_telegram_id)],
) -> TokenSchema:
    form = OnboardingFinishRequest.model_validate_json(profile)
    user = await user_service.complete_onboarding(telegram_id, form, images)
    return TokenSchema(
        access_token=auth_service.create_access_token(str(user.id)),
        refresh_token=auth_service.create_refresh_token(str(user.id)),
    )


@router.get("/onboarding/cities")
@inject
async def onboarding_cities(
    q: str,
    city_service: FromDishka[CityService],
    _telegram_id: Annotated[int, Depends(get_onboarding_telegram_id)],
    limit: int = 10,
) -> list[str]:
    return await city_service.suggest(query=q, limit=limit)


@router.get("/onboarding/filters")
@inject
async def onboarding_filters(
    filter_service: FromDishka[FilterService],
    _telegram_id: Annotated[int, Depends(get_onboarding_telegram_id)],
) -> list[FilterCategorySchema]:
    return await filter_service.get_all_filters()


@router.post("/moderate/text", status_code=204)
@inject
async def moderate_text(
    body: ModerateTextRequest,
    moderation_service: FromDishka[ModerationService],
    _telegram_id: Annotated[int, Depends(get_onboarding_telegram_id)],
) -> None:
    await moderation_service.moderate_text(body.text)


@router.post("/moderate/image", status_code=204)
@inject
async def moderate_image(
    moderation_service: FromDishka[ModerationService],
    _telegram_id: Annotated[int, Depends(get_onboarding_telegram_id)],
    image: UploadFile = File(...),
    is_main: bool = False,
) -> None:
    await moderation_service.moderate_image(image, is_main=is_main)


@router.post("/refresh", responses={**error_response(InvalidCredentials)})
@inject
async def refresh_token(
    refresh_data: RefreshTokenSchema,
    auth_service: FromDishka[AuthService],
) -> TokenSchema:
    return await auth_service.refresh_user_token(refresh_data.refresh_token)

