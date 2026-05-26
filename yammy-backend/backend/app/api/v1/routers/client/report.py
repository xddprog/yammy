from typing import Annotated

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends
from pyrate_limiter import Duration
from starlette.responses import Response

from app.api.v1.dependency.providers.request import get_current_user
from app.core.dto.report import ReportCreateRequest
from app.core.services import ReportService
from app.infrastructure.database.models.user import User
from app.utils.helpers.rate_limit import RateLimited

router = APIRouter()


@router.post(
    "/",
    dependencies=[Depends(RateLimited(20, Duration.MINUTE))],
)
@inject
async def create_report(
    report_request: ReportCreateRequest,
    report_service: FromDishka[ReportService],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Response:
    await report_service.create_report(
        reporter_id=current_user.id,
        request=report_request,
    )
    return Response(status_code=204)

