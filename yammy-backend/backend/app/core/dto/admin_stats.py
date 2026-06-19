from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from pydantic import BaseModel, Field


class TimeSeriesPointSchema(BaseModel):
    date: date
    value: int


class StatsOverviewCardsSchema(BaseModel):
    total_users: int
    new_users_period: int
    dau: int
    wau: int
    mau: int
    total_matches: int
    messages_period: int
    reports_period: int


class StatsGrowthSchema(BaseModel):
    registrations: list[TimeSeriesPointSchema]


class StatsEngagementSchema(BaseModel):
    likes: list[TimeSeriesPointSchema]
    matches: list[TimeSeriesPointSchema]
    messages: list[TimeSeriesPointSchema]


class StatsMonetizationSchema(BaseModel):
    tier_free: int
    tier_vip: int
    tier_premium: int
    revenue_period: int
    revenue_total: int
    payments_count_period: int
    revenue_by_day: list[TimeSeriesPointSchema] = Field(default_factory=list)


class StatsAiSearchSchema(BaseModel):
    searching: int
    ready: int
    failed: int
    avg_result_count: float


class StatsSafetySchema(BaseModel):
    reports_by_reason: dict[str, int]
    banned_users: int


class AdminStatsOverviewSchema(BaseModel):
    period_days: int = 30
    date_from: date | None = None
    date_to: date | None = None
    cards: StatsOverviewCardsSchema
    growth: StatsGrowthSchema
    engagement: StatsEngagementSchema
    monetization: StatsMonetizationSchema
    ai_search: StatsAiSearchSchema
    safety: StatsSafetySchema
    pending_moderation: int
