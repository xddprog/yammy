from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.utils.helpers.url_helper import get_absolute_url
from app.core.dto.user import UserPhoto, UserSearchResponseSchema


class AppearanceRatingSchema(BaseModel):
    id: UUID = Field(serialization_alias="user_id")
    name: str
    age: int
    city: str
    photos: list[UserPhoto | str] = []

    @field_validator("photos")
    @classmethod
    def validate_photos(cls, photos: list[UserPhoto]) -> list[str]:
        return [get_absolute_url(photo.file_path) for photo in photos]


class AppearanceRatingRequest(BaseModel):
    rated_user_id: UUID
    score: int = Field(ge=1, le=10, description="Оценка внешности от 1 до 10")


class AppearanceRatingPairState(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_a_id: UUID
    user_b_id: UUID
    score_by_a: int | None = None
    score_by_b: int | None = None
    mutual_notified_at: datetime | None = None


class AppearanceRatingReceivedRow(BaseModel):
    other_user_id: UUID
    score: int
    my_score: int | None = None
    is_mutual: bool = False
    pair_id: UUID


class AppearanceRatingReceivedItem(UserSearchResponseSchema):
    score: int
    my_score: int | None = None
    is_mutual: bool = False


class AppearanceRatingStatsSchema(BaseModel):
    received_count: int = 0
    average_score: float | None = None
