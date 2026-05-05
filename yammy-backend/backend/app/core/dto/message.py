from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime


class MessagePhotoUploadSchema(BaseModel):
    file: str
    content_type: str


class MessageCreateRequest(BaseModel):
    content: str
    reply_to_id: UUID | None = None
    sender_id: UUID
    receiver_id: UUID
    images: list[MessagePhotoUploadSchema] = []


class MessageEditRequest(BaseModel):
    content: str | None = None
    reply_to_id: UUID | None = None


class MessageSenderSchema(BaseModel):
    id: UUID
    name: str
    main_photo: str | None = None


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