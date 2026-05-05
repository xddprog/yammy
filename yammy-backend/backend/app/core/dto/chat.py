from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

from app.core.dto.message import MessageSchema



class UserToSchema(BaseModel):
    id: UUID
    name: str
    main_photo: str
    last_seen: datetime


class ChatErrorResponseSchema(BaseModel):
    status_code: int
    detail: str


class ChatSchema(BaseModel):
    id: UUID
    match_id: UUID
    created_at: datetime

    user_to: UserToSchema
    messages: list[MessageSchema] = []