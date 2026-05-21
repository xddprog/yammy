from datetime import datetime, timezone
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from typing_extensions import Self

from app.infrastructure.database.models.user import User
from app.utils.constants.enums import SubscriptionTierEnum, UserLanguageEnum


class TelegramAuthSchema(BaseModel):
    init_data: str = Field(..., description="Данные инициализации из Telegram WebApp")


class TokenSchema(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenSchema(BaseModel):
    refresh_token: str


class LoginSchema(BaseModel):
    username: str
    password: str


class CurrentUserSessionSchema(BaseModel):
    """Минимальный снимок пользователя для сессии (GET /auth/current_user)."""

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
