
from uuid import UUID

from sqlalchemy import delete, insert, select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload

from app.core.repositories.base import SqlAlchemyRepository
from app.infrastructure.database.models.user import User, UserPhoto
from app.infrastructure.database.models.filter import FilterOption, FilterSubcategory, UserFilterAssociation


class UserRepository(SqlAlchemyRepository[User]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, User)

    async def get_by_telegram_id(self, telegram_id: int) -> User | None:
        return await self.get_by_filter(one_or_none=True, telegram_id=telegram_id)
    
    async def get_user_with_filters(self, user_id: UUID) -> User | None:
        stmt = (
            select(User)
            .where(User.id == user_id)
            .options(
                selectinload(User.filters)
                .selectinload(FilterOption.subcategory)
                .selectinload(FilterSubcategory.category)
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_profile(self, user_id: UUID) -> tuple[User, int] | None:
        referred = aliased(User, name="referred_users")
        stmt = (
            select(User, func.count(referred.id))
            .outerjoin(referred, referred.referred_by_id == User.id)
            .where(User.id == user_id)
            .options(
                selectinload(User.filters).options(
                    selectinload(FilterOption.subcategory)
                    .selectinload(FilterSubcategory.category)
                ),
                selectinload(User.photos),
            )
            .group_by(User)
        )
        result = await self.session.execute(stmt)
        row = result.one_or_none()

        if row is None:
            return None

        user, referrals_count = row
        
        return user, int(referrals_count)

    async def get_random_users_with_photos(self, exclude_user_ids: list[UUID], limit: int = 20) -> list[User]:
        query = (
            select(User)
            .where(
                User.id.notin_(exclude_user_ids),
                User.is_banned == False
            )
            .options(selectinload(User.photos))
            .order_by(func.random())
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def update_filters(self, user_id: UUID, filters_ids: list[UUID]) -> None:
        delete_filters_query = delete(UserFilterAssociation).where(UserFilterAssociation.user_id == user_id)
        insert_query = insert(UserFilterAssociation).values(
            [
                {
                    "user_id": user_id,
                    "option_id": option_id
                }
                for option_id in filters_ids
            ]
        )

        await self.session.execute(delete_filters_query)
        await self.session.execute(insert_query)

    async def delete_image(self, user_id: UUID, image_id: UUID) -> str | None:
        query = (
            delete(UserPhoto)
            .where(
                UserPhoto.id == image_id, 
                UserPhoto.user_id == user_id
            )
            .returning(UserPhoto.file_path)
        )
        image_path = (await self.session.execute(query)).scalar_one_or_none()
        return image_path

    async def add_image(self, user_id: UUID, image_path: str):
        max_order_query = (
            select(UserPhoto.order)
            .where(UserPhoto.user_id == user_id)
            .order_by(UserPhoto.order.desc())
            .limit(1)
        )
        max_order_row = (await self.session.execute(max_order_query)).scalar_one_or_none()

        if max_order_row >= 5:
            raise ValueError("max_photos_count")
            
        new_photo = UserPhoto(
            user_id=user_id,
            file_path=image_path,
            order=max_order_row + 1 if max_order_row else 0,
        )
        
        await self.session.add(new_photo)
        await self.session.commit()

    async def set_main_image(
        self, user_id: UUID, image_path: str
    ) -> None:
        prev_main_photo = await self.session.execute(
            select(UserPhoto)
            .where(UserPhoto.user_id == user_id, UserPhoto.is_main == True)
        )
        prev_main_photo = prev_main_photo.scalar_one_or_none()
    
        prev_main_photo.file_path = image_path
        
        await self.session.commit()

    async def update_image_order(
        self, user_id: UUID, image_id: UUID, new_order: int
    ) -> list[UserPhoto] | None:
        result = await self.session.execute(
            select(UserPhoto)
            .where(UserPhoto.user_id == user_id)
            .order_by(UserPhoto.order)
        )
        images = list(result.scalars().all())

        updated_image = next((img for img in images if img.id == image_id), None)
        if not updated_image:
            return []
        
        if updated_image.is_main:
            raise ValueError("main_photo")
        
        new_order = max(0, min(new_order, len(images) - 1))
        if new_order == 0:
            raise ValueError("main_photo")

        if updated_image.order == new_order:
            return list(images)

        images_without_current = [img for img in images if img.id != image_id]
        images_without_current.insert(new_order, updated_image)
        
        for index, image in enumerate(images_without_current):
            image.order = index
        
        await self.session.commit()
        
        for image in images_without_current:
            await self.session.refresh(image)
        
        return images_without_current
