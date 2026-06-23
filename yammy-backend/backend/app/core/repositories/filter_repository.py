from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import contains_eager, selectinload

from app.core.repositories.base import SqlAlchemyRepository
from app.infrastructure.database.models.filter import (
    FilterCategory,
    FilterOption,
    FilterSubcategory,
    UserFilterAssociation,
)


class FilterRepository(SqlAlchemyRepository[FilterCategory]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, FilterCategory)

    async def get_all_with_relations(self) -> list[FilterCategory]:
        query = (
            select(FilterCategory)
            .outerjoin(FilterSubcategory, FilterCategory.id == FilterSubcategory.category_id)
            .outerjoin(FilterOption, FilterSubcategory.id == FilterOption.subcategory_id)
            .options(
                contains_eager(FilterCategory.subcategories).contains_eager(
                    FilterSubcategory.options
                )
            )
        )
        result = await self.session.execute(query)
        return list(result.unique().scalars().all())

    async def get_category_by_slug(self, slug: str) -> FilterCategory | None:
        result = await self.session.execute(
            select(FilterCategory).where(FilterCategory.slug == slug)
        )
        return result.scalar_one_or_none()

    async def get_subcategory(self, subcategory_id: UUID) -> FilterSubcategory | None:
        return await self.session.get(FilterSubcategory, subcategory_id)

    async def get_subcategory_by_slug(
        self,
        category_id: UUID,
        slug: str,
    ) -> FilterSubcategory | None:
        result = await self.session.execute(
            select(FilterSubcategory).where(
                FilterSubcategory.category_id == category_id,
                FilterSubcategory.slug == slug,
            )
        )
        return result.scalar_one_or_none()

    async def get_option(self, option_id: UUID) -> FilterOption | None:
        return await self.session.get(FilterOption, option_id)

    async def get_option_by_slug(
        self,
        subcategory_id: UUID,
        slug: str,
    ) -> FilterOption | None:
        result = await self.session.execute(
            select(FilterOption).where(
                FilterOption.subcategory_id == subcategory_id,
                FilterOption.slug == slug,
            )
        )
        return result.scalar_one_or_none()

    async def get_option_ids_for_category(self, category_id: UUID) -> list[UUID]:
        query = (
            select(FilterOption.id)
            .join(FilterSubcategory, FilterSubcategory.id == FilterOption.subcategory_id)
            .where(FilterSubcategory.category_id == category_id)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_option_ids_for_subcategory(self, subcategory_id: UUID) -> list[UUID]:
        result = await self.session.execute(
            select(FilterOption.id).where(FilterOption.subcategory_id == subcategory_id)
        )
        return list(result.scalars().all())

    async def _detach_users_from_options(self, option_ids: list[UUID]) -> list[UUID]:
        if not option_ids:
            return []

        user_ids_result = await self.session.execute(
            select(UserFilterAssociation.user_id)
            .where(UserFilterAssociation.option_id.in_(option_ids))
            .distinct()
        )
        user_ids = list(user_ids_result.scalars().all())
        await self.session.execute(
            delete(UserFilterAssociation).where(
                UserFilterAssociation.option_id.in_(option_ids)
            )
        )
        return user_ids

    async def create_category(self, slug: str, name: str) -> FilterCategory:
        category = FilterCategory(slug=slug, name=name)
        self.session.add(category)
        await self.session.commit()
        await self.session.refresh(category)
        return category

    async def create_subcategory(
        self,
        category_id: UUID,
        slug: str,
        name: str,
    ) -> FilterSubcategory:
        subcategory = FilterSubcategory(
            category_id=category_id,
            slug=slug,
            name=name,
        )
        self.session.add(subcategory)
        await self.session.commit()
        await self.session.refresh(subcategory)
        return subcategory

    async def create_option(
        self,
        subcategory_id: UUID,
        slug: str,
        name: str,
    ) -> FilterOption:
        option = FilterOption(
            subcategory_id=subcategory_id,
            slug=slug,
            name=name,
        )
        self.session.add(option)
        await self.session.commit()
        await self.session.refresh(option)
        return option

    async def delete_option_with_user_cleanup(self, option_id: UUID) -> list[UUID] | None:
        option = await self.get_option(option_id)
        if option is None:
            return None

        user_ids = await self._detach_users_from_options([option_id])
        await self.session.delete(option)
        await self.session.commit()
        return user_ids

    async def delete_subcategory_with_user_cleanup(
        self,
        subcategory_id: UUID,
    ) -> list[UUID] | None:
        subcategory = await self.session.get(
            FilterSubcategory,
            subcategory_id,
            options=[selectinload(FilterSubcategory.options)],
        )
        if subcategory is None:
            return None

        option_ids = [option.id for option in subcategory.options]
        user_ids = await self._detach_users_from_options(option_ids)
        await self.session.delete(subcategory)
        await self.session.commit()
        return user_ids

    async def delete_category_with_user_cleanup(self, category_id: UUID) -> list[UUID] | None:
        category = await self.session.get(FilterCategory, category_id)
        if category is None:
            return None

        option_ids = await self.get_option_ids_for_category(category_id)
        user_ids = await self._detach_users_from_options(option_ids)
        await self.session.delete(category)
        await self.session.commit()
        return user_ids
