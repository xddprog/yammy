from uuid import UUID

from pydantic import BaseModel

from app.utils.constants.enums import ReportReasonEnum


class ReportCreateRequest(BaseModel):
    reported_id: UUID
    reason: ReportReasonEnum
    comment: str | None = None

