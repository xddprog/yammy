from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class PresenceErrorResponseSchema(BaseModel):
    status_code: int
    detail: str


class PresencePeerSchema(BaseModel):
    user_id: UUID
    online: bool


class PresenceSnapshotSchema(BaseModel):
    peers: list[PresencePeerSchema] = Field(default_factory=list)


class PresenceUpdateSchema(BaseModel):
    user_id: UUID
    online: bool
    at: datetime


class PresenceSubscribeRequestSchema(BaseModel):
    peer_ids: list[UUID] = Field(default_factory=list)
