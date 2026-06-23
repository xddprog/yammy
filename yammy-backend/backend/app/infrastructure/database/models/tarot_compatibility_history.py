from datetime import datetime
import uuid

from sqlalchemy import DateTime, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.models.base import Base
from app.infrastructure.database.pg_enum import pg_enum
from app.utils.constants.enums import AiSearchHistoryStatusEnum


class TarotCompatibilityHistory(Base):
    __tablename__ = "tarot_compatibility_history"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    partner_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[AiSearchHistoryStatusEnum] = mapped_column(
        pg_enum(AiSearchHistoryStatusEnum),
        default=AiSearchHistoryStatusEnum.SEARCHING,
        index=True,
    )
    result_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index(
            "ix_tarot_compatibility_user_partner_created",
            "user_id",
            "partner_user_id",
            "created_at",
        ),
    )
