from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.product import SearchResults
from app.services.catalog_service import CatalogService

router = APIRouter(tags=["Search"])


@router.get("/search", response_model=SearchResults)
async def unified_search(
    q: str = Query("", description="Keywords to search across products and businesses"),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Unified keyword search returning matched products and businesses."""
    return await CatalogService.search(db=db, query=q, limit=limit)
