from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends, Query, Response

from app.api.v1.dependency.staff_auth import get_current_staff, require_admin
from app.core.dto.admin import (
    AdminBalancesRequest,
    AdminModerationDecisionRequest,
    AdminProfileModerationRequest,
    AdminSchema,
    AdminSubscriptionRequest,
)
from app.core.dto.admin_user import (
    AdminUserDetailSchema,
    AdminUserPreviewSchema,
    AdminUserChatSchema,
    ReportedUserDetailSchema,
    ReportedUserListItemSchema,
)
from app.core.dto.pagination import PaginationRequestModel, PaginationResponseModel
from app.core.services.admin_user_service import AdminUserService
from app.core.services.user_service import UserService
from app.utils.constants.enums import SubscriptionTierEnum


router = APIRouter()


@router.get("/profiles")
@inject
async def list_moderation_profiles(
    admin_user_service: FromDishka[AdminUserService],
    _staff: Annotated[AdminSchema, Depends(get_current_staff)],
    pagination: Annotated[PaginationRequestModel, Depends()],
) -> PaginationResponseModel[AdminUserPreviewSchema]:
    return await admin_user_service.list_moderation_profiles(pagination)


@router.get("/profiles/{user_id}")
@inject
async def get_moderation_profile(
    user_id: UUID,
    admin_user_service: FromDishka[AdminUserService],
    _staff: Annotated[AdminSchema, Depends(get_current_staff)],
) -> AdminUserDetailSchema:
    return await admin_user_service.get_moderation_profile(user_id)


@router.patch("/profiles/{user_id}", status_code=204)
@inject
async def moderate_profile(
    user_id: UUID,
    body: AdminModerationDecisionRequest,
    admin_user_service: FromDishka[AdminUserService],
    staff: Annotated[AdminSchema, Depends(get_current_staff)],
) -> Response:
    await admin_user_service.set_profile_moderation(
        user_id,
        body.approved,
        body.note,
        staff.id,
    )
    return Response(status_code=204)


@router.get("/reported-users")
@inject
async def list_reported_users(
    admin_user_service: FromDishka[AdminUserService],
    _staff: Annotated[AdminSchema, Depends(get_current_staff)],
    pagination: Annotated[PaginationRequestModel, Depends()],
    has_pending: bool = Query(default=True),
    q: str | None = Query(default=None),
) -> PaginationResponseModel[ReportedUserListItemSchema]:
    return await admin_user_service.list_reported_users(
        pagination,
        has_pending=has_pending,
        q=q,
    )


@router.get("/reported-users/{user_id}")
@inject
async def get_reported_user_detail(
    user_id: UUID,
    admin_user_service: FromDishka[AdminUserService],
    _staff: Annotated[AdminSchema, Depends(get_current_staff)],
) -> ReportedUserDetailSchema:
    return await admin_user_service.get_reported_user_detail(user_id)


@router.post("/reported-users/{user_id}/resolve-all", status_code=204)
@inject
async def resolve_all_reports(
    user_id: UUID,
    admin_user_service: FromDishka[AdminUserService],
    staff: Annotated[AdminSchema, Depends(get_current_staff)],
) -> Response:
    await admin_user_service.resolve_all_pending_reports(user_id, staff.id)
    return Response(status_code=204)


@router.get("/chat-between")
@inject
async def get_chat_between_users(
    admin_user_service: FromDishka[AdminUserService],
    _staff: Annotated[AdminSchema, Depends(get_current_staff)],
    user_a: UUID = Query(...),
    user_b: UUID = Query(...),
) -> AdminUserChatSchema:
    return await admin_user_service.get_chat_between_users(user_a, user_b)
