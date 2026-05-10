from typing import Annotated
from uuid import UUID
from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends
from app.utils.helpers.rate_limit import RateLimited
from pyrate_limiter import Duration

from app.api.v1.dependency.providers.request import get_current_user
from app.core.services.like_service import LikeService
from app.infrastructure.database.models.user import User


router = APIRouter()


@router.post("/",
    dependencies=[
        Depends(RateLimited(30, Duration.MINUTE))
    ]
)
@inject
async def like_user(
    user_to_id: UUID,
    like_service: FromDishka[LikeService],
    current_user: Annotated[User, Depends(get_current_user)]
) -> None:
    await like_service.add_like(current_user.id, user_to_id)


@router.post("/dislike",
    dependencies=[
        Depends(RateLimited(30, Duration.MINUTE))
    ]
)
@inject
async def dislike_user(
    user_to_id: UUID,
    like_service: FromDishka[LikeService],
    current_user: Annotated[User, Depends(get_current_user)]
) -> None:
    await like_service.add_dislike(current_user.id, user_to_id)


@router.post("/match",
    dependencies=[
        Depends(RateLimited(30, Duration.MINUTE))
    ]
)
@inject
async def like_and_match(
    user_to_id: UUID,
    like_service: FromDishka[LikeService],
    current_user: Annotated[User, Depends(get_current_user)]
) -> None:
    await like_service.like_and_match(current_user.id, user_to_id)
