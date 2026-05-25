import base64
import io
import uuid
from uuid import UUID

from fastapi import UploadFile
from app.core.repositories.message_repository import MessageRepository
from app.core.dto.message import MessageCreateRequest, MessageEditRequest, MessagePhotoUploadSchema, MessageSchema
from app.core.services.image_service import ImageService
from app.infrastructure.errors.base import BadRequestException
from app.infrastructure.errors.base import NotFoundException


MAX_IMAGES_COUNT = 5

class MessageService:
    def __init__(self, message_repository: MessageRepository, image_service: ImageService):
        self.message_repository = message_repository
        self.image_service = image_service

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

        form.images = await self.upload_images_from_base64(form.images)
        message = await self.message_repository.add_item(**form.model_dump())
        return MessageSchema.model_validate(message, from_attributes=True)

    async def delete_message(self, message_id: uuid.UUID, user_id: uuid.UUID):
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