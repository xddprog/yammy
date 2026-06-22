from typing import Annotated
from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends, Query
from app.utils.helpers.rate_limit import RateLimited
from pyrate_limiter import Duration

from app.api.v1.dependency.providers.request import get_current_user
from app.core.dto.pagination import PaginationRequestModel, PaginationResponseModel
from app.core.services.search_service import SearchService
from app.core.services.appearance_rating_service import AppearanceRatingService
from app.core.dto.appearance_rating import (
    AppearanceRatingSchema,
    AppearanceRatingRequest,
    AppearanceRatingReceivedItem,
)
from app.infrastructure.database.models.user import User


router = APIRouter()


@router.get(
    "",
    response_model=list[AppearanceRatingSchema],
    dependencies=[
        Depends(RateLimited(10, Duration.MINUTE))
    ]
)
@inject
async def get_users_for_appearance_rating(
    search_service: FromDishka[SearchService],
    current_user: Annotated[User, Depends(get_current_user)]
) -> list[AppearanceRatingSchema]:
    return await search_service.get_users_for_appearance_rating(current_user.id, limit=20)


@router.get(
    "/received",
    dependencies=[
        Depends(RateLimited(30, Duration.MINUTE)),
    ],
)
@inject
async def get_received_appearance_ratings(
    appearance_rating_service: FromDishka[AppearanceRatingService],
    current_user: Annotated[User, Depends(get_current_user)],
    pagination: Annotated[PaginationRequestModel, Query()],
) -> PaginationResponseModel[AppearanceRatingReceivedItem]:
    return await appearance_rating_service.get_received_appearance_ratings(current_user, pagination)


@router.post(
    "",
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
