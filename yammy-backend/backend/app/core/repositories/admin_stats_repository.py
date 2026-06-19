from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models.ai_search_history import AiSearchHistory
from app.infrastructure.database.models.chat import Chat
from app.infrastructure.database.models.like import Like
from app.infrastructure.database.models.match import Match
from app.infrastructure.database.models.message import Message
from app.infrastructure.database.models.payment import Payment
from app.infrastructure.database.models.report import Report
from app.infrastructure.database.models.user import User
from app.utils.constants.enums import PaymentStatus, ReportStatusEnum


class AdminStatsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _utc_today_start(self) -> datetime:
        now = datetime.now(timezone.utc)
        return now.replace(hour=0, minute=0, second=0, microsecond=0)

    def _period_start(self, days: int) -> datetime:
        """Start of the first calendar day in a period (UTC), inclusive."""
        return self._utc_today_start() - timedelta(days=days - 1)

    def _period_range(self, days: int) -> tuple[datetime, datetime]:
        """Calendar-day period: [since, until) in UTC."""
        since = self._period_start(days)
        until = self._utc_today_start() + timedelta(days=1)
        return since, until

    @staticmethod
    def _as_naive_utc(dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt
        return dt.astimezone(timezone.utc).replace(tzinfo=None)

    async def count_users(self) -> int:
        return int((await self.session.scalar(select(func.count(User.id)))) or 0)

    @staticmethod
    def _in_range(column, since: datetime, until: datetime | None):
        if until is None:
            return column >= since
        return and_(column >= since, column < until)

    async def count_users_since(self, since: datetime, until: datetime | None = None) -> int:
        q = select(func.count(User.id)).where(self._in_range(User.created_at, since, until))
        return int((await self.session.scalar(q)) or 0)

    async def count_active_since(self, since: datetime) -> int:
        q = select(func.count(User.id)).where(User.last_seen >= since)
        return int((await self.session.scalar(q)) or 0)

    async def count_matches(self) -> int:
        return int((await self.session.scalar(select(func.count(Match.id)))) or 0)

    async def count_messages_since(self, since: datetime, until: datetime | None = None) -> int:
        q = select(func.count(Message.id)).where(self._in_range(Message.created_at, since, until))
        return int((await self.session.scalar(q)) or 0)

    async def count_reports_since(self, since: datetime, until: datetime | None = None) -> int:
        q = select(func.count(Report.id)).where(self._in_range(Report.created_at, since, until))
        return int((await self.session.scalar(q)) or 0)

    async def registrations_by_day(
        self, since: datetime, until: datetime | None = None
    ) -> list[tuple[datetime, int]]:
        day = func.date_trunc("day", User.created_at)
        q = (
            select(day, func.count(User.id))
            .where(self._in_range(User.created_at, since, until))
            .group_by(day)
            .order_by(day)
        )
        rows = (await self.session.execute(q)).all()
        return [(row[0], int(row[1])) for row in rows]

    async def likes_by_day(
        self, since: datetime, until: datetime | None = None
    ) -> list[tuple[datetime, int]]:
        day = func.date_trunc("day", Like.created_at)
        q = (
            select(day, func.count(Like.user_from_id))
            .where(self._in_range(Like.created_at, since, until))
            .group_by(day)
            .order_by(day)
        )
        rows = (await self.session.execute(q)).all()
        return [(row[0], int(row[1])) for row in rows]

    async def matches_by_day(
        self, since: datetime, until: datetime | None = None
    ) -> list[tuple[datetime, int]]:
        day = func.date_trunc("day", Match.created_at)
        q = (
            select(day, func.count(Match.id))
            .where(self._in_range(Match.created_at, since, until))
            .group_by(day)
            .order_by(day)
        )
        rows = (await self.session.execute(q)).all()
        return [(row[0], int(row[1])) for row in rows]

    async def messages_by_day(
        self, since: datetime, until: datetime | None = None
    ) -> list[tuple[datetime, int]]:
        day = func.date_trunc("day", Message.created_at)
        q = (
            select(day, func.count(Message.id))
            .where(self._in_range(Message.created_at, since, until))
            .group_by(day)
            .order_by(day)
        )
        rows = (await self.session.execute(q)).all()
        return [(row[0], int(row[1])) for row in rows]

    async def tier_counts(self) -> dict[str, int]:
        q = select(User.subscription_tier, func.count(User.id)).group_by(User.subscription_tier)
        rows = (await self.session.execute(q)).all()
        return {str(row[0].value if hasattr(row[0], "value") else row[0]): int(row[1]) for row in rows}

    async def paid_sum_since(self, since: datetime, until: datetime | None = None) -> int:
        since_naive = self._as_naive_utc(since)
        filters = [
            Payment.status == PaymentStatus.PAID,
            Payment.payment_date.is_not(None),
            Payment.payment_date >= since_naive,
        ]
        if until is not None:
            filters.append(Payment.payment_date < self._as_naive_utc(until))
        q = select(func.coalesce(func.sum(Payment.amount), 0)).where(*filters)
        return int((await self.session.scalar(q)) or 0)

    async def paid_sum_total(self) -> int:
        q = select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.status == PaymentStatus.PAID,
        )
        return int((await self.session.scalar(q)) or 0)

    async def paid_count_since(self, since: datetime, until: datetime | None = None) -> int:
        since_naive = self._as_naive_utc(since)
        filters = [
            Payment.status == PaymentStatus.PAID,
            Payment.payment_date.is_not(None),
            Payment.payment_date >= since_naive,
        ]
        if until is not None:
            filters.append(Payment.payment_date < self._as_naive_utc(until))
        q = select(func.count(Payment.id)).where(*filters)
        return int((await self.session.scalar(q)) or 0)

    async def revenue_by_day(
        self, since: datetime, until: datetime | None = None
    ) -> list[tuple[datetime, int]]:
        since_naive = self._as_naive_utc(since)
        day = func.date_trunc("day", Payment.payment_date)
        filters = [
            Payment.status == PaymentStatus.PAID,
            Payment.payment_date.is_not(None),
            Payment.payment_date >= since_naive,
        ]
        if until is not None:
            filters.append(Payment.payment_date < self._as_naive_utc(until))
        q = (
            select(day, func.coalesce(func.sum(Payment.amount), 0))
            .where(*filters)
            .group_by(day)
            .order_by(day)
        )
        rows = (await self.session.execute(q)).all()
        return [(row[0], int(row[1])) for row in rows]

    async def ai_search_stats(self) -> tuple[int, int, int, float]:
        q = select(AiSearchHistory.status, func.count(AiSearchHistory.id)).group_by(AiSearchHistory.status)
        rows = (await self.session.execute(q)).all()
        counts = {str(r[0].value if hasattr(r[0], "value") else r[0]): int(r[1]) for r in rows}
        avg_q = select(func.coalesce(func.avg(AiSearchHistory.result_count), 0))
        avg_val = float((await self.session.scalar(avg_q)) or 0)
        return (
            counts.get("searching", 0),
            counts.get("ready", 0),
            counts.get("failed", 0),
            avg_val,
        )

    async def reports_by_reason(self) -> dict[str, int]:
        q = select(Report.reason, func.count(Report.id)).group_by(Report.reason)
        rows = (await self.session.execute(q)).all()
        return {
            str(row[0].value if hasattr(row[0], "value") else row[0]): int(row[1])
            for row in rows
        }

    async def count_banned_users(self) -> int:
        q = select(func.count(User.id)).where(User.is_banned.is_(True))
        return int((await self.session.scalar(q)) or 0)

    async def count_pending_moderation(self) -> int:
        q = select(func.count(User.id)).where(User.profile_moderation_approved.is_(False))
        return int((await self.session.scalar(q)) or 0)
