import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CheckoutRequest(BaseModel):
    shipping_name: str = Field(..., min_length=2, max_length=255)
    shipping_address: str = Field(..., min_length=5, max_length=255)
    shipping_city: str = Field(..., min_length=2, max_length=100)
    shipping_country: str = Field(default="United States", max_length=100)
    shipping_postal_code: str = Field(..., min_length=3, max_length=20)
    payment_method: str = Field(default="simulated_card", max_length=50)


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: Optional[uuid.UUID] = None
    product_name_snapshot: str
    product_image_snapshot: Optional[str] = None
    unit_price: float
    quantity: int
    subtotal: float

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    order_number: str
    status: str
    subtotal: float
    shipping_fee: float
    total: float
    shipping_name: str
    shipping_address: str
    shipping_city: str
    shipping_country: str
    shipping_postal_code: str
    items: List[OrderItemResponse] = Field(default_factory=list)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
