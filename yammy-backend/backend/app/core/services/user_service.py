from uuid import UUID

from fastapi import UploadFile
from app.core.repositories import UserRepository
from app.core.dto.user import ImageOrderUpdateSchema, UserPhoto, UserProfileSchema, UserUpdateRequest
from app.core.services.image_service import ImageService
from app.core.services.moderation_service import ModerationService
from app.infrastructure.errors.base import BadRequestException, NotFoundException
from app.utils.helpers.url_helper import get_absolute_url


class UserService:
    def __init__(
        self,
        user_repository: UserRepository,
        image_service: ImageService,
        moderation_service: ModerationService,
    ):
        self.user_repository = user_repository
        self.image_service = image_service
        self.moderation_service = moderation_service

    async def get_user_profile(self, user_id: UUID) -> UserProfileSchema:
        row = await self.user_repository.get_user_profile(user_id)
        if row is None:
            raise NotFoundException("Пользователь не найден")

        user, referrals_count = row
        
        return UserProfileSchema.model_validate(
            user, from_attributes=True
        ).model_copy(update={"referrals_count": referrals_count})

    async def update_user(self, user_id: UUID, form: UserUpdateRequest) -> None:
        if "bio" in form.model_fields_set:
            await self.moderation_service.moderate_text(form.bio)

        if form.filters:
            await self.user_repository.update_filters(user_id, form.filters)
        
        await self.user_repository.update_item(
            user_id,
            **form.model_dump(exclude_unset=True, exclude={"filters"}),
        )

    async def delete_user_image(self, user_id: UUID, image_id: UUID) -> None:
        try:
            image_path = await self.user_repository.delete_image(user_id, image_id)
        except ValueError:
            raise BadRequestException("Нельзя удалить главное фото")
        if not image_path:
            raise NotFoundException("Фото пользователя не найдено")
        await self.image_service.delete_image(image_path)

    async def add_user_image(self, user_id: UUID, image: UploadFile) -> UserPhoto:
        image_path = await self.image_service.upload_and_convert(image, f"users/{user_id}")
        
        try:
            row = await self.user_repository.add_image(user_id, image_path)
        except ValueError:
            raise BadRequestException("Вы превысили максимальное количество фотографий")
        
        return UserPhoto.model_validate(
            row, from_attributes=True
        ).model_copy(update={"file_path": get_absolute_url(row.file_path)})

    async def set_main_image(self, user_id: UUID, image: UploadFile | None, existing_image_id: UUID | None) -> UserPhoto:
        if image:
            await self.moderation_service.moderate_image(image, is_main=True)
            image_path = await self.image_service.upload_and_convert(image, f"users/{user_id}")
            
            row = await self.user_repository.set_main_image(user_id, image_path)
            return UserPhoto.model_validate(row, from_attributes=True)
        else:
            try:
                user_photos = await self.user_repository.swap_main_with_existing_gallery_photo(user_id, existing_image_id)
                return [
                    UserPhoto.model_validate(photo, from_attributes=True)
                    for photo in user_photos
                ]
            except ValueError:
                raise NotFoundException("Изображение не найдено")
        
    async def update_image_order(
        self, user_id: UUID, body: ImageOrderUpdateSchema
    ) -> list[UserPhoto]:
        try:
            images = await self.user_repository.update_image_order(user_id, body)
        except ValueError:
            raise NotFoundException("Изображения не найдено")
        return [
                UserPhoto.model_validate(image, from_attributes=True)
                for image in images
            ]
