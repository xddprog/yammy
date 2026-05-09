from uuid import UUID

from fastapi import UploadFile
from fastapi.responses import JSONResponse
from app.core.repositories import UserRepository
from app.core.dto.user import UserPhoto, UserProfileSchema, UserUpdateRequest
from app.core.services.image_service import ImageService
from app.infrastructure.errors.base import BadRequestException, NotFoundException


class UserService:
    def __init__(self, user_repository: UserRepository, image_service: ImageService):
        self.user_repository = user_repository
        self.image_service = image_service

    async def get_user_profile(self, user_id: UUID) -> UserProfileSchema:
        row = await self.user_repository.get_user_profile(user_id)
        if row is None:
            raise NotFoundException("Пользователь не найден")

        user, referrals_count = row
        
        return UserProfileSchema.model_validate(
            user, from_attributes=True
        ).model_copy(update={"referrals_count": referrals_count})

    async def update_user(self, user_id: UUID, form: UserUpdateRequest) -> None:
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

    async def add_user_image(self, user_id: UUID, image: UploadFile) -> None:
        image_path = await self.image_service.upload_and_convert(image, f"users/{user_id}")
        try:
            await self.user_repository.add_image(user_id, image_path)
        except ValueError:
            raise BadRequestException("Вы превысили максимальное количество фотографий")

    async def set_main_image(self, user_id: UUID, image: UploadFile) -> None:
        image_path = await self.image_service.upload_and_convert(image, f"users/{user_id}")
        await self.user_repository.set_main_image(user_id, image_path)

    async def update_image_order(
        self, user_id: UUID, image_id: UUID, order: int
    ) -> list:
        try:
            images = await self.user_repository.update_image_order(
                user_id, image_id, order
            )
        except ValueError:
            raise BadRequestException("Главное фото не может быть перемещено")
        if not images:
            raise NotFoundException(
                f"Изображение с ID {image_id} не найдено"
            )
        return [
            UserPhoto.model_validate(image, from_attributes=True)
            for image in images
        ]