from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.utils.constants.enums import (
    SupportAttachmentTypeEnum,
    SupportConversationStatusEnum,
    SupportMessageDirectionEnum,
    SupportRequestTypeEnum,
)


class SupportReplyRequest(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class SupportConversationStatusRequest(BaseModel):
    status: SupportConversationStatusEnum


class SupportUserPreviewSchema(BaseModel):
    id: UUID
    name: str
    age: int
    city: str
    main_photo: str | None = None


class SupportConversationListItemSchema(BaseModel):
    id: UUID
    telegram_id: int
    request_type: SupportRequestTypeEnum
    status: SupportConversationStatusEnum
    last_message_at: datetime | None
    created_at: datetime | None
    last_message_preview: str | None = None
    user: SupportUserPreviewSchema | None = None


class SupportMessageSchema(BaseModel):
    id: UUID
    direction: SupportMessageDirectionEnum
    content: str
    admin_id: UUID | None = None
    created_at: datetime | None
    attachment_type: SupportAttachmentTypeEnum | None = None
    attachment_url: str | None = None


class SupportConversationDetailSchema(BaseModel):
    id: UUID
    telegram_id: int
    request_type: SupportRequestTypeEnum
    status: SupportConversationStatusEnum
    last_message_at: datetime | None
    created_at: datetime | None
    user: SupportUserPreviewSchema | None = None
