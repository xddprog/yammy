from pydantic import BaseModel, Field


class OrderCreateSchema(BaseModel):
    pass


class OrderCreateResponseSchema(BaseModel):
    payment_url: str


class OrderAdminSchema(BaseModel):
    pass
