from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, computed_field, field_validator

from app.core.dto.message import MessageSchema
from app.core.dto.user import UserSearchResponseSchema
from app.infrastructure.database.models.user import UserPhoto
from app.utils.helpers.url_helper import get_absolute_url


class ChatPeerDetailSchema(UserSearchResponseSchema):
    last_seen: datetime


class ChatErrorResponseSchema(BaseModel):
    status_code: int
    detail: str


class ChatSchema(BaseModel):
    id: UUID
    match_id: UUID
    created_at: datetime

    user_to: ChatPeerDetailSchema


class ChatPeerSchema(BaseModel):
    user_id: UUID = Field(validation_alias="id")
    name: str
    age: int
    main_photo: str | None = None
    last_seen: datetime

    @field_validator("main_photo", mode="before")
    @classmethod
    def validate_main_photo(cls, main_photo: UserPhoto | None) -> str | None:
        photo = main_photo.file_path if main_photo else None
        return get_absolute_url(photo) if photo else None


class ChatLastMessageSchema(BaseModel):
    content: str
    created_at: datetime


class ChatListItemSchema(BaseModel):
    match_id: UUID
    chat_id: UUID | None = None
    peer: ChatPeerSchema
    last_message_content: str | None = Field(exclude=True)
    last_message_at: datetime | None = Field(exclude=True)
    unread_count: int = 0
    
    @computed_field 
    def last_message(self) -> ChatLastMessageSchema | None:
        if self.last_message_content is None or self.last_message_at is None:
            return None
        return ChatLastMessageSchema(
            content=self.last_message_content,
            created_at=self.last_message_at,
        )