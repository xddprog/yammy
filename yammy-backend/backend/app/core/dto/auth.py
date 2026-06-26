from datetime import datetime, timezone
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from typing_extensions import Self

from app.infrastructure.database.models.user import User
from app.utils.constants.enums import (
    EducationLevelEnum,
    GenderEnum,
    RelationshipGoalEnum,
    SubscriptionTierEnum,
    UserLanguageEnum,
)


class TelegramAuthSchema(BaseModel):
    init_data: str = Field(..., description="Данные инициализации из Telegram WebApp")


class TokenSchema(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"


class OnboardingPhotoMeta(BaseModel):
    order: int = Field(ge=0)
    is_main: bool = False


class OnboardingFinishRequest(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    age: int = Field(ge=16, le=100)
    gender: GenderEnum
    city: str = Field(min_length=1, max_length=256)
    education_level: EducationLevelEnum | None = None
    education_details: str | None = None
    relationship_goal: RelationshipGoalEnum
    filters: list[UUID] = Field(min_length=1)
    photos: list[OnboardingPhotoMeta] = Field(min_length=1)
    bio: str | None = None
    notifications_enabled: bool = True
    language: UserLanguageEnum | None = None
    referral_code: str | None = None

    @model_validator(mode="after")
    def validate_photos(self):
        if sum(photo.is_main for photo in self.photos) != 1:
            raise ValueError("Укажите одно главное фото")
        return self


class ModerateTextRequest(BaseModel):
    text: str = Field(..., min_length=1)


class RefreshTokenSchema(BaseModel):
    refresh_token: str


class LoginSchema(BaseModel):
    username: str
    password: str


class DevAuthTokenRequestSchema(BaseModel):
    user_id: UUID


class DevOnboardingTokenRequestSchema(BaseModel):
    telegram_id: int = Field(ge=1)


class DevAuthUserItemSchema(BaseModel):
    id: UUID
    name: str
    age: int
    is_current: bool = False


class DevAuthUsersListSchema(BaseModel):
    users: list[DevAuthUserItemSchema] = Field(default_factory=list)


class DevAuthSwitchResponseSchema(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: DevAuthUserItemSchema


class CurrentUserSessionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=False)

    id: UUID
    language: UserLanguageEnum
    is_banned: bool
    subscription_tier: SubscriptionTierEnum
    subscription_expires_at: datetime | None = None
    superlikes_balance: int
    boosts_balance: int
    has_active_subscription: bool
    has_active_boost: bool

    @classmethod
    def from_user(cls, user: User) -> Self:
        now = datetime.now(timezone.utc)
        exp = user.subscription_expires_at
        sub_active = user.subscription_tier != SubscriptionTierEnum.FREE and (
            exp is None or exp > now
        )
        be = user.boost_expires_at
        boost_active = be is not None and be > now
        return cls(
            id=user.id,
            language=user.language,
            is_banned=user.is_banned,
            subscription_tier=user.subscription_tier,
            subscription_expires_at=user.subscription_expires_at,
            superlikes_balance=user.superlikes_balance,
            boosts_balance=user.boosts_balance,
            has_active_subscription=sub_active,
            has_active_boost=boost_active,
        )
