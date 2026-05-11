from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from typing import Annotated
from fastapi import APIRouter, Depends, UploadFile, File, Query
from app.utils.helpers.rate_limit import RateLimited
from pyrate_limiter import Duration

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
        Depends(RateLimited(20, Duration.MINUTE))
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
    #     Depends(RateLimited(4, Duration.MINUTE))
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
        Depends(RateLimited(10, Duration.MINUTE))
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
        Depends(RateLimited(10, Duration.MINUTE))
    ],
)
@inject
async def update_image_order(
    body: ImageOrderUpdateSchema,
    current_user: Annotated[User, Depends(get_current_user)],
    user_service: FromDishka[UserService],
) -> list[UserPhoto]:
    return await user_service.update_image_order(
        current_user.id, body
    )


@router.delete(
    "/image",
    dependencies=[
        Depends(RateLimited(10, Duration.MINUTE))
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
    # dependencies=[
    #     Depends(RateLimited(5, Duration.MINUTE))
    # ]
)
@inject
async def upload_new_image(
    user_service: FromDishka[UserService],
    current_user: Annotated[User, Depends(get_current_user)],
    moderation_service: FromDishka[ModerationService],
    image: UploadFile = File(...),
) -> UserPhoto:
    await moderation_service.moderate_image(image, is_main=False)
    return await user_service.add_user_image(current_user.id, image)


@router.patch(
    "/image/main",
    # dependencies=[
    #     Depends(RateLimited(10, Duration.MINUTE))
    # ],
)
@inject
async def set_main_image(
    current_user: Annotated[User, Depends(get_current_user)],
    user_service: FromDishka[UserService],
    image: UploadFile = File(default=None),
    existing_image_id: UUID | None = None,
) -> UserPhoto | list[UserPhoto]:
    return await user_service.set_main_image(current_user.id, image, existing_image_id)