import base64
import uuid
from tempfile import SpooledTemporaryFile

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

            with SpooledTemporaryFile() as temp_file:
                temp_file.write(image_data)
                temp_file.seek(0)

                upload_file = UploadFile(
                    file=temp_file,
                    filename=f"{uuid.uuid4()}",
                    headers={"content-type": image.content_type},
                )
                files.append(upload_file)
        return await self.image_service.upload_multiple(files, "messages")
    
    async def create_message(self, form: MessageCreateRequest):
        if len(form.images) > MAX_IMAGES_COUNT:
            raise BadRequestException("Вы не можете отправить больше 5 изображений за один раз")

        form.images = await self.upload_images_from_base64(form.images)
        message = await self.message_repository.add_item(**form.model_dump())
        return MessageSchema.model_validate(message, from_attributes=True)

    async def delete_message(self, message_id: uuid.UUID, user_id: uuid.UUID):
        message = await self.message_repository.delete_item(message_id, user_id)
        if not message:
            raise NotFoundException("Сообщение не найдено")
        
        schema = MessageSchema.model_validate(message, from_attributes=True)
        schema.message = "Сообщение было удалено"
        return schema

    async def edit_message(self, message_id: uuid.UUID, user_id: uuid.UUID, form: MessageEditRequest):
        message = await self.message_repository.get_item(message_id)
        if not message or message.sender_id != user_id or message.is_deleted:
            raise NotFoundException("Сообщение не найдено")

        message = await self.message_repository.update_item(
            message_id, is_edited=True, **form.model_dump(exclude_none=True)
        )
        
        return MessageSchema.model_validate(message, from_attributes=True)

    async def read_message(self, message_id: uuid.UUID, user_id: uuid.UUID):
        message = await self.message_repository.get_item(message_id)
        if not message:
            raise NotFoundException("Сообщение не найдено")
        
        if not message.is_read and message.sender_id != user_id:
            message = await self.message_repository.update_item(message_id, is_read=True)

        return MessageSchema.model_validate(message, from_attributes=True)