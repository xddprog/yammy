from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Query

from app.core.services.city_service import CityService

router = APIRouter()


@router.get("")
@inject
async def cities(
    q: str,
    city_service: FromDishka[CityService],
    limit: int = 10,
) -> list[str]:
    return await city_service.suggest(query=q, limit=limit)
