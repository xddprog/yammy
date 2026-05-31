from datetime import datetime
import uuid

from sqlalchemy import DateTime, Enum as SQLAlchemyEnum, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.models.base import Base
from app.utils.constants.enums import AiSearchHistoryStatusEnum


class AiSearchHistory(Base):
    __tablename__ = "ai_search_history"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    query_text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[AiSearchHistoryStatusEnum] = mapped_column(
        SQLAlchemyEnum(AiSearchHistoryStatusEnum),
        default=AiSearchHistoryStatusEnum.SEARCHING,
        index=True,
    )
    result_count: Mapped[int | None] = mapped_column(nullable=True)
    results_json: Mapped[list[dict] | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
