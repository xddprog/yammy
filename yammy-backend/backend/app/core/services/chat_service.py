from uuid import UUID

from app.core.dto.chat import ChatListItemSchema, ChatSchema
from app.core.dto.pagination import PaginationRequestModel, PaginationResponseModel
from app.core.repositories.chat_repository import ChatRepository
from app.infrastructure.errors.base import NotFoundException


class ChatService:
    def __init__(self, chat_repository: ChatRepository):
        self.chat_repository = chat_repository

    async def list_user_chats(self, user_id: UUID, pagination: PaginationRequestModel) -> PaginationResponseModel[ChatListItemSchema]:
        total, rows = await self.chat_repository.list_for_user(user_id, pagination)
        return PaginationResponseModel(
            total=total,
            page=pagination.page,
            size=pagination.size,
            items=[ChatListItemSchema.model_validate(row, from_attributes=True) for row in rows],
        )

    async def get_chat_by_match_id(self, match_id: UUID, user_id: UUID) -> ChatSchema:
        row = await self.chat_repository.get_chat_by_match_id(match_id, user_id)
        if not row:
            raise NotFoundException(detail="Чат не найден")
        return ChatSchema.model_validate(row, from_attributes=True)
