from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends, Response

from app.api.v1.dependency.providers.request import get_current_admin
from app.core.dto.admin import AdminBanUserRequest
from app.core.services.user_service import UserService
from app.infrastructure.database.models.admin import Admin


router = APIRouter()


@router.patch("/{user_id}/ban", status_code=204)
@inject
async def set_user_ban_status(
    user_id: UUID,
    body: AdminBanUserRequest,
    user_service: FromDishka[UserService],
    _admin: Annotated[Admin, Depends(get_current_admin)],
) -> Response:
    await user_service.set_ban_status(user_id, body.is_banned)
    return Response(status_code=204)
