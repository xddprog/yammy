from uuid import UUID
from pydantic import BaseModel, Field, field_validator

from app.utils.url_helper import get_absolute_url
from app.core.dto.user import UserPhoto


class AppearanceRatingSchema(BaseModel):
    id: UUID = Field(serialization_alias="user_id")
    name: str
    age: int
    city: str | None = None
    photos: list[UserPhoto | str] = []

    @field_validator("photos")
    @classmethod
    def validate_photos(cls, photos: list[UserPhoto]) -> list[str]:
        return [get_absolute_url(photo.file_path) for photo in photos]


class AppearanceRatingRequest(BaseModel):
    rated_user_id: UUID
    score: int = Field(ge=1, le=10, description="Оценка внешности от 1 до 10")
