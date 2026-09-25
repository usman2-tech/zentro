from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.category import CategoryResponse
from app.services.catalog_service import CatalogService

router = APIRouter(tags=["Categories"])


@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """Retrieve all marketplace product categories with active product counts."""
    return await CatalogService.get_categories(db)
