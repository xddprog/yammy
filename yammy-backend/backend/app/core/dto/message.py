from typing import Optional
from uuid import UUID
from pydantic import BaseModel, field_validator
from datetime import datetime

from app.infrastructure.database.models.user import UserPhoto
from app.utils.helpers.url_helper import get_absolute_url


class MessagePhotoUploadSchema(BaseModel):
    file: str
    content_type: str


class MessageCreateRequest(BaseModel):
    chat_id: UUID
    content: str
    reply_to_id: UUID | None = None
    sender_id: UUID
    images: list[MessagePhotoUploadSchema] = []


class MessageEditRequest(BaseModel):
    content: str | None = None
    reply_to_id: UUID | None = None


class MessageSenderSchema(BaseModel):
    id: UUID
    name: str
    main_photo: str | None = None

    @field_validator("main_photo", mode="before")
    @classmethod
    def validate_main_photo(cls, main_photo: UserPhoto | None) -> str | None:
        photo = main_photo.file_path if main_photo else None
        return get_absolute_url(photo) if photo else None


class MessagePhotoSchema(BaseModel):
    id: UUID
    file_path: str
    order: int


class MessageSchema(BaseModel):
    id: UUID
    content: str
    
    created_at: datetime
    updated_at: datetime | None = None

    is_read: bool
    is_edited: bool
    is_deleted: bool
    
    reply_to: Optional["MessageSchema"] = None 
    sender: MessageSenderSchema
    
    images: list[MessagePhotoSchema] = []