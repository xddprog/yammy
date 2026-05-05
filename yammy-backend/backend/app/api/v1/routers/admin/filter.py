from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter

from app.core.dto.filter import FilterCategorySchema
from app.core.services.filter_service import FilterService


router = APIRouter()


@router.get("/")
@inject
async def get_filters(
    filter_service: FromDishka[FilterService],
) -> list[FilterCategorySchema]:
    return await filter_service.get_all_filters()