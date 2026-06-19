from datetime import date
from typing import Annotated

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.v1.dependency.staff_auth import require_admin
from app.core.dto.admin import AdminSchema
from app.core.dto.admin_stats import AdminStatsOverviewSchema
from app.core.services.admin_stats_service import AdminStatsService


router = APIRouter()


@router.get("/overview")
@inject
async def stats_overview(
    admin_stats_service: FromDishka[AdminStatsService],
    _admin: Annotated[AdminSchema, Depends(require_admin)],
    period: str = Query(default="30d", pattern="^(1d|7d|30d|90d)$"),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
) -> AdminStatsOverviewSchema:
    if (date_from is None) ^ (date_to is None):
        raise HTTPException(status_code=400, detail="Укажите обе даты: date_from и date_to")
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=400, detail="date_from не может быть позже date_to")
    return await admin_stats_service.get_overview(
        period,
        date_from=date_from,
        date_to=date_to,
    )
