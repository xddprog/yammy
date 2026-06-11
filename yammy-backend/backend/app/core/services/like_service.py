from uuid import UUID

from starlette.responses import JSONResponse, Response

from app.core.repositories.like_repository import LikeRepository
from app.core.repositories.user_repository import UserRepository
from app.core.services.notification_service import NotificationService
from app.core.clients.redis_client import RedisClient
from app.infrastructure.errors.base import BadRequestException, ConflictException
from app.utils.constants.cache_keys import LikeCacheKeys, UserCacheKeys
from app.utils.constants.enums import LikeTypeEnum
from app.infrastructure.logging.logger import get_logger


logger = get_logger(__name__)


class LikeService:
    SEEN_TTL = 60 * 60
    MAX_SUPERLIKE_MESSAGE_LENGTH = 200
    
    def __init__(
        self,
        like_repository: LikeRepository,
        user_repository: UserRepository,
        redis_client: RedisClient,
        notification_service: NotificationService,
    ):
        self.like_repository = like_repository
        self.user_repository = user_repository
        self.redis_client = redis_client
        self.notification_service = notification_service

    async def _upsert_like(
        self,
        user_from_id: UUID,
        user_to_id: UUID,
        like_type: LikeTypeEnum,
        message: str | None = None,
    ) -> bool:
        is_match = await self.like_repository.has_liked(user_to_id, user_from_id)
        await self.like_repository.add_item(
            user_from_id=user_from_id,
            user_to_id=user_to_id,
            like_type=like_type,
            message=message,
        )
        return is_match

    async def add_like(self, user_from_id: UUID, user_to_id: UUID) -> Response:
        is_match = await self._upsert_like(user_from_id, user_to_id, LikeTypeEnum.LIKE)
        await self._add_to_seen(user_from_id, user_to_id)

        liker = await self.user_repository.get_item(str(user_from_id))
        recipient = await self.user_repository.get_item(str(user_to_id))

        if is_match:
            await self.like_repository.create_match(user_from_id, user_to_id)
            if liker:
                await self._notify_match_async(liker.id, user_from_id, user_to_id)
            if recipient:
                await self._notify_match_async(recipient.id, user_from_id, user_to_id)
            return JSONResponse(content={"message": "У вас новый метч!"})

        if liker and recipient:
            await self._notify_like_async(recipient.id, liker.name, LikeTypeEnum.LIKE.value)

        return Response(status_code=204)

    async def add_superlike(self, user_from_id: UUID, user_to_id: UUID, message: str) -> Response:
        if user_from_id == user_to_id:
            raise BadRequestException("Нельзя отправить суперлайк самому себе")

        trimmed_message = message.strip()
        if not trimmed_message:
            raise BadRequestException("Сообщение суперлайка не может быть пустым")
        if len(trimmed_message) > self.MAX_SUPERLIKE_MESSAGE_LENGTH:
            raise BadRequestException("Сообщение суперлайка слишком длинное")

        liker = await self.user_repository.get_item(str(user_from_id))
        recipient = await self.user_repository.get_item(str(user_to_id))

        existing_like = await self.like_repository.has_liked(user_to_id, user_from_id)
        if not existing_like:
            remaining = await self.user_repository.decrement_superlikes_balance(user_from_id)
            if remaining is None:
                raise ConflictException("Суперлайки закончились")

        is_match = await self._upsert_like(
            user_from_id,
            user_to_id,
            LikeTypeEnum.SUPERLIKE,
            trimmed_message,
        )
        await self._add_to_seen(user_from_id, user_to_id)

        if is_match:
            await self.like_repository.create_match(user_from_id, user_to_id)
            await self._notify_match_async(liker.id, user_from_id, user_to_id)
            await self._notify_match_async(recipient.id, user_from_id, user_to_id)
            return JSONResponse(content={"message": "У вас новый метч!"})

        await self._notify_like_async(recipient.id, liker.name, LikeTypeEnum.SUPERLIKE.value)
        return Response(status_code=204)
    
    async def add_dislike(self, user_from_id: UUID, user_to_id: UUID):
        field = f"{user_from_id}:{user_to_id}"
        await self.redis_client.sadd(LikeCacheKeys.DISLIKE_BUFFER, field)
        await self._add_to_seen(user_from_id, user_to_id)
    
    async def flush_dislikes_to_db(self) -> dict[str, int]:
        all_dislikes = await self.redis_client.smembers(LikeCacheKeys.DISLIKE_BUFFER_PROCESSING)
        if not all_dislikes:
            swapped = await self.redis_client.rename_key(
                LikeCacheKeys.DISLIKE_BUFFER,
                LikeCacheKeys.DISLIKE_BUFFER_PROCESSING,
            )
            if not swapped:
                return {"flushed": 0}
            all_dislikes = await self.redis_client.smembers(LikeCacheKeys.DISLIKE_BUFFER_PROCESSING)
        
        if not all_dislikes:
            await self.redis_client.delete_by_key(LikeCacheKeys.DISLIKE_BUFFER_PROCESSING)
            return {"flushed": 0}
        
        values = []
        for field in all_dislikes:
            user_from, user_to = field.split(":")
            values.append({
                "user_from_id": user_from,
                "user_to_id": user_to
            })
        
        if not values:
            await self.redis_client.delete_by_key(LikeCacheKeys.DISLIKE_BUFFER_PROCESSING)
            return {"flushed": 0}
        
        await self.like_repository.batch_create_dislikes(values)
        await self.redis_client.delete_by_key(LikeCacheKeys.DISLIKE_BUFFER_PROCESSING)
        
        return {"flushed": len(values)}
    
    async def _add_to_seen(self, user_from_id: UUID, user_to_id: UUID):
        seen_key = UserCacheKeys.SEEN_USERS.format(user_id=user_from_id)
        await self.redis_client.sadd(seen_key, str(user_to_id), ttl=self.SEEN_TTL)

    async def like_and_match(self, user_from_id: UUID, user_to_id: UUID):
        await self._upsert_like(user_from_id, user_to_id, LikeTypeEnum.LIKE)
        await self._add_to_seen(user_from_id, user_to_id)
        await self.like_repository.create_match(user_from_id, user_to_id)

        liker = await self.user_repository.get_item(str(user_from_id))
        recipient = await self.user_repository.get_item(str(user_to_id))
        
        if liker:
            await self._notify_match_async(liker.id, user_from_id, user_to_id)
        if recipient:
            await self._notify_match_async(recipient.id, user_from_id, user_to_id)

    async def _notify_like_async(self, recipient_id: UUID, liker_name: str, like_type: str) -> None:
        from app.core.tasks.notifications_task import send_like_notification

        try:
            await send_like_notification.kiq(str(recipient_id), liker_name, like_type)
        except Exception:
            recipient = await self.user_repository.get_item(str(recipient_id))
            if not recipient:
                return
            if like_type == LikeTypeEnum.SUPERLIKE.value:
                await self.notification_service.notify_user_superliked(recipient, liker_name)
                return
            await self.notification_service.notify_user_liked(recipient, liker_name)

    async def _notify_match_async(self, recipient_id: UUID, user_from_id: UUID, user_to_id: UUID) -> None:
        from app.core.tasks.notifications_task import send_match_notification

        try:
            await send_match_notification.kiq(str(recipient_id), str(user_from_id), str(user_to_id))
        except Exception:
            recipient = await self.user_repository.get_item(str(recipient_id))
            if recipient:
                await self.notification_service.notify_new_match(recipient)