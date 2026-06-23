from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.utils.constants.enums import AiSearchHistoryStatusEnum


class TarotCardSchema(BaseModel):
    name: str
    position: Literal["past", "present", "future"]
    meaning: str


class TarotCompatibilityResultSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")

    summary: str
    cards: list[TarotCardSchema]
    reading_text: str


class TarotCompatibilityCreateRequest(BaseModel):
    partner_user_id: UUID
    force_new: bool = False


class TarotCompatibilityItemSchema(BaseModel):
    id: UUID
    partner_user_id: UUID
    status: AiSearchHistoryStatusEnum
    result_json: TarotCompatibilityResultSchema | None = None
    error_message: str | None = None
    created_at: datetime
    completed_at: datetime | None = None


class TarotCompatibilityListResponse(BaseModel):
    items: list[TarotCompatibilityItemSchema]
    remaining_today: int


class TarotCompatibilityWithPartnerResponse(BaseModel):
    item: TarotCompatibilityItemSchema | None
    remaining_today: int
