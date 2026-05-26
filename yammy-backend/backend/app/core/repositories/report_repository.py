from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select

from app.core.repositories.base import SqlAlchemyRepository
from app.infrastructure.database.models.report import Report


class ReportRepository(SqlAlchemyRepository[Report]):
    def __init__(self, session):
        super().__init__(session, Report)

    async def has_recent_report(
        self,
        *,
        reporter_id: UUID,
        reported_id: UUID,
        within: timedelta,
    ) -> bool:
        since = datetime.now(timezone.utc) - within
        query = (
            select(Report.id)
            .where(
                Report.reporter_id == reporter_id,
                Report.reported_id == reported_id,
                Report.created_at >= since,
            )
            .limit(1)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none() is not None

