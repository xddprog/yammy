from datetime import timedelta
from uuid import UUID

from app.core.dto.report import ReportCreateRequest
from app.core.repositories.report_repository import ReportRepository
from app.core.repositories.user_repository import UserRepository
from app.infrastructure.errors.base import BadRequestException, NotFoundException


class ReportService:
    DUPLICATE_WITHIN = timedelta(hours=1)

    def __init__(
        self,
        report_repository: ReportRepository,
        user_repository: UserRepository,
    ):
        self.report_repository = report_repository
        self.user_repository = user_repository

    async def create_report(
        self,
        *,
        reporter_id: UUID,
        request: ReportCreateRequest,
    ) -> None:
        if reporter_id == request.reported_id:
            raise BadRequestException("Нельзя отправить жалобу на себя")

        reported_user = await self.user_repository.get_item(str(request.reported_id))
        if reported_user is None:
            raise NotFoundException("Пользователь не найден")

        already = await self.report_repository.has_recent_report(
            reporter_id=reporter_id,
            reported_id=request.reported_id,
            within=self.DUPLICATE_WITHIN,
        )
        if already:
            raise BadRequestException("Вы уже отправляли жалобу этому пользователю недавно")

        await self.report_repository.add_item(
            reporter_id=reporter_id,
            reported_id=request.reported_id,
            reason=request.reason,
            comment=request.comment,
        )

