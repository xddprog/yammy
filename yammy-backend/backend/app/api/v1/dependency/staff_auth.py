from typing import Annotated

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.dto.admin import AdminSchema
from app.core.services.auth_service import AuthService
from app.infrastructure.errors.auth_errors import ForbiddenException
from app.utils.constants.enums import AdminRoleEnum

staff_security = HTTPBearer()


@inject
async def get_current_staff(
    auth_service: FromDishka[AuthService],
    credentials: HTTPAuthorizationCredentials = Depends(staff_security),
) -> AdminSchema:
    return await auth_service.verify_staff_token(credentials.credentials)


async def require_admin(
    staff: Annotated[AdminSchema, Depends(get_current_staff)],
) -> AdminSchema:
    if staff.role != AdminRoleEnum.ADMIN:
        raise ForbiddenException()
    return staff
