from dishka.integrations.fastapi import FromDishka, inject
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from fastapi_limiter.depends import RateLimiter
from pyrate_limiter import Limiter, Rate, Duration

from app.core.services import UniversityService
from app.infrastructure.database.models.user import User
from app.api.v1.dependency.providers.request import get_current_user

router = APIRouter()


@router.get(
    "",
    dependencies=[
        Depends(RateLimiter(Limiter(Rate(limit=30, interval=Duration.MINUTE))))
    ],
)
@inject
async def search_universities(
    q: Annotated[str, Query(min_length=1, max_length=200)],
    university_service: FromDishka[UniversityService],
    current_user: Annotated[User, Depends(get_current_user)],
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
) -> list[str]:
    return await university_service.search(query=q, limit=limit)
