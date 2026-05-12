from uuid import UUID
from pydantic import BaseModel


class FilterOptionSchema(BaseModel):
    id: UUID
    slug: str
    name: str


class FilterSubcategorySchema(BaseModel):
    id: UUID
    slug: str
    name: str
    options: list[FilterOptionSchema] = []


class FilterCategorySchema(BaseModel):
    id: UUID
    slug: str
    name: str
    subcategories: list[FilterSubcategorySchema] = []