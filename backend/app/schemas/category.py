import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CategoryBase(BaseModel):
    name: str = Field(..., max_length=100)
    slug: str = Field(..., max_length=100)
    image_url: str = Field(..., max_length=512)
    icon_name: str = Field(default="Tag", max_length=50)


class CategoryResponse(CategoryBase):
    id: uuid.UUID
    product_count: Optional[int] = Field(default=0, description="Total active products in category")

    model_config = ConfigDict(from_attributes=True)
