from pydantic import BaseModel


class PaginationRequestModel(BaseModel):
    page: int 
    size: int
    

class PaginationResponseModel[PydanticModel: BaseModel](BaseModel):
    total: int
    page: int
    size: int
    items: list[PydanticModel]
    