from typing import Annotated
from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends
from app.utils.helpers.rate_limit import RateLimited
from pyrate_limiter import Duration

from app.api.v1.dependency.providers.request import get_current_user
from app.core.services.search_service import SearchService
from app.core.services.appearance_rating_service import AppearanceRatingService
from app.core.dto.appearance_rating import AppearanceRatingSchema, AppearanceRatingRequest
from app.infrastructure.database.models.user import User


router = APIRouter()


@router.get("/appearance-rating", response_model=list[AppearanceRatingSchema],
    dependencies=[
        Depends(RateLimited(10, Duration.MINUTE))
    ]
)
@inject
async def get_users_for_appearance_rating(
    user_service: FromDishka[SearchService],
    current_user: Annotated[User, Depends(get_current_user)]
) -> list[AppearanceRatingSchema]:
    return await user_service.get_users_for_appearance_rating(current_user.id, limit=20)


@router.post("/appearance-rating",
    dependencies=[
        Depends(RateLimited(60, Duration.MINUTE))
    ]
)
@inject
async def rate_user_appearance(
    appearance_rating_request: AppearanceRatingRequest,
    appearance_rating_service: FromDishka[AppearanceRatingService],
    current_user: Annotated[User, Depends(get_current_user)]
):
    await appearance_rating_service.add_appearance_rating(
        rater_user_id=current_user.id,
        rated_user_id=appearance_rating_request.rated_user_id,
        score=appearance_rating_request.score
    )
