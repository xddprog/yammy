from sqlalchemy import ForeignKey, Enum as SQLAlchemyEnum, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.infrastructure.database.models.base import Base
from app.utils.enums import ReportReasonEnum
import uuid

class Report(Base):
    __tablename__ = "reports"

    reporter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    reported_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    
    reason: Mapped[ReportReasonEnum] = mapped_column(SQLAlchemyEnum(ReportReasonEnum))
    comment: Mapped[str | None] = mapped_column(Text)