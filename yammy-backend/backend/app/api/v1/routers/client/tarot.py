from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from typing import Annotated
from fastapi import APIRouter, Depends

from app.core.dto.tarot_compatibility import (
    TarotCompatibilityCreateRequest,
    TarotCompatibilityItemSchema,
    TarotCompatibilityListResponse,
    TarotCompatibilityWithPartnerResponse,
)
from app.core.services import TarotCompatibilityService
from app.core.tasks.process_tarot_compatibility_task import process_tarot_compatibility
from app.infrastructure.database.models.user import User
from app.infrastructure.logging.logger import get_logger
from app.api.v1.dependency.providers.request import get_current_user
from app.utils.constants.enums import AiSearchHistoryStatusEnum


router = APIRouter()
logger = get_logger(__name__)


@router.get(
    "/compatibility",
    response_model=TarotCompatibilityListResponse,
)
@inject
async def list_tarot_compatibility_history(
    tarot_compatibility_service: FromDishka[TarotCompatibilityService],
    current_user: Annotated[User, Depends(get_current_user)],
) -> TarotCompatibilityListResponse:
    return await tarot_compatibility_service.list_history(current_user)


@router.get(
    "/compatibility/with/{partner_user_id}",
    response_model=TarotCompatibilityWithPartnerResponse,
)
@inject
async def get_tarot_compatibility_with_partner(
    partner_user_id: UUID,
    tarot_compatibility_service: FromDishka[TarotCompatibilityService],
    current_user: Annotated[User, Depends(get_current_user)],
) -> TarotCompatibilityWithPartnerResponse:
    return await tarot_compatibility_service.get_with_partner(current_user, partner_user_id)


@router.post(
    "/compatibility",
    response_model=TarotCompatibilityItemSchema,
)
@inject
async def create_tarot_compatibility_history(
    body: TarotCompatibilityCreateRequest,
    tarot_compatibility_service: FromDishka[TarotCompatibilityService],
    current_user: Annotated[User, Depends(get_current_user)],
) -> TarotCompatibilityItemSchema:
    item = await tarot_compatibility_service.create_history_item(current_user, body)
    if item.status == AiSearchHistoryStatusEnum.SEARCHING:
        try:
            await process_tarot_compatibility.kiq(str(item.id))
        except Exception:
            logger.exception("tarot_compatibility_enqueue_failed", history_id=str(item.id))
            await tarot_compatibility_service.process_history_item(item.id)
    return item


@router.get(
    "/compatibility/{history_id}",
    response_model=TarotCompatibilityItemSchema,
)
@inject
async def get_tarot_compatibility_history_item(
    history_id: UUID,
    tarot_compatibility_service: FromDishka[TarotCompatibilityService],
    current_user: Annotated[User, Depends(get_current_user)],
) -> TarotCompatibilityItemSchema:
    return await tarot_compatibility_service.get_history_item(current_user, history_id)
