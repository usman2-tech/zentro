import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.business import BusinessResponse


class FeedPostBase(BaseModel):
    type: str = Field(..., max_length=50, description="Post type: announcement, promotion, product_launch, article, update")
    title: str = Field(..., max_length=255)
    content: str
    image_url: Optional[str] = Field(None, max_length=512)


class FeedPostResponse(FeedPostBase):
    id: uuid.UUID
    business_id: uuid.UUID
    created_at: datetime
    business: Optional[BusinessResponse] = None

    model_config = ConfigDict(from_attributes=True)
