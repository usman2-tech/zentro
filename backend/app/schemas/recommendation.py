from typing import List
from pydantic import BaseModel, Field
from app.schemas.product import ProductResponse


class RecommendationItem(BaseModel):
    product: ProductResponse
    reason: str = Field(..., description="Explainable reason why this product was recommended")


class RecommendationResponse(BaseModel):
    items: List[RecommendationItem] = Field(default_factory=list)
    strategy: str = Field(default="hybrid_content_signals")
