from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.dto.user import UserSearchResponseSchema
from app.utils.constants.enums import AiSearchHistoryStatusEnum


class AiSearchCreateRequest(BaseModel):
    query_text: str = Field(default="", max_length=500)


class AiSearchResultItem(BaseModel):
    id: UUID
    highlights: str
    match_percentage: int


class AiSearchHistoryItemSchema(BaseModel):
    id: UUID
    query_text: str
    status: AiSearchHistoryStatusEnum
    result_count: int | None = None
    error_message: str | None = None
    created_at: datetime
    completed_at: datetime | None = None


class AiSearchHistoryListResponse(BaseModel):
    items: list[AiSearchHistoryItemSchema]
    remaining_today: int


class AiSearchFeedUserWithHighlight(BaseModel):
    user: UserSearchResponseSchema
    highlights: str
    match_percentage: int


class AiSearchFeedResponse(BaseModel):
    items: list[AiSearchFeedUserWithHighlight]
