from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List


class CartItemQuantity(BaseModel):
    count: str | int = Field(serialization_alias="count")
    available: str | int

    @field_validator('count', 'available')
    @classmethod
    def validate_count(cls, v: int | float) -> str:
        return str(v)


class CartItem(BaseModel):
    product_id: str = Field(serialization_alias="productId")
    quantity: CartItemQuantity = Field(serialization_alias="quantity")
    title: str = Field(serialization_alias="title")
    total: str | int = Field(serialization_alias="total")
    description: str = Field(serialization_alias="description")

    @model_validator(mode="after")
    def validate_total(self):
        self.total = f"{float(self.total):.2f}"
        return self


class CartTotal(BaseModel):
    amount: str | int = Field(serialization_alias="amount")

    @field_validator('amount')
    @classmethod
    def validate_count(cls, v: int | float) -> str:
        return f"{float(v):.2f}"


class Cart(BaseModel):
    # external_id: str = Field(serialization_alias="externalId")
    items: List[CartItem] = Field(serialization_alias="items")
    total: CartTotal = Field(serialization_alias="total")


class OrderInfo(BaseModel):
    id: str = Field(validation_alias="orderId")
    payment_status: str = Field(validation_alias="paymentStatus")


class YandexPayWebhookDTO(BaseModel):
    event: str 
    event_time: str = Field(validation_alias="eventTime")
    
    order: OrderInfo | None = None