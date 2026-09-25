import uuid
from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.business import Business
from app.models.category import Category
from app.models.product import Product


class ProductRepository:
    @staticmethod
    async def get_all(
        db: AsyncSession,
        category: Optional[str] = None,
        business: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_rating: Optional[float] = None,
        stock_status: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "relevance",
        skip: int = 0,
        limit: int = 12,
    ) -> Tuple[List[Product], int]:
        stmt = (
            select(Product)
            .join(Product.business)
            .outerjoin(Product.category)
            .options(selectinload(Product.business), selectinload(Product.category))
        )
        count_stmt = select(func.count(Product.id)).join(Product.business).outerjoin(Product.category)

        # Filters
        if category:
            cat_filter = (Category.slug == category.lower().strip())
            try:
                cat_uuid = uuid.UUID(category)
                cat_filter = cat_filter | (Category.id == cat_uuid)
            except ValueError:
                pass
            stmt = stmt.where(cat_filter)
            count_stmt = count_stmt.where(cat_filter)

        if business:
            biz_filter = (Business.slug == business.lower().strip())
            try:
                biz_uuid = uuid.UUID(business)
                biz_filter = biz_filter | (Business.id == biz_uuid)
            except ValueError:
                pass
            stmt = stmt.where(biz_filter)
            count_stmt = count_stmt.where(biz_filter)

        if min_price is not None:
            stmt = stmt.where(Product.price >= min_price)
            count_stmt = count_stmt.where(Product.price >= min_price)

        if max_price is not None:
            stmt = stmt.where(Product.price <= max_price)
            count_stmt = count_stmt.where(Product.price <= max_price)

        if min_rating is not None:
            stmt = stmt.where(Product.rating >= min_rating)
            count_stmt = count_stmt.where(Product.rating >= min_rating)

        if stock_status:
            stmt = stmt.where(Product.stock_status == stock_status.lower().strip())
            count_stmt = count_stmt.where(Product.stock_status == stock_status.lower().strip())

        if search:
            search_pattern = f"%{search.strip()}%"
            search_clause = (
                Product.name.ilike(search_pattern)
                | Product.description.ilike(search_pattern)
                | Business.name.ilike(search_pattern)
            )
            stmt = stmt.where(search_clause)
            count_stmt = count_stmt.where(search_clause)

        # Sorting
        if sort_by == "price_asc":
            stmt = stmt.order_by(Product.price.asc())
        elif sort_by == "price_desc":
            stmt = stmt.order_by(Product.price.desc())
        elif sort_by == "rating_desc":
            stmt = stmt.order_by(Product.rating.desc(), Product.price.asc())
        elif sort_by == "newest":
            stmt = stmt.order_by(Product.created_at.desc())
        else:  # relevance
            stmt = stmt.order_by(Product.rating.desc(), Product.created_at.desc())

        total = await db.scalar(count_stmt) or 0
        stmt = stmt.offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all()), total

    @staticmethod
    async def get_by_id(db: AsyncSession, product_id: uuid.UUID) -> Optional[Product]:
        stmt = (
            select(Product)
            .options(selectinload(Product.business), selectinload(Product.category))
            .where(Product.id == product_id)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_slug(db: AsyncSession, slug: str) -> Optional[Product]:
        stmt = (
            select(Product)
            .options(selectinload(Product.business), selectinload(Product.category))
            .where(Product.slug == slug.lower().strip())
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_related_products(
        db: AsyncSession,
        category_id: Optional[uuid.UUID],
        exclude_id: uuid.UUID,
        limit: int = 4,
    ) -> List[Product]:
        stmt = (
            select(Product)
            .options(selectinload(Product.business), selectinload(Product.category))
            .where(Product.id != exclude_id)
        )
        if category_id:
            stmt = stmt.where(Product.category_id == category_id)

        stmt = stmt.order_by(Product.rating.desc()).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())
