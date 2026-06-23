from uuid import UUID
from pydantic import BaseModel, Field


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


class FilterSlugNameRequest(BaseModel):
    slug: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=128)


class FilterDeleteResultSchema(BaseModel):
    affected_users: int
    reindexed_users: int