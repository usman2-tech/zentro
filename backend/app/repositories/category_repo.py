import uuid
from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.category import Category
from app.models.product import Product


class CategoryRepository:
    @staticmethod
    async def get_all(db: AsyncSession) -> List[Category]:
        stmt = select(Category).order_by(Category.name.asc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(db: AsyncSession, category_id: uuid.UUID) -> Optional[Category]:
        stmt = select(Category).where(Category.id == category_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_slug(db: AsyncSession, slug: str) -> Optional[Category]:
        stmt = select(Category).where(Category.slug == slug.lower().strip())
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_product_count(db: AsyncSession, category_id: uuid.UUID) -> int:
        stmt = select(func.count(Product.id)).where(Product.category_id == category_id)
        result = await db.execute(stmt)
        return result.scalar() or 0
