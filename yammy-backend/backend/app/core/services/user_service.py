import uuid
from datetime import datetime, timezone
from uuid import UUID

from fastapi import UploadFile
from app.core.repositories import UserRepository
from app.core.dto.auth import OnboardingFinishRequest
from app.core.dto.user import ImageOrderUpdateSchema, UserPhoto, UserProfileSchema, UserUpdateRequest
from app.core.services.image_service import ImageService
from app.core.services.moderation_service import ModerationService
from app.core.services.user_index_service import UserIndexService
from app.infrastructure.database.models.user import User
from app.infrastructure.errors.base import BadRequestException, ConflictException, NotFoundException
class UserService:
    BOOST_DURATION_HOURS = 12

    def __init__(
        self,
        user_repository: UserRepository,
        image_service: ImageService,
        moderation_service: ModerationService,
        user_index_service: UserIndexService,
    ):
        self.user_repository = user_repository
        self.image_service = image_service
        self.moderation_service = moderation_service
        self.user_index_service = user_index_service

    async def _enqueue_reindex_user(self, user_id: UUID, include_personality_vector: bool = False) -> None:
        from app.core.tasks.user_index_tasks import reindex_user_in_es

        try:
            await reindex_user_in_es.kiq(str(user_id), include_personality_vector)
        except Exception:
            await self.user_index_service.upsert_user(
                user_id,
                include_personality_vector=include_personality_vector,
            )

    async def _invalidate_profile_moderation_after_photo_change(self, user_id: UUID) -> None:
        await self.user_repository.update_item(str(user_id), profile_moderation_approved=False)

    async def get_user_profile(self, user_id: UUID) -> UserProfileSchema:
        row = await self.user_repository.get_user_profile(user_id)
        if row is None:
            raise NotFoundException("Пользователь не найден")

        user, referrals_count = row
        
        return UserProfileSchema.model_validate(user, from_attributes=True).model_copy(
            update={"referrals_count": referrals_count}
        )

    async def complete_onboarding(
        self,
        telegram_id: int,
        form: OnboardingFinishRequest,
        images: list[UploadFile],
    ) -> User:
        if form.bio:
            await self.moderation_service.moderate_text(form.bio)

        if await self.user_repository.get_by_telegram_id(telegram_id):
            raise ConflictException("Пользователь уже зарегистрирован")

        photos = sorted(form.photos, key=lambda photo: photo.order)
        user_id = uuid.uuid4()

        persisted_photos: list[tuple[str, int, bool]] = []
        for i, photo in enumerate(photos):
            image = images[i]
            await self.moderation_service.moderate_image(image, is_main=photo.is_main)
            file_path = await self.image_service.upload_and_convert(image, f"users/{user_id}")
            persisted_photos.append((file_path, photo.order, photo.is_main))

        user_fields = form.model_dump(exclude={"filters", "photos"}, exclude_none=True)
        user = await self.user_repository.add_item(
            id=user_id,
            telegram_id=telegram_id,
            filters_ids=form.filters,
            photos=persisted_photos,
            referral_code=f"REF{uuid.uuid4().hex[:12].upper()}",
            **user_fields,
        )
        await self.user_index_service.upsert_user(
            user.id,
            include_personality_vector=True,
        )
        return user

    async def update_user(self, user_id: UUID, form: UserUpdateRequest) -> None:
        bio_changed = "bio" in form.model_fields_set
        if bio_changed:
            await self.moderation_service.moderate_text(form.bio)

        filters_changed = "filters" in form.model_fields_set
        if "filters" in form.model_fields_set:
            if not form.filters:
                raise BadRequestException("Выберите хотя бы одну характеристику о себе")
            await self.user_repository.update_filters(user_id, form.filters)

        update_payload = form.model_dump(exclude_unset=True, exclude={"filters"})
        if update_payload:
            await self.user_repository.update_item(
                user_id,
                **update_payload,
            )
        elif filters_changed:
            await self.user_repository.touch_updated_at(user_id)

        await self._enqueue_reindex_user(
            user_id,
            include_personality_vector=bio_changed,
        )

    async def delete_user_image(self, user_id: UUID, image_id: UUID) -> None:
        try:
            image_path = await self.user_repository.delete_image(user_id, image_id)
        except ValueError:
            raise BadRequestException("Нельзя удалить главное фото")
        if not image_path:
            raise NotFoundException("Фото пользователя не найдено")
        await self.image_service.delete_image(image_path)
        await self._invalidate_profile_moderation_after_photo_change(user_id)
        await self._enqueue_reindex_user(user_id, include_personality_vector=False)

    async def add_user_image(self, user_id: UUID, image: UploadFile) -> UserPhoto:
        image_path = await self.image_service.upload_and_convert(image, f"users/{user_id}")
        
        try:
            row = await self.user_repository.add_image(user_id, image_path)
        except ValueError:
            raise BadRequestException("Вы превысили максимальное количество фотографий")

        photo = UserPhoto.model_validate(row, from_attributes=True)
        await self._invalidate_profile_moderation_after_photo_change(user_id)
        await self._enqueue_reindex_user(user_id, include_personality_vector=False)
        return photo

    async def set_main_image(self, user_id: UUID, image: UploadFile | None, existing_image_id: UUID | None) -> UserPhoto | list[UserPhoto]:
        if image:
            await self.moderation_service.moderate_image(image, is_main=True)
            image_path = await self.image_service.upload_and_convert(image, f"users/{user_id}")

            row, previous_path = await self.user_repository.set_main_image(user_id, image_path)
            photo = UserPhoto.model_validate(row, from_attributes=True)
            if previous_path and previous_path != image_path:
                await self.image_service.delete_image(previous_path)

            await self._invalidate_profile_moderation_after_photo_change(user_id)
            await self._enqueue_reindex_user(user_id, include_personality_vector=False)
            return photo
        else:
            try:
                user_photos = await self.user_repository.swap_main_with_existing_gallery_photo(
                    user_id, existing_image_id
                )
                photos = [UserPhoto.model_validate(photo, from_attributes=True) for photo in user_photos]
                await self._enqueue_reindex_user(user_id, include_personality_vector=False)
                return photos
            except ValueError:
                raise NotFoundException("Изображение не найдено")

    async def update_image_order(
        self, user_id: UUID, body: ImageOrderUpdateSchema
    ) -> list[UserPhoto]:
        try:
            images = await self.user_repository.update_image_order(user_id, body)
        except ValueError:
            raise NotFoundException("Изображения не найдено")
        photos = [UserPhoto.model_validate(image, from_attributes=True) for image in images]
        await self._enqueue_reindex_user(user_id, include_personality_vector=False)
        return photos

    async def set_ban_status(self, user_id: UUID, is_banned: bool) -> None:
        updated = await self.user_repository.set_ban_status(user_id, is_banned)
        if not updated:
            raise NotFoundException("Пользователь не найден")
        await self.user_index_service.update_ban_status(user_id, is_banned=is_banned)

    async def activate_boost(self, user_id: UUID) -> None:
        user = await self.user_repository.get_item(str(user_id))
        if not user:
            raise NotFoundException("Пользователь не найден")

        now = datetime.now(timezone.utc)
        if user.boost_expires_at and user.boost_expires_at > now:
            raise ConflictException("Буст уже активен")

        activated = await self.user_repository.activate_boost(
            user_id,
            duration_hours=self.BOOST_DURATION_HOURS,
        )
        if activated is None:
            raise ConflictException("Бусты закончились")

        await self.user_index_service.upsert_user(
            user_id,
            include_personality_vector=False,
        )
