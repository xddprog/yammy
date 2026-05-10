from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, DateTime, Enum as SQLAlchemyEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.infrastructure.database.models.base import Base
from app.utils.constants.enums import SubscriptionTierEnum
from datetime import datetime
import uuid


if TYPE_CHECKING:
    from app.infrastructure.database.models.user import User


class SubscriptionHistory(Base):
    __tablename__ = "subscription_history"
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    tier: Mapped[SubscriptionTierEnum] = mapped_column(SQLAlchemyEnum(SubscriptionTierEnum))
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    transaction_id: Mapped[str | None]
    user: Mapped["User"] = relationship(back_populates="subscription_history")