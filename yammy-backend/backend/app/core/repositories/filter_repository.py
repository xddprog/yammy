from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import contains_eager

from app.core.repositories.base import SqlAlchemyRepository
from app.infrastructure.database.models.filter import (
    FilterCategory,
    FilterOption,
    FilterSubcategory,
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
