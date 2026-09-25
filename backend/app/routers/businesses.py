from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.business import BusinessResponse
from app.schemas.common import PaginatedResponse
from app.services.catalog_service import CatalogService

router = APIRouter(tags=["Businesses"])


@router.get("/businesses", response_model=PaginatedResponse[BusinessResponse])
async def list_businesses(
    category: Optional[str] = Query(None, description="Filter by business industry category"),
    search: Optional[str] = Query(None, description="Search business name or description"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve marketplace businesses and merchant storefronts."""
    return await CatalogService.get_businesses(
        db=db, category=category, search=search, page=page, limit=limit
    )


@router.get("/businesses/{id_or_slug}")
async def get_business_detail(
    id_or_slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve business profile with catalog items and recent newsfeed posts."""
    return await CatalogService.get_business_detail(db, id_or_slug)
