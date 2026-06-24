from datetime import datetime
from typing import TYPE_CHECKING
import uuid
from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Text, and_, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import Base
from app.infrastructure.database.pg_enum import pg_enum
from app.utils.constants.enums import (
    EducationLevelEnum,
    GenderEnum,
    JobSphereEnum,
    ProfileModerationStatusEnum,
    RelationshipGoalEnum,
    SubscriptionTierEnum,
    UserLanguageEnum,
)


if TYPE_CHECKING:
    from app.infrastructure.database.models.filter import FilterOption
    from app.infrastructure.database.models.subscription import SubscriptionHistory


class UserPhoto(Base):
    __tablename__ = "photos"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    file_path: Mapped[str]
    order: Mapped[int] = mapped_column(default=0)
    is_main: Mapped[bool] = mapped_column(default=False)
    user: Mapped["User"] = relationship(back_populates="photos")
    


class User(Base):
    __tablename__ = "users"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True, nullable=False)
    name: Mapped[str]
    age: Mapped[int]
    gender: Mapped[GenderEnum] = mapped_column(pg_enum(GenderEnum))
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str] = mapped_column(Text, nullable=False)
    job_sphere: Mapped[JobSphereEnum | None] = mapped_column(
        pg_enum(JobSphereEnum), 
        nullable=True
    )
    job: Mapped[str | None] = mapped_column(Text, nullable=True)
    relationship_goal: Mapped[RelationshipGoalEnum] = mapped_column(
        pg_enum(RelationshipGoalEnum), 
        nullable=False
    )

    boost_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    
    education_level: Mapped[EducationLevelEnum | None] = mapped_column(
        pg_enum(EducationLevelEnum),
        nullable=True,
    )
    education_details: Mapped[str | None]

    is_banned: Mapped[bool] = mapped_column(default=False)

    profile_moderation_status: Mapped[ProfileModerationStatusEnum] = mapped_column(
        pg_enum(ProfileModerationStatusEnum),
        default=ProfileModerationStatusEnum.PENDING,
    )
    profile_moderation_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    adequacy_score: Mapped[float] = mapped_column(default=10.0)
    activity_score: Mapped[float] = mapped_column(default=1.0)
    last_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    subscription_tier: Mapped[SubscriptionTierEnum] = mapped_column(pg_enum(SubscriptionTierEnum), default=SubscriptionTierEnum.FREE)
    subscription_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    superlikes_balance: Mapped[int] = mapped_column(default=1)
    boosts_balance: Mapped[int] = mapped_column(default=1)
    profile_views_count: Mapped[int] = mapped_column(default=0, server_default="0")
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    language: Mapped[UserLanguageEnum] = mapped_column(
        pg_enum(UserLanguageEnum),
        default=UserLanguageEnum.RU,
    )

    referral_code: Mapped[str] = mapped_column(unique=True)
    referred_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    photos: Mapped[list["UserPhoto"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    filters: Mapped[list["FilterOption"]] = relationship(secondary="user_filters")
    subscription_history: Mapped[list["SubscriptionHistory"]] = relationship(back_populates="user")
    
    referrer: Mapped["User"] = relationship(remote_side=[id])

    main_photo: Mapped["UserPhoto"] = relationship(
        UserPhoto,
        primaryjoin=and_(
            id == UserPhoto.user_id,
            UserPhoto.is_main == True
        ),
        viewonly=True,
        uselist=False
    )
