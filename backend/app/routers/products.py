from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.product import ProductDetailResponse, ProductResponse
from app.services.catalog_service import CatalogService

router = APIRouter(tags=["Products"])


@router.get("/products", response_model=PaginatedResponse[ProductResponse])
async def list_products(
    category: Optional[str] = Query(None, description="Category slug or UUID"),
    business: Optional[str] = Query(None, description="Business slug or UUID"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    stock_status: Optional[str] = Query(None, description="in_stock, low_stock, out_of_stock"),
    search: Optional[str] = Query(None, description="Keyword search in product title or description"),
    sort_by: str = Query("relevance", description="relevance, price_asc, price_desc, rating_desc, newest"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Browse and filter products with multi-attribute criteria and pagination."""
    return await CatalogService.get_products(
        db=db,
        category=category,
        business=business,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        stock_status=stock_status,
        search=search,
        sort_by=sort_by,
        page=page,
        limit=limit,
    )


@router.get("/products/{id_or_slug}", response_model=ProductDetailResponse)
async def get_product_detail(
    id_or_slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve detailed product information including merchant specs and related products."""
    return await CatalogService.get_product_detail(db, id_or_slug)
