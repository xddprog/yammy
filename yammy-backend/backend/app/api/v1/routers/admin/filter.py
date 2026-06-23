from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends

from app.api.v1.dependency.staff_auth import require_admin
from app.core.dto.admin import AdminSchema
from app.core.dto.filter import (
    FilterCategorySchema,
    FilterDeleteResultSchema,
    FilterOptionSchema,
    FilterSlugNameRequest,
    FilterSubcategorySchema,
)
from app.core.services.filter_service import FilterService


router = APIRouter()


@router.get("/")
@inject
async def get_filters(
    filter_service: FromDishka[FilterService],
    _admin: Annotated[AdminSchema, Depends(require_admin)],
) -> list[FilterCategorySchema]:
    return await filter_service.get_all_filters()


@router.post("/categories", status_code=201)
@inject
async def create_filter_category(
    body: FilterSlugNameRequest,
    filter_service: FromDishka[FilterService],
    _admin: Annotated[AdminSchema, Depends(require_admin)],
) -> FilterCategorySchema:
    return await filter_service.create_category(body)


@router.post("/categories/{category_id}/subcategories", status_code=201)
@inject
async def create_filter_subcategory(
    category_id: UUID,
    body: FilterSlugNameRequest,
    filter_service: FromDishka[FilterService],
    _admin: Annotated[AdminSchema, Depends(require_admin)],
) -> FilterSubcategorySchema:
    return await filter_service.create_subcategory(category_id, body)


@router.post("/subcategories/{subcategory_id}/options", status_code=201)
@inject
async def create_filter_option(
    subcategory_id: UUID,
    body: FilterSlugNameRequest,
    filter_service: FromDishka[FilterService],
    _admin: Annotated[AdminSchema, Depends(require_admin)],
) -> FilterOptionSchema:
    return await filter_service.create_option(subcategory_id, body)


@router.delete("/categories/{category_id}")
@inject
async def delete_filter_category(
    category_id: UUID,
    filter_service: FromDishka[FilterService],
    _admin: Annotated[AdminSchema, Depends(require_admin)],
) -> FilterDeleteResultSchema:
    return await filter_service.delete_category(category_id)


@router.delete("/subcategories/{subcategory_id}")
@inject
async def delete_filter_subcategory(
    subcategory_id: UUID,
    filter_service: FromDishka[FilterService],
    _admin: Annotated[AdminSchema, Depends(require_admin)],
) -> FilterDeleteResultSchema:
    return await filter_service.delete_subcategory(subcategory_id)


@router.delete("/options/{option_id}")
@inject
async def delete_filter_option(
    option_id: UUID,
    filter_service: FromDishka[FilterService],
    _admin: Annotated[AdminSchema, Depends(require_admin)],
) -> FilterDeleteResultSchema:
    return await filter_service.delete_option(option_id)
