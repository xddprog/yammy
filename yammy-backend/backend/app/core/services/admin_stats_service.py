from datetime import date, datetime, time, timedelta, timezone

from app.core.dto.admin_stats import (
    AdminStatsOverviewSchema,
    StatsAiSearchSchema,
    StatsEngagementSchema,
    StatsGrowthSchema,
    StatsMonetizationSchema,
    StatsOverviewCardsSchema,
    StatsSafetySchema,
    TimeSeriesPointSchema,
)
from app.core.repositories.admin_stats_repository import AdminStatsRepository


class AdminStatsService:
    PERIOD_MAP = {"1d": 1, "7d": 7, "30d": 30, "90d": 90}

    def __init__(self, admin_stats_repository: AdminStatsRepository):
        self.repo = admin_stats_repository

    @staticmethod
    def _custom_range(date_from: date, date_to: date) -> tuple[datetime, datetime, int]:
        since = datetime.combine(date_from, time.min, tzinfo=timezone.utc)
        until = datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=timezone.utc)
        period_days = (date_to - date_from).days + 1
        return since, until, period_days

    async def get_overview(
        self,
        period: str = "30d",
        *,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> AdminStatsOverviewSchema:
        if date_from is not None and date_to is not None:
            since, until, period_days = self._custom_range(date_from, date_to)
        else:
            period_days = self.PERIOD_MAP.get(period, 30)
            since, until = self.repo._period_range(period_days)
            date_from = since.date()
            date_to = until.date() - timedelta(days=1)

        day_1 = self.repo._period_start(1)
        day_7 = self.repo._period_start(7)
        day_30 = self.repo._period_start(30)

        tier_counts = await self.repo.tier_counts()
        ai = await self.repo.ai_search_stats()

        def to_points(rows: list[tuple]) -> list[TimeSeriesPointSchema]:
            return [
                TimeSeriesPointSchema(date=row[0].date() if hasattr(row[0], "date") else row[0], value=row[1])
                for row in rows
            ]

        return AdminStatsOverviewSchema(
            period_days=period_days,
            date_from=date_from,
            date_to=date_to,
            cards=StatsOverviewCardsSchema(
                total_users=await self.repo.count_users(),
                new_users_period=await self.repo.count_users_since(since, until),
                dau=await self.repo.count_active_since(day_1),
                wau=await self.repo.count_active_since(day_7),
                mau=await self.repo.count_active_since(day_30),
                total_matches=await self.repo.count_matches(),
                messages_period=await self.repo.count_messages_since(since, until),
                reports_period=await self.repo.count_reports_since(since, until),
            ),
            growth=StatsGrowthSchema(registrations=to_points(await self.repo.registrations_by_day(since, until))),
            engagement=StatsEngagementSchema(
                likes=to_points(await self.repo.likes_by_day(since, until)),
                matches=to_points(await self.repo.matches_by_day(since, until)),
                messages=to_points(await self.repo.messages_by_day(since, until)),
            ),
            monetization=StatsMonetizationSchema(
                tier_free=tier_counts.get("free", 0),
                tier_vip=tier_counts.get("vip", 0),
                tier_premium=tier_counts.get("premium", 0),
                revenue_period=await self.repo.paid_sum_since(since, until),
                revenue_total=await self.repo.paid_sum_total(),
                payments_count_period=await self.repo.paid_count_since(since, until),
                revenue_by_day=to_points(await self.repo.revenue_by_day(since, until)),
            ),
            ai_search=StatsAiSearchSchema(
                searching=ai[0],
                ready=ai[1],
                failed=ai[2],
                avg_result_count=ai[3],
            ),
            safety=StatsSafetySchema(
                reports_by_reason=await self.repo.reports_by_reason(),
                banned_users=await self.repo.count_banned_users(),
            ),
            pending_moderation=await self.repo.count_pending_moderation(),
        )
