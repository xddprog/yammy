from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends, Response

from app.api.v1.dependency.staff_auth import get_current_staff
from app.core.dto.admin import AdminReportUpdateRequest, AdminSchema
from app.core.services.admin_user_service import AdminUserService
from app.utils.constants.enums import ReportStatusEnum


router = APIRouter()


@router.patch("/{report_id}", status_code=204)
@inject
async def update_report(
    report_id: UUID,
    body: AdminReportUpdateRequest,
    admin_user_service: FromDishka[AdminUserService],
    staff: Annotated[AdminSchema, Depends(get_current_staff)],
) -> Response:
    await admin_user_service.update_report(
        report_id,
        ReportStatusEnum(body.status),
        body.review_note,
        staff.id,
    )
    return Response(status_code=204)
