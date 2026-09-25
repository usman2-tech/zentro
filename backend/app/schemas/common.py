from typing import Generic, List, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T] = Field(..., description="List of items for current page")
    total: int = Field(..., description="Total count of matching records")
    page: int = Field(..., description="Current page number (1-indexed)")
    limit: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total available pages")
