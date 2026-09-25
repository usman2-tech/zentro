import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class BusinessBase(BaseModel):
    name: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=255)
    description: str
    logo_url: str = Field(..., max_length=512)
    banner_url: str = Field(..., max_length=512)
    category: str = Field(..., max_length=100)
    rating: float = Field(default=4.5)
    location: str = Field(..., max_length=255)


class BusinessResponse(BusinessBase):
    id: uuid.UUID
    created_at: datetime
    product_count: Optional[int] = Field(default=0)

    model_config = ConfigDict(from_attributes=True)
