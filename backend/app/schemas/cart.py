import uuid
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.product import ProductResponse


class CartItemCreate(BaseModel):
    product_id: uuid.UUID = Field(..., description="UUID of the product to add")
    quantity: int = Field(1, ge=1, le=100, description="Quantity to add")


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0, le=100, description="Updated quantity (0 to remove)")


class CartItemResponse(BaseModel):
    id: uuid.UUID
    cart_id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    product: ProductResponse
    subtotal: float

    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    items: List[CartItemResponse] = Field(default_factory=list)
    subtotal: float = 0.0
    item_count: int = 0

    model_config = ConfigDict(from_attributes=True)
