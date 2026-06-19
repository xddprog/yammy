from typing import Annotated

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends

from app.api.v1.dependency.staff_auth import get_current_staff
from app.core.dto.admin import AdminSchema
from app.core.dto.auth import LoginSchema, RefreshTokenSchema, TokenSchema
from app.core.services.auth_service import AuthService
from app.infrastructure.errors.auth_errors import InvalidCredentials
from app.infrastructure.errors.error_extra import error_response


router = APIRouter()


@router.post("/login", responses={**error_response(InvalidCredentials)})
@inject
async def login(
    form: LoginSchema,
    auth_service: FromDishka[AuthService],
) -> TokenSchema:
    return await auth_service.login_admin(form)


@router.get("/current_user")
@inject
async def get_current_admin_info(
    current_user: Annotated[AdminSchema, Depends(get_current_staff)],
) -> AdminSchema:
    return current_user


@router.post("/refresh", responses={**error_response(InvalidCredentials)})
@inject
async def refresh_token(
    refresh_data: RefreshTokenSchema,
    auth_service: FromDishka[AuthService],
) -> TokenSchema:
    return await auth_service.refresh_admin_token(refresh_data.refresh_token)
