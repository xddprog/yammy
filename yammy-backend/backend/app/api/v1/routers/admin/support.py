from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends, Query, Response

from app.api.v1.dependency.staff_auth import get_current_staff
from app.core.dto.admin import AdminSchema
from app.core.dto.pagination import PaginationRequestModel, PaginationResponseModel
from app.core.dto.support import (
    SupportConversationDetailSchema,
    SupportConversationListItemSchema,
    SupportConversationStatusRequest,
    SupportMessageSchema,
    SupportReplyRequest,
)
from app.core.services.support_service import SupportService
from app.utils.constants.enums import SupportConversationStatusEnum


router = APIRouter()


@router.get("/conversations")
@inject
async def list_support_conversations(
    support_service: FromDishka[SupportService],
    _staff: Annotated[AdminSchema, Depends(get_current_staff)],
    pagination: Annotated[PaginationRequestModel, Depends()],
    status: SupportConversationStatusEnum | None = Query(default=None),
) -> PaginationResponseModel[SupportConversationListItemSchema]:
    return await support_service.list_conversations_for_admin(pagination, status=status)


@router.get("/conversations/{conversation_id}")
@inject
async def get_support_conversation(
    conversation_id: UUID,
    support_service: FromDishka[SupportService],
    _staff: Annotated[AdminSchema, Depends(get_current_staff)],
) -> SupportConversationDetailSchema:
    return await support_service.get_conversation_detail(conversation_id)


@router.get("/conversations/{conversation_id}/messages")
@inject
async def list_support_messages(
    conversation_id: UUID,
    support_service: FromDishka[SupportService],
    _staff: Annotated[AdminSchema, Depends(get_current_staff)],
    pagination: Annotated[PaginationRequestModel, Depends()],
) -> PaginationResponseModel[SupportMessageSchema]:
    return await support_service.list_messages(conversation_id, pagination)


@router.post("/conversations/{conversation_id}/messages")
@inject
async def reply_support_conversation(
    conversation_id: UUID,
    body: SupportReplyRequest,
    support_service: FromDishka[SupportService],
    staff: Annotated[AdminSchema, Depends(get_current_staff)],
) -> SupportMessageSchema:
    return await support_service.reply_as_staff(conversation_id, staff.id, body.content)


@router.patch("/conversations/{conversation_id}")
@inject
async def update_support_conversation_status(
    conversation_id: UUID,
    body: SupportConversationStatusRequest,
    support_service: FromDishka[SupportService],
    _staff: Annotated[AdminSchema, Depends(get_current_staff)],
) -> SupportConversationDetailSchema:
    return await support_service.set_status(conversation_id, body.status)
