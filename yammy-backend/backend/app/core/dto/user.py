
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, field_serializer, field_validator, model_validator
from app.utils.helpers.url_helper import get_absolute_url
from app.infrastructure.database.models.filter import FilterOption
from app.utils.constants.enums import (
    GenderEnum,
    RelationshipGoalEnum,
    SubscriptionTierEnum,
    EducationLevelEnum,
    JobSphereEnum,
    UserLanguageEnum,
)

from app.utils.constants.response_examples import USER_PROFILE_RESPONSE, USER_SEARCH_RESPONSE
from app.infrastructure.config.config import TELEGRAM_CONFIG


class BaseUserSchema(BaseModel):
    name: str
    age: int
    gender: GenderEnum
    relationship_goal: RelationshipGoalEnum
    bio: str | None = None
    city: str | None = None
    job: str | None = None
    job_sphere: JobSphereEnum | None = None
    education_level: EducationLevelEnum | None = None
    education_details: str | None = None
    subscription_tier: SubscriptionTierEnum
    boost_expires_at: datetime | None = None
    last_seen: datetime
    is_banned: bool = False
    superlikes_balance: int
    boosts_balance: int
    notifications_enabled: bool
    language: UserLanguageEnum


class UserPhoto(BaseModel):
    id: UUID
    file_path: str
    order: int
    is_main: bool = False

    @field_validator("file_path", mode="before")
    @classmethod
    def transform_file_path(cls, v):
        return get_absolute_url(v)

class UpdateImageOrderSchema(BaseModel):
    id: UUID
    order: int


class ImageOrderUpdateSchema(BaseModel):
    photos: list[UpdateImageOrderSchema]


class UserUpdateRequest(BaseModel):
    name: str | None = None
    age: int | None = Field(default=None, ge=16, le=100)
    gender: GenderEnum | None = None
    relationship_goal: RelationshipGoalEnum | None = None
    bio: str | None = None
    city: str | None = None
    job: str | None = None
    job_sphere: JobSphereEnum | None = None
    education_level: EducationLevelEnum | None = None
    education_details: str | None = None
    filters: list[UUID] = Field(default_factory=list)
    notifications_enabled: bool | None = None
    language: UserLanguageEnum | None = None

    @model_validator(mode="after")
    def validate_filters(self):
        if self.job and not self.job_sphere:
            raise ValueError("Job sphere is required if job is provided")
        if (self.education_details or "").strip():
            if self.education_level != EducationLevelEnum.HIGHER:
                raise ValueError("Education level must be higher if education details are provided")
        return self

class UserProfileSchema(BaseUserSchema):
    photos: list[UserPhoto] = []
    subscription_expires_at: datetime | None = None
    adequacy_score: float = 10.0
    referrals_count: int = 0
    referral_code: str = ""
    filter_option_ids: list[UUID] = Field(default_factory=list, validation_alias="filters")

    @field_serializer("referral_code")
    def serialize_referral_code(self, value: str) -> str:
        bot = TELEGRAM_CONFIG.BOT_USERNAME.strip().lstrip("@")
        if bot and value:
            return f"https://t.me/{bot}?start={value}"
        return ""

    @field_validator("filter_option_ids", mode="before")
    @classmethod
    def filter_option_ids_coerce(cls, v: list[FilterOption]) -> list[UUID]:
        return [x.id for x in v]

    @field_validator("photos", mode="before")
    @classmethod
    def transform_photos(cls, v):
        for photo in v:
            photo.file_path = get_absolute_url(photo.file_path)
        return v

    class Config:
        json_schema_extra = USER_PROFILE_RESPONSE


class UserSearchResponseSchema(BaseUserSchema):
    id: UUID = Field(serialization_alias="user_id")
    photos: list[str] = []
    filters: dict[str, dict[str, list[str]]] = Field(default_factory=dict)
    subscription_expires_at: datetime | None = None
    adequacy_score: float = 10.0
    referrals_count: int = 0
    personality_vector: list[float] | None = Field(None, exclude=True)
    appearance_vector: list[float] | None = Field(None, exclude=True)
    match_percentage: int | None = Field(None)

    @field_validator("filters", mode="before")
    @classmethod
    def transform_filters(cls, v) -> dict[str, dict[str, list[str]]]:
        if not v:
            return {}
        if isinstance(v, dict):
            return v
        nested: dict[str, dict[str, list[str]]] = {}
        for opt in v:
            try:
                cat_slug = opt.subcategory.category.slug
                sub_slug = opt.subcategory.slug
                opt_slug = opt.slug
            except AttributeError:
                continue
            nested.setdefault(cat_slug, {}).setdefault(sub_slug, [])
            slugs = nested[cat_slug][sub_slug]
            if opt_slug not in slugs:
                slugs.append(opt_slug)
        return nested

    @field_validator("photos", mode="before")
    @classmethod
    def transform_photos(cls, v):
        if not v:
            return []
        if isinstance(v, list) and not all(isinstance(item, str) for item in v):
            return [get_absolute_url(p.file_path) for p in sorted(v, key=lambda x: x.order)]
        return v

    class Config:
        json_schema_extra = USER_SEARCH_RESPONSE
