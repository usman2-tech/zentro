from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.product import ProductResponse


class AISearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500, description="Natural language search prompt")
    limit: int = Field(8, ge=1, le=24)
    max_price: Optional[float] = Field(None, ge=0)


class AISearchResponse(BaseModel):
    query: str
    explanation: str
    products: List[ProductResponse] = Field(default_factory=list)
    match_reasons: Dict[str, str] = Field(default_factory=dict, description="Explanation per product ID")


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user', 'assistant', or 'system'")
    content: str


class AIAssistantRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500)
    history: List[ChatMessage] = Field(default_factory=list)


class AIAssistantResponse(BaseModel):
    message: str
    products: List[ProductResponse] = Field(default_factory=list)
    match_reasons: Dict[str, str] = Field(default_factory=dict)
    suggested_followups: List[str] = Field(default_factory=list)
