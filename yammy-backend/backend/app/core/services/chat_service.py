from uuid import UUID
from app.core.repositories.chat_repository import ChatRepository
from app.infrastructure.errors.base import NotFoundException
from app.core.dto.chat import ChatSchema


class ChatService:
    def __init__(self, chat_repository: ChatRepository):
        self.chat_repository = chat_repository

    async def get_chat_by_match_id(self, match_id: UUID, user_id: UUID) -> ChatSchema:
        chat = await self.chat_repository.get_chat_by_match_id(match_id, user_id)
        if not chat:
            raise NotFoundException(detail="Чат не найден")
        return ChatSchema.model_validate(chat, from_attributes=True)