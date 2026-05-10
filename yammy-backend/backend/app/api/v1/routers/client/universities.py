from typing import Annotated

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends, Query
from app.utils.helpers.rate_limit import RateLimited
from pyrate_limiter import Duration

from app.api.v1.dependency.providers.request import get_current_user
from app.core.services import UniversityService
from app.infrastructure.database.models.user import User

router = APIRouter()


@router.get(
    "",
    dependencies=[
        Depends(RateLimited(60, Duration.MINUTE)),
    ],
)
@inject
async def search_universities(
    university_service: FromDishka[UniversityService],
    current_user: Annotated[User, Depends(get_current_user)],
    q: str,
    limit: int = 10,
) -> list[str]:
    return await university_service.search(query=q, limit=limit)
