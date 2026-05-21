from pydantic import BaseModel, Field


class PaginationRequestModel(BaseModel):
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=50)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.size


class PaginationResponseModel[PydanticModel: BaseModel](BaseModel):
    total: int
    page: int
    size: int
    items: list[PydanticModel]
