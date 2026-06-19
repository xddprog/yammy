from typing import Annotated

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends

from app.api.v1.dependency.staff_auth import require_admin
from app.core.dto.admin import AdminSchema
from app.core.dto.filter import FilterCategorySchema
from app.core.services.filter_service import FilterService


router = APIRouter()


@router.get("/")
@inject
async def get_filters(
    filter_service: FromDishka[FilterService],
    _admin: Annotated[AdminSchema, Depends(require_admin)],
) -> list[FilterCategorySchema]:
    return await filter_service.get_all_filters()
