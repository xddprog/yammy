
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, model_validator
from app.utils.helpers.url_helper import get_absolute_url

from app.utils.constants.enums import (
    GenderEnum,
    RelationshipGoalEnum,
    SubscriptionTierEnum,
    EducationLevelEnum,
    JobSphereEnum,
    UserLanguageEnum,
)
from app.utils.constants.response_examples import USER_PROFILE_RESPONSE, USER_SEARCH_RESPONSE


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
    age: int | None = None
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

    @field_validator("filters", mode="before", check_fields=False)
    @classmethod
    def transform_to_filters_dict(cls, v):
        if not v: 
            return {}
        
        if isinstance(v, dict):
            return v
        
        nested_traits = {}
        for opt in v:
            try:
                cat_name = opt.subcategory.category.name
                sub_name = opt.subcategory.name
                opt_name = opt.name
                
                if cat_name not in nested_traits:
                    nested_traits[cat_name] = {}
                
                if sub_name not in nested_traits[cat_name]:
                    nested_traits[cat_name][sub_name] = []
                    
                nested_traits[cat_name][sub_name].append(opt_name)
            except AttributeError:
                continue
                
        return nested_traits

    @field_validator("photos", mode="before")
    @classmethod
    def transform_photos(cls, v):
        for photo in v:
            photo.file_path = get_absolute_url(photo.file_path)
        return v

    class Config:
        json_schema_extra = USER_PROFILE_RESPONSE


class UserSearchResponseSchema(UserProfileSchema):
    id: UUID = Field(serialization_alias="user_id")

    photos: list[str] = []
    filters: dict[str, dict[str, list[str]]] = Field(default_factory=dict)
    personality_vector: list[float] | None = Field(None, exclude=True) 
    appearance_vector: list[float] | None = Field(None, exclude=True) 

    match_percentage: int | None = Field(None)

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
