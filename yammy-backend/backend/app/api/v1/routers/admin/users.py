from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends, Query, Response

from app.api.v1.dependency.staff_auth import require_admin
from app.core.dto.admin import (
    AdminBalancesRequest,
    AdminBanUserRequest,
    AdminProfileModerationRequest,
    AdminSchema,
    AdminSubscriptionRequest,
)
from app.core.dto.admin_user import AdminReportItemSchema, AdminUserDetailSchema, AdminUserPreviewSchema
from app.core.dto.pagination import PaginationRequestModel, PaginationResponseModel
from app.core.services.admin_user_service import AdminUserService
from app.core.services.user_service import UserService
from app.utils.constants.enums import (
    EducationLevelEnum,
    GenderEnum,
    JobSphereEnum,
    RelationshipGoalEnum,
    SubscriptionTierEnum,
)


router = APIRouter()


@router.get("/")
@inject
async def search_users(
    admin_user_service: FromDishka[AdminUserService],
    _admin: Annotated[AdminSchema, Depends(require_admin)],
    pagination: Annotated[PaginationRequestModel, Depends()],
    q: str | None = Query(default=None),
    city: str | None = Query(default=None),
    gender: GenderEnum | None = Query(default=None),
    age_min: int | None = Query(default=None, ge=13, le=100),
    age_max: int | None = Query(default=None, ge=13, le=100),
    relationship_goal: RelationshipGoalEnum | None = Query(default=None),
    job_sphere: list[JobSphereEnum] | None = Query(default=None),
    education_level: list[EducationLevelEnum] | None = Query(default=None),
    education_details: str | None = Query(default=None),
    is_banned: bool | None = Query(default=None),
    subscription_tier: SubscriptionTierEnum | None = Query(default=None),
    only_premium: bool | None = Query(default=None),
    profile_moderation_approved: bool | None = Query(default=None),
    filter_option_ids: list[UUID] | None = Query(default=None),
) -> PaginationResponseModel[AdminUserPreviewSchema]:
    return await admin_user_service.search_users(
        pagination,
        q=q,
        city=city,
        gender=gender,
        age_min=age_min,
        age_max=age_max,
        relationship_goal=relationship_goal,
        job_spheres=job_sphere,
        education_levels=education_level,
        education_details=education_details,
        is_banned=is_banned,
        subscription_tier=subscription_tier.value if subscription_tier else None,
        only_premium=only_premium,
        profile_moderation_approved=profile_moderation_approved,
        filter_option_ids=filter_option_ids,
    )


@router.get("/{user_id}")
@inject
async def get_user(
    user_id: UUID,
    admin_user_service: FromDishka[AdminUserService],
    _admin: Annotated[AdminSchema, Depends(require_admin)],
) -> AdminUserDetailSchema:
    return await admin_user_service.get_user_detail(user_id)


@router.get("/{user_id}/reports")
@inject
async def get_user_reports(
    user_id: UUID,
    admin_user_service: FromDishka[AdminUserService],
    _admin: Annotated[AdminSchema, Depends(require_admin)],
) -> list[AdminReportItemSchema]:
    return await admin_user_service.list_user_reports(user_id)


@router.patch("/{user_id}/ban", status_code=204)
@inject
async def ban_user(
    user_id: UUID,
    body: AdminBanUserRequest,
    user_service: FromDishka[UserService],
    admin: Annotated[AdminSchema, Depends(require_admin)],
) -> Response:
    await user_service.set_ban_status(user_id, body.is_banned)
    return Response(status_code=204)


@router.patch("/{user_id}/subscription", status_code=204)
@inject
async def set_subscription(
    user_id: UUID,
    body: AdminSubscriptionRequest,
    admin_user_service: FromDishka[AdminUserService],
    admin: Annotated[AdminSchema, Depends(require_admin)],
) -> Response:
    await admin_user_service.set_subscription(
        user_id,
        SubscriptionTierEnum(body.tier),
        body.expires_at,
        admin.id,
    )
    return Response(status_code=204)


@router.patch("/{user_id}/balances", status_code=204)
@inject
async def set_balances(
    user_id: UUID,
    body: AdminBalancesRequest,
    admin_user_service: FromDishka[AdminUserService],
    admin: Annotated[AdminSchema, Depends(require_admin)],
) -> Response:
    await admin_user_service.set_balances(
        user_id,
        superlikes_balance=body.superlikes_balance,
        boosts_balance=body.boosts_balance,
        boost_expires_at=body.boost_expires_at,
        staff_id=admin.id,
    )
    return Response(status_code=204)


@router.patch("/{user_id}/moderation", status_code=204)
@inject
async def set_moderation_flag(
    user_id: UUID,
    body: AdminProfileModerationRequest,
    admin_user_service: FromDishka[AdminUserService],
    admin: Annotated[AdminSchema, Depends(require_admin)],
) -> Response:
    await admin_user_service.set_profile_moderation(
        user_id,
        body.profile_moderation_approved,
        None,
        admin.id,
    )
    return Response(status_code=204)
