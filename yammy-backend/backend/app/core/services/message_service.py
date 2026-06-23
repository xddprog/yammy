import base64
import io
import uuid
from uuid import UUID

from fastapi import UploadFile
from app.core.repositories.chat_repository import ChatRepository
from app.core.repositories.message_repository import MessageRepository
from app.core.repositories.user_repository import UserRepository
from app.core.dto.message import MessageCreateRequest, MessageEditRequest, MessagePhotoUploadSchema, MessageSchema
from app.core.services.image_service import ImageService
from app.core.services.notification_service import NotificationService
from app.core.services.presence_service import PresenceService
from app.infrastructure.errors.base import BadRequestException
from app.infrastructure.errors.base import NotFoundException


MAX_IMAGES_COUNT = 5

class MessageService:
    def __init__(
        self,
        message_repository: MessageRepository,
        chat_repository: ChatRepository,
        user_repository: UserRepository,
        image_service: ImageService,
        notification_service: NotificationService,
        presence_service: PresenceService,
    ):
        self.message_repository = message_repository
        self.chat_repository = chat_repository
        self.user_repository = user_repository
        self.image_service = image_service
        self.notification_service = notification_service
        self.presence_service = presence_service

    async def _ensure_can_interact_with_chat_messages(
        self,
        chat_id: UUID,
        user_id: UUID,
    ) -> None:
        is_peer_banned = await self.chat_repository.get_peer_ban_status_by_chat_id(
            chat_id,
            user_id,
        )
        if is_peer_banned is None:
            raise NotFoundException("Чат не найден")
        if is_peer_banned:
            raise BadRequestException(
                "Нельзя отправлять, изменять, удалять или отвечать на сообщения "
                "в чате с забаненным пользователем"
            )

    async def upload_images_from_base64(self, images: list[MessagePhotoUploadSchema]) -> list[str]:
        files: list[UploadFile] = []

        for image in images:
            image_data = base64.b64decode(image.file.split(",")[1])
            content_type = image.content_type.split(";")[0].strip().lower()
            ext = {
                "image/jpeg": ".jpg",
                "image/jpg": ".jpg",
                "image/png": ".png",
                "image/webp": ".webp",
                "image/gif": ".gif",
                "image/bmp": ".bmp",
            }.get(content_type, ".jpg")

            temp_file = io.BytesIO(image_data)
            files.append(
                UploadFile(
                    file=temp_file,
                    filename=f"{uuid.uuid4()}{ext}",
                    headers={"content-type": content_type},
                )
            )
        return await self.image_service.upload_multiple(files, "messages")
    
    async def create_message(self, form: MessageCreateRequest) -> MessageSchema:
        if len(form.images) > MAX_IMAGES_COUNT:
            raise BadRequestException("Вы не можете отправить больше 5 изображений за один раз")

        await self._ensure_can_interact_with_chat_messages(form.chat_id, form.sender_id)

        form.images = await self.upload_images_from_base64(form.images)
        message = await self.message_repository.add_item(**form.model_dump())
        message_schema = MessageSchema.model_validate(message, from_attributes=True)

        recipient_id = await self.chat_repository.get_peer_user_id_by_chat_id(
            form.chat_id,
            form.sender_id,
        )
        if recipient_id and not await self.presence_service.is_user_online(recipient_id):
            sender = await self.user_repository.get_item(str(form.sender_id))
            if sender:
                await self._notify_chat_message_async(
                    recipient_id,
                    sender.name,
                    message.id,
                )

        return message_schema

    async def delete_message(self, message_id: uuid.UUID, user_id: uuid.UUID):
        message = await self.message_repository.get_message_short_info(message_id)
        if not message or message.sender_id != user_id or message.is_deleted:
            raise NotFoundException("Сообщение не найдено")

        await self._ensure_can_interact_with_chat_messages(message.chat_id, user_id)

        message, image_paths = await self.message_repository.delete_item(message_id, user_id)
        if not message:
            raise NotFoundException("Сообщение не найдено")

        if image_paths:
            await self.image_service.delete_multiple(image_paths)

        return MessageSchema.model_validate(message, from_attributes=True)

    async def edit_message(self, message_id: uuid.UUID, user_id: uuid.UUID, form: MessageEditRequest):
        message = await self.message_repository.get_item(message_id)
        if not message or message.sender_id != user_id or message.is_deleted:
            raise NotFoundException("Сообщение не найдено")

        await self._ensure_can_interact_with_chat_messages(message.chat_id, user_id)

        update_values = form.model_dump(exclude_none=True)
        if "content" in update_values:
            update_values["previous_version"] = message.content

        message = await self.message_repository.update_item(
            message_id, is_edited=True, **update_values
        )
        
        return MessageSchema.model_validate(message, from_attributes=True)

    async def read_message(self, message_id: uuid.UUID, user_id: uuid.UUID):
        message = await self.message_repository.get_item(message_id)
        if not message:
            raise NotFoundException("Сообщение не найдено")
        
        if not message.is_read and message.sender_id != user_id:
            message = await self.message_repository.update_item(message_id, is_read=True)

        return MessageSchema.model_validate(message, from_attributes=True)

    async def _notify_chat_message_async(
        self,
        recipient_id: UUID,
        sender_name: str,
        message_id: UUID,
    ) -> None:
        from app.core.tasks.notifications_task import send_chat_message_notification

        try:
            await send_chat_message_notification.kiq(
                str(recipient_id),
                sender_name,
                str(message_id),
            )
        except Exception:
            recipient = await self.user_repository.get_item(str(recipient_id))
            if not recipient:
                return
            await self.notification_service.notify_new_chat_message(recipient, sender_name)
