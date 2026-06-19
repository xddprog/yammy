from datetime import datetime
import uuid

from sqlalchemy import DateTime, ForeignKey, Enum as SQLAlchemyEnum, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.models.base import Base
from app.utils.constants.enums import ReportReasonEnum, ReportStatusEnum


class Report(Base):
    __tablename__ = "reports"

    reporter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    reported_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))

    reason: Mapped[ReportReasonEnum] = mapped_column(SQLAlchemyEnum(ReportReasonEnum))
    comment: Mapped[str | None] = mapped_column(Text)
    status: Mapped[ReportStatusEnum] = mapped_column(
        SQLAlchemyEnum(ReportStatusEnum),
        default=ReportStatusEnum.PENDING,
        server_default=ReportStatusEnum.PENDING.value,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)