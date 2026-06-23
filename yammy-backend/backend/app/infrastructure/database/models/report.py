from datetime import datetime
import uuid

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.models.base import Base
from app.infrastructure.database.pg_enum import pg_enum
from app.utils.constants.enums import ReportReasonEnum, ReportStatusEnum


class Report(Base):
    __tablename__ = "reports"

    reporter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    reported_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))

    reason: Mapped[ReportReasonEnum] = mapped_column(pg_enum(ReportReasonEnum))
    comment: Mapped[str | None] = mapped_column(Text)
    status: Mapped[ReportStatusEnum] = mapped_column(
        pg_enum(ReportStatusEnum),
        default=ReportStatusEnum.PENDING,
        server_default=ReportStatusEnum.PENDING.value,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)