from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.utils.constants.enums import AdminRoleEnum


class AdminSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    role: AdminRoleEnum
    created_at: datetime


class AdminBanUserRequest(BaseModel):
    is_banned: bool


class AdminSubscriptionRequest(BaseModel):
    tier: str
    expires_at: datetime | None = None


class AdminBalancesRequest(BaseModel):
    superlikes_balance: int | None = None
    boosts_balance: int | None = None
    boost_expires_at: datetime | None = None


class AdminProfileModerationRequest(BaseModel):
    profile_moderation_approved: bool


class AdminModerationDecisionRequest(BaseModel):
    approved: bool
    note: str | None = None


class AdminReportUpdateRequest(BaseModel):
    status: str
    review_note: str | None = None
