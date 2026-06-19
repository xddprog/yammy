from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import delete, insert, select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload

from app.core.repositories.base import SqlAlchemyRepository
from app.core.dto.user import ImageOrderUpdateSchema
from app.infrastructure.database.models.user import User, UserPhoto
from app.infrastructure.database.models.filter import FilterOption, FilterSubcategory, UserFilterAssociation


class UserRepository(SqlAlchemyRepository[User]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, User)

    async def _touch_user_updated_at(self, user_id: UUID) -> None:
        await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(updated_at=func.now())
        )

    async def add_item(
        self,
        *,
        filters_ids: list[UUID] | None = None,
        photos: list[tuple[str, int, bool]] | None = None,
        **kwargs: Any,
    ) -> User:
        user = User(**kwargs)
        self.session.add(user)
        await self.session.flush()

        if filters_ids:
            await self.session.execute(
                insert(UserFilterAssociation).values(
                    [
                        {"user_id": user.id, "option_id": option_id}
                        for option_id in filters_ids
                    ]
                )
            )

        for file_path, order, is_main in photos:
            self.session.add(
                UserPhoto(
                    user_id=user.id,
                    file_path=file_path,
                    order=order,
                    is_main=is_main,
                )
            )

        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def get_by_telegram_id(self, telegram_id: int) -> User | None:
        return await self.get_by_filter(one_or_none=True, telegram_id=telegram_id)

    async def update_last_seen(self, user_id: UUID, last_seen: datetime) -> None:
        await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(last_seen=last_seen)
        )
        await self.session.commit()

    async def decrement_superlikes_balance(self, user_id: UUID) -> int | None:
        result = await self.session.execute(
            update(User)
            .where(
                User.id == user_id,
                User.superlikes_balance > 0,
            )
            .values(superlikes_balance=User.superlikes_balance - 1)
            .returning(User.superlikes_balance)
        )
        balance = result.scalar_one_or_none()
        await self.session.commit()
        return balance

    async def activate_boost(self, user_id: UUID, duration_hours: int = 2) -> tuple[int, datetime] | None:
        now = datetime.now(timezone.utc)
        boost_until = now + timedelta(hours=duration_hours)
        result = await self.session.execute(
            update(User)
            .where(
                User.id == user_id,
                User.boosts_balance > 0,
                (User.boost_expires_at.is_(None) | (User.boost_expires_at <= now)),
            )
            .values(
                boosts_balance=User.boosts_balance - 1,
                boost_expires_at=boost_until,
                updated_at=func.now(),
            )
            .returning(User.boosts_balance, User.boost_expires_at)
        )
        row = result.one_or_none()
        await self.session.commit()
        if row is None:
            return None
        balance, expires_at = row
        return int(balance), expires_at

    async def set_ban_status(self, user_id: UUID, is_banned: bool) -> bool:
        result = await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(is_banned=is_banned, updated_at=func.now())
            .returning(User.id)
        )
        updated = result.scalar_one_or_none()
        await self.session.commit()
        return updated is not None

    async def touch_updated_at(self, user_id: UUID) -> None:
        await self._touch_user_updated_at(user_id)
        await self.session.commit()
    
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

    async def get_user_for_index(self, user_id: UUID) -> User | None:
        stmt = (
            select(User)
            .where(User.id == user_id)
            .options(
                selectinload(User.photos),
                selectinload(User.filters)
                .selectinload(FilterOption.subcategory)
                .selectinload(FilterSubcategory.category),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_users_updated_since(self, since: datetime, limit: int = 500) -> list[User]:
        stmt = (
            select(User)
            .where(User.updated_at >= since)
            .order_by(User.updated_at.asc())
            .limit(limit)
            .options(
                selectinload(User.photos),
                selectinload(User.filters)
                .selectinload(FilterOption.subcategory)
                .selectinload(FilterSubcategory.category),
            )
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_user_profile(self, user_id: UUID) -> tuple[User, int] | None:
        referred = aliased(User, name="referred_users")
        stmt = (
            select(User, func.count(referred.id))
            .outerjoin(referred, referred.referred_by_id == User.id)
            .where(User.id == user_id)
            .options(
                selectinload(User.filters),
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

    async def increment_profile_views_count(self, viewed_user_id: UUID) -> bool:
        result = await self.session.execute(
            update(User)
            .where(
                User.id == viewed_user_id,
                User.is_banned == False,
            )
            .values(profile_views_count=User.profile_views_count + 1)
            .returning(User.id)
        )
        updated = result.scalar_one_or_none()
        await self.session.commit()
        return updated is not None

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

    async def get_users_for_search_feed_by_ids(self, user_ids: list[UUID]) -> list[User]:
        if not user_ids:
            return []
        result = await self.session.execute(
            select(User)
            .where(User.id.in_(user_ids), User.is_banned == False)
            .options(
                selectinload(User.photos),
                selectinload(User.filters)
                .selectinload(FilterOption.subcategory)
                .selectinload(FilterSubcategory.category),
            )
        )
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
        await self._touch_user_updated_at(user_id)

    async def delete_image(self, user_id: UUID, image_id: UUID) -> str | None:
        result = await self.session.execute(
            select(UserPhoto).where(
                UserPhoto.id == image_id,
                UserPhoto.user_id == user_id,
            )
        )
        photo = result.scalar_one_or_none()
        if photo is None:
            return None
        if photo.is_main:
            raise ValueError("cannot_delete_main")
        image_path = photo.file_path
        await self.session.delete(photo)
        await self.session.flush()

        remaining_q = (
            select(UserPhoto)
            .where(UserPhoto.user_id == user_id)
            .order_by(UserPhoto.order)
        )
        remaining = list((await self.session.execute(remaining_q)).scalars().all())
        for i, p in enumerate(remaining):
            p.order = i

        await self._touch_user_updated_at(user_id)
        await self.session.commit()
        return image_path

    async def add_image(self, user_id: UUID, image_path: str) -> UserPhoto:
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
            is_main=False,
        )

        self.session.add(new_photo)
        await self._touch_user_updated_at(user_id)
        await self.session.commit()
        await self.session.refresh(new_photo)
        return new_photo

    async def set_main_image(
        self, user_id: UUID, image_path: str
    ) -> tuple[UserPhoto, str]:
        prev_main_photo_result = await self.session.execute(
            select(UserPhoto)
            .where(
                UserPhoto.user_id == user_id,
                UserPhoto.is_main == True,
            )
        )
        prev_main_photo = prev_main_photo_result.scalar_one_or_none()
        if prev_main_photo is None:
            raise ValueError("no_main_photo")

        previous_path = prev_main_photo.file_path
        prev_main_photo.file_path = image_path

        await self._touch_user_updated_at(user_id)
        await self.session.commit()
        await self.session.refresh(prev_main_photo)
        return prev_main_photo, previous_path

    async def swap_main_with_existing_gallery_photo(
        self,
        user_id: UUID,
        gallery_photo_id: UUID,
    ) -> list[UserPhoto]:
        old_main_row = await self.session.execute(
            select(UserPhoto).where(
                UserPhoto.user_id == user_id,
                UserPhoto.is_main == True
            )
        )
        old_main = old_main_row.scalar_one()
        if old_main is None:
            raise ValueError("no_main_photo")

        result = await self.session.execute(
            select(UserPhoto)
            .where(UserPhoto.user_id == user_id)
            .order_by(UserPhoto.order)
        )
        images = list(result.scalars().all())

        target = next((p for p in images if p.id == gallery_photo_id), None)

        if target is None:
            raise ValueError("photo_not_found")
        if target.is_main or target.id == old_main.id:
            return images

        target_order_before = target.order
        old_main_order_before = old_main.order

        target.is_main = True
        target.order = old_main_order_before

        old_main.is_main = False
        old_main.order = target_order_before

        await self._touch_user_updated_at(user_id)
        await self.session.commit()

        refreshed = await self.session.execute(
            select(UserPhoto)
            .where(UserPhoto.user_id == user_id)
            .order_by(UserPhoto.order)
        )
        return list(refreshed.scalars().all())

    async def update_image_order(self, user_id: UUID, body: ImageOrderUpdateSchema) -> list[UserPhoto]:
        query = (
            select(UserPhoto)
            .where(UserPhoto.user_id == user_id)
            .order_by(UserPhoto.order)
        )
        images = (await self.session.execute(query)).scalars().all()
        by_id = {image.id: image for image in images}

        for photo in body.photos:
            image = by_id.get(photo.id)
            if image is None:
                raise ValueError("photo_not_found")
            image.order = photo.order

        await self._touch_user_updated_at(user_id)
        await self.session.commit()

        refreshed = await self.session.execute(query)
        return refreshed.scalars().all()
