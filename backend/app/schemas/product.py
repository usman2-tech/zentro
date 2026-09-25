import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.business import BusinessResponse
from app.schemas.category import CategoryResponse


class ProductBase(BaseModel):
    name: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=255)
    description: str
    price: float = Field(..., ge=0)
    stock_quantity: int = Field(default=0, ge=0)
    stock_status: str = Field(default="in_stock")
    image_url: str = Field(..., max_length=512)
    rating: float = Field(default=4.5, ge=0, le=5)


class ProductResponse(ProductBase):
    id: uuid.UUID
    business_id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    created_at: datetime
    business: Optional[BusinessResponse] = None
    category: Optional[CategoryResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ProductDetailResponse(ProductResponse):
    related_products: List[ProductResponse] = Field(default_factory=list)


class SearchResults(BaseModel):
    products: List[ProductResponse] = Field(default_factory=list)
    businesses: List[BusinessResponse] = Field(default_factory=list)
    total_products: int = 0
    total_businesses: int = 0
