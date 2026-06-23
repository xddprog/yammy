import json
import re
from uuid import UUID

from app.core.clients.redis_client import RedisClient
from app.core.dto.filter import (
    FilterCategorySchema,
    FilterDeleteResultSchema,
    FilterOptionSchema,
    FilterSlugNameRequest,
    FilterSubcategorySchema,
)
from app.core.repositories.filter_repository import FilterRepository
from app.core.services.user_index_service import UserIndexService
from app.infrastructure.errors.base import BadRequestException, ConflictException, NotFoundException
from app.utils.constants.cache_keys import CacheTTL, FilterCacheKeys


_SLUG_RE = re.compile(r"^[a-z0-9_]+$")


class FilterService:
    def __init__(
        self,
        filter_repository: FilterRepository,
        redis_client: RedisClient,
        user_index_service: UserIndexService | None = None,
    ):
        self.filter_repository = filter_repository
        self.redis = redis_client
        self.user_index_service = user_index_service

    @staticmethod
    def _normalize_slug(slug: str) -> str:
        normalized = slug.strip().lower().replace("-", "_")
        normalized = re.sub(r"[^a-z0-9_]+", "_", normalized)
        normalized = re.sub(r"_+", "_", normalized).strip("_")
        if not normalized or not _SLUG_RE.fullmatch(normalized):
            raise BadRequestException("Slug может содержать только латиницу, цифры и _")
        return normalized

    async def _invalidate_catalog_cache(self) -> None:
        await self.redis.delete_by_key(FilterCacheKeys.ALL)

    async def get_all_filters(self) -> list[FilterCategorySchema]:
        cached = await self.redis.get(FilterCacheKeys.ALL)
        if cached:
            return [FilterCategorySchema.model_validate(item) for item in cached]

        filters = await self.filter_repository.get_all_with_relations()
        schemas = [FilterCategorySchema.model_validate(f, from_attributes=True) for f in filters]

        serialized = json.dumps([s.model_dump(mode="json") for s in schemas])
        await self.redis.set(FilterCacheKeys.ALL, serialized, ttl=CacheTTL.MINUTE * 60)
        return schemas

    async def _reindex_users(self, user_ids: list[UUID]) -> int:
        if self.user_index_service is None:
            raise BadRequestException("Сервис индексации недоступен")
        reindexed = 0
        for user_id in user_ids:
            if await self.user_index_service.upsert_user(user_id):
                reindexed += 1
        return reindexed

    async def _delete_with_user_sync(self, user_ids: list[UUID]) -> FilterDeleteResultSchema:
        reindexed_users = await self._reindex_users(user_ids)
        await self._invalidate_catalog_cache()
        return FilterDeleteResultSchema(
            affected_users=len(user_ids),
            reindexed_users=reindexed_users,
        )

    async def create_category(self, request: FilterSlugNameRequest) -> FilterCategorySchema:
        slug = self._normalize_slug(request.slug)
        if await self.filter_repository.get_category_by_slug(slug):
            raise ConflictException("Категория с таким slug уже существует")

        category = await self.filter_repository.create_category(slug=slug, name=request.name.strip())
        await self._invalidate_catalog_cache()
        return FilterCategorySchema.model_validate(category, from_attributes=True)

    async def create_subcategory(
        self,
        category_id: UUID,
        request: FilterSlugNameRequest,
    ) -> FilterSubcategorySchema:
        category = await self.filter_repository.get_item(str(category_id))
        if category is None:
            raise NotFoundException("Категория не найдена")

        slug = self._normalize_slug(request.slug)
        if await self.filter_repository.get_subcategory_by_slug(category_id, slug):
            raise ConflictException("Подкатегория с таким slug уже существует в категории")

        subcategory = await self.filter_repository.create_subcategory(
            category_id=category_id,
            slug=slug,
            name=request.name.strip(),
        )
        await self._invalidate_catalog_cache()
        return FilterSubcategorySchema.model_validate(subcategory, from_attributes=True)

    async def create_option(
        self,
        subcategory_id: UUID,
        request: FilterSlugNameRequest,
    ) -> FilterOptionSchema:
        subcategory = await self.filter_repository.get_subcategory(subcategory_id)
        if subcategory is None:
            raise NotFoundException("Подкатегория не найдена")

        slug = self._normalize_slug(request.slug)
        if await self.filter_repository.get_option_by_slug(subcategory_id, slug):
            raise ConflictException("Опция с таким slug уже существует в подкатегории")

        option = await self.filter_repository.create_option(
            subcategory_id=subcategory_id,
            slug=slug,
            name=request.name.strip(),
        )
        await self._invalidate_catalog_cache()
        return FilterOptionSchema.model_validate(option, from_attributes=True)

    async def delete_category(self, category_id: UUID) -> FilterDeleteResultSchema:
        user_ids = await self.filter_repository.delete_category_with_user_cleanup(category_id)
        if user_ids is None:
            raise NotFoundException("Категория не найдена")
        return await self._delete_with_user_sync(user_ids)

    async def delete_subcategory(self, subcategory_id: UUID) -> FilterDeleteResultSchema:
        user_ids = await self.filter_repository.delete_subcategory_with_user_cleanup(subcategory_id)
        if user_ids is None:
            raise NotFoundException("Подкатегория не найдена")
        return await self._delete_with_user_sync(user_ids)

    async def delete_option(self, option_id: UUID) -> FilterDeleteResultSchema:
        user_ids = await self.filter_repository.delete_option_with_user_cleanup(option_id)
        if user_ids is None:
            raise NotFoundException("Опция не найдена")
        return await self._delete_with_user_sync(user_ids)
