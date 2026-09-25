from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.feed import FeedPostResponse
from app.services.catalog_service import CatalogService

router = APIRouter(tags=["Newsfeed"])


@router.get("/feed", response_model=PaginatedResponse[FeedPostResponse])
async def list_feed_posts(
    type: Optional[str] = Query(None, description="announcement, promotion, product_launch, article, update"),
    business: Optional[str] = Query(None, description="Business slug filter"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve social newsfeed announcements, product launches, and merchant updates."""
    return await CatalogService.get_feed(
        db=db, post_type=type, business=business, page=page, limit=limit
    )
