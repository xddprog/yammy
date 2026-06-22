from datetime import datetime
import uuid

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.models.base import Base


class AppearanceRatingPair(Base):
    __tablename__ = "appearance_rating_pairs"

    user_a_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    user_b_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    score_by_a: Mapped[int | None] = mapped_column(nullable=True)
    score_by_b: Mapped[int | None] = mapped_column(nullable=True)
    score_by_a_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    score_by_b_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    mutual_notified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("user_a_id", "user_b_id", name="unique_appearance_rating_pair"),
    )
