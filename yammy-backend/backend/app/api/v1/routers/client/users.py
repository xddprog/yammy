from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from typing import Annotated
from fastapi import APIRouter, Depends, UploadFile, File
from fastapi_limiter.depends import RateLimiter
from pyrate_limiter import Limiter, Rate, Duration

from app.core.dto.search import SearchRequest
from app.core.services import ModerationService, SearchService, UserService
from app.core.dto.user import (
    ImageOrderUpdateSchema,
    UserPhoto,
    UserProfileSchema,
    UserSearchResponseSchema,
    UserUpdateRequest,
)
from app.infrastructure.database.models.user import User
from app.api.v1.dependency.providers.request import get_current_user


router = APIRouter()


@router.get(
    "/",
    response_model=UserProfileSchema,
    dependencies=[
        Depends(RateLimiter(Limiter(Rate(limit=20, interval=Duration.MINUTE))))
    ]
)
@inject
async def get_user_profile(
    user_service: FromDishka[UserService], 
    current_user: Annotated[User, Depends(get_current_user)]
) -> UserProfileSchema:
    return await user_service.get_user_profile(current_user.id)


@router.post(
    "/search",
    # dependencies=[
    #     Depends(RateLimiter(Limiter(Rate(limit=4, interval=Duration.MINUTE))))
    # ]
)
@inject
async def search_users(
    search_request: SearchRequest,
    search_service: FromDishka[SearchService],
    current_user: Annotated[User, Depends(get_current_user)]
) -> list[UserSearchResponseSchema]:
    return await search_service.search_users(search_request, current_user)


@router.put(
    "/",
    dependencies=[
        Depends(RateLimiter(Limiter(Rate(limit=10, interval=Duration.MINUTE))))
    ]
)
@inject
async def update_user_profile(
    form: UserUpdateRequest,
    user_service: FromDishka[UserService],
    current_user: Annotated[User, Depends(get_current_user)]
) -> None:
    return await user_service.update_user(current_user.id, form)


@router.patch(
    "/image/{image_id}/order",
    dependencies=[
        Depends(RateLimiter(Limiter(Rate(limit=10, interval=Duration.MINUTE))))
    ],
)
@inject
async def update_image_order(
    image_id: UUID,
    body: ImageOrderUpdateSchema,
    current_user: Annotated[User, Depends(get_current_user)],
    user_service: FromDishka[UserService],
) -> list[UserPhoto]:
    return await user_service.update_image_order(
        current_user.id, image_id, body.order
    )


@router.delete(
    "/image",
    dependencies=[
        Depends(RateLimiter(Limiter(Rate(limit=10, interval=Duration.MINUTE))))
    ]
)
@inject
async def delete_image(
    image_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    user_service: FromDishka[UserService]
) -> None:
    return await user_service.delete_user_image(current_user.id, image_id)


@router.post(
    "/image",
    dependencies=[
        Depends(RateLimiter(Limiter(Rate(limit=5, interval=Duration.MINUTE))))
    ]
)
@inject
async def upload_new_image(
    user_service: FromDishka[UserService],
    current_user: Annotated[User, Depends(get_current_user)],
    moderation_service: FromDishka[ModerationService],
    image: UploadFile = File(...),
) -> None:
    await moderation_service.moderate_image(image)
    return await user_service.add_user_image(current_user.id, image)


@router.patch(
    "/image/main",
    dependencies=[
        Depends(RateLimiter(Limiter(Rate(limit=5, interval=Duration.MINUTE))))
    ],
)
@inject
async def set_main_image(
    current_user: Annotated[User, Depends(get_current_user)],
    moderation_service: FromDishka[ModerationService],
    user_service: FromDishka[UserService],
    image: UploadFile = File(...),
) -> None:
    await moderation_service.moderate_image(image)
    return await user_service.set_main_image(current_user.id, image)