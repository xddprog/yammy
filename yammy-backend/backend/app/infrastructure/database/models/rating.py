from datetime import datetime
from typing import TYPE_CHECKING
import uuid
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import Base


if TYPE_CHECKING:
    from app.infrastructure.database.models.user import User


class Rating(Base):
    __tablename__ = "ratings"

    rater_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    rated_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    score: Mapped[int]
    
    __table_args__ = (UniqueConstraint('rater_user_id', 'rated_user_id', name='unique_rating_pair'),)
