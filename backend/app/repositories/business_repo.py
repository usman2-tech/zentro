import uuid
from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.business import Business
from app.models.product import Product


class BusinessRepository:
    @staticmethod
    async def get_all(
        db: AsyncSession,
        category: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[Business], int]:
        stmt = select(Business)
        count_stmt = select(func.count(Business.id))

        if category:
            stmt = stmt.where(Business.category.ilike(f"%{category}%"))
            count_stmt = count_stmt.where(Business.category.ilike(f"%{category}%"))

        if search:
            search_filter = Business.name.ilike(f"%{search}%") | Business.description.ilike(f"%{search}%")
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)

        total = await db.scalar(count_stmt) or 0
        stmt = stmt.order_by(Business.rating.desc(), Business.name.asc()).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all()), total

    @staticmethod
    async def get_by_id(db: AsyncSession, business_id: uuid.UUID) -> Optional[Business]:
        stmt = select(Business).where(Business.id == business_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_slug(db: AsyncSession, slug: str) -> Optional[Business]:
        stmt = select(Business).where(Business.slug == slug.lower().strip())
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_product_count(db: AsyncSession, business_id: uuid.UUID) -> int:
        stmt = select(func.count(Product.id)).where(Product.business_id == business_id)
        result = await db.execute(stmt)
        return result.scalar() or 0
