from datetime import datetime, timezone
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.dto.message import MessagePhotoSchema
from app.core.dto.user import UserPhoto
from app.utils.constants.enums import ReportReasonEnum, ReportStatusEnum, SubscriptionTierEnum


class AdminUserPreviewSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    age: int
    city: str
    is_banned: bool = False
    subscription_tier: SubscriptionTierEnum
    profile_moderation_approved: bool = False
    last_seen: datetime
    created_at: datetime | None = None
    main_photo: str | None = None


class AdminUserStatsSchema(BaseModel):
    received_likes_count: int = 0
    matches_count: int = 0
    profile_views_count: int = 0
    sent_likes_count: int = 0
    reports_received_count: int = 0
    reports_sent_count: int = 0
    messages_sent_count: int = 0
    ai_search_jobs_count: int = 0


class AdminUserDetailSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    telegram_id: int
    name: str
    age: int
    gender: str
    city: str
    bio: str | None = None
    relationship_goal: str
    is_banned: bool
    profile_moderation_approved: bool
    subscription_tier: SubscriptionTierEnum
    subscription_expires_at: datetime | None = None
    superlikes_balance: int
    boosts_balance: int
    boost_expires_at: datetime | None = None
    last_seen: datetime
    created_at: datetime | None = None
    main_photo: str | None = None
    photos: list[UserPhoto] = Field(default_factory=list)
    stats: AdminUserStatsSchema


class AdminReportItemSchema(BaseModel):
    id: UUID
    reason: ReportReasonEnum
    comment: str | None
    status: ReportStatusEnum
    created_at: datetime | None
    reviewed_at: datetime | None = None
    review_note: str | None = None
    reporter_id: UUID
    reporter_name: str


class ReportedUserListItemSchema(BaseModel):
    user: AdminUserPreviewSchema
    total_reports_count: int
    pending_reports_count: int
    last_report_at: datetime | None


class ReportedUserDetailSchema(BaseModel):
    user: AdminUserDetailSchema
    reports: list[AdminReportItemSchema]


class AdminChatMessageSchema(BaseModel):
    id: UUID
    sender_id: UUID
    sender_name: str
    content: str
    created_at: datetime | None
    is_deleted: bool = False
    is_edited: bool = False
    images: list[MessagePhotoSchema] = Field(default_factory=list)


class AdminUserChatSchema(BaseModel):
    has_chat: bool
    chat_id: UUID | None = None
    messages: list[AdminChatMessageSchema] = Field(default_factory=list)
