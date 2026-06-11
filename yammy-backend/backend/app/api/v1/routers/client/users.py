from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from typing import Annotated
from fastapi import APIRouter, Depends, Query, UploadFile, File
from app.utils.helpers.rate_limit import RateLimited
from pyrate_limiter import Duration

from app.core.dto.pagination import PaginationRequestModel, PaginationResponseModel
from app.core.dto.ai_search import (
    AiSearchCreateRequest,
    AiSearchFeedResponse,
    AiSearchHistoryItemSchema,
    AiSearchHistoryListResponse,
)
from app.core.dto.search import SearchRequest
from app.core.services import AiSearchService, ModerationService, SearchService, UserService
from app.core.dto.user import (
    ImageOrderUpdateSchema,
    UserPhoto,
    UserProfileSchema,
    UserSearchResponseSchema,
    UserUpdateRequest,
)
from app.infrastructure.database.models.user import User
from app.infrastructure.logging.logger import get_logger
from app.api.v1.dependency.providers.request import get_current_user
from app.core.tasks.process_ai_search_history_task import process_ai_search_history


router = APIRouter()
logger = get_logger(__name__)


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


@router.get(
    "/likes",
    dependencies=[
        Depends(RateLimited(30, Duration.MINUTE)),
    ],
)
@inject
async def get_received_likes(
    search_service: FromDishka[SearchService],
    current_user: Annotated[User, Depends(get_current_user)],
    pagination: Annotated[PaginationRequestModel, Query()],
) -> PaginationResponseModel[UserSearchResponseSchema]:
    return await search_service.get_received_likes(current_user, pagination)


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


@router.post(
    "/search/ai/history",
    response_model=AiSearchHistoryItemSchema,
)
@inject
async def create_ai_search_history_item(
    body: AiSearchCreateRequest,
    ai_search_service: FromDishka[AiSearchService],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AiSearchHistoryItemSchema:
    item = await ai_search_service.create_history_item(current_user, body)
    try:
        await process_ai_search_history.kiq(str(item.id))
    except Exception:
        logger.exception("ai_search_enqueue_failed", history_id=str(item.id))
        await ai_search_service.process_history_item(item.id)
    return item


@router.get(
    "/search/ai/history",
    response_model=AiSearchHistoryListResponse,
)
@inject
async def list_ai_search_history_items(
    ai_search_service: FromDishka[AiSearchService],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AiSearchHistoryListResponse:
    return await ai_search_service.list_history(current_user)


@router.get(
    "/search/ai/history/{history_id}",
    response_model=AiSearchHistoryItemSchema,
)
@inject
async def get_ai_search_history_item(
    history_id: UUID,
    ai_search_service: FromDishka[AiSearchService],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AiSearchHistoryItemSchema:
    return await ai_search_service.get_history_item(current_user, history_id)


@router.get(
    "/search/ai/history/{history_id}/feed",
    response_model=AiSearchFeedResponse,
)
@inject
async def get_ai_search_history_feed(
    history_id: UUID,
    ai_search_service: FromDishka[AiSearchService],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AiSearchFeedResponse:
    return await ai_search_service.get_feed(current_user, history_id)


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


@router.post(
    "/boosts/activate",
    status_code=204,
    dependencies=[
        Depends(RateLimited(10, Duration.MINUTE)),
    ],
)
@inject
async def activate_boost(
    user_service: FromDishka[UserService],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    await user_service.activate_boost(current_user.id)