from uuid import UUID
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import Base
from app.utils.constants.enums import PaymentStatus


if TYPE_CHECKING:
    from app.infrastructure.database.models.user import User


class Payment(Base):
    __tablename__ = "payments"
    
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    
    amount: Mapped[int]
    status: Mapped[PaymentStatus] = mapped_column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    transaction_id: Mapped[str | None] = mapped_column(default=None)
    payment_date: Mapped[datetime | None] = mapped_column(default=None)
    