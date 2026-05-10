from typing import Annotated

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends, Query

from app.core.services.city_service import CityService
from app.infrastructure.database.models.user import User
from app.api.v1.dependency.providers.request import get_current_user

router = APIRouter()


@router.get("")
@inject
async def cities(
    q: str,
    city_service: FromDishka[CityService],
    current_user: Annotated[User, Depends(get_current_user)],
    limit:int = 10,
) -> list[str]:
    return await city_service.suggest(query=q, limit=limit)
