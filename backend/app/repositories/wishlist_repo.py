import uuid
from typing import List, Optional
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.product import Product
from app.models.wishlist import Wishlist


class WishlistRepository:
    @staticmethod
    async def get_user_wishlist(db: AsyncSession, user_id: uuid.UUID) -> List[Wishlist]:
        stmt = (
            select(Wishlist)
            .options(
                selectinload(Wishlist.product).selectinload(Product.business),
                selectinload(Wishlist.product).selectinload(Product.category),
            )
            .where(Wishlist.user_id == user_id)
            .order_by(Wishlist.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def add_item(db: AsyncSession, user_id: uuid.UUID, product_id: uuid.UUID) -> Wishlist:
        stmt = select(Wishlist).where(
            Wishlist.user_id == user_id,
            Wishlist.product_id == product_id,
        )
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            return existing

        item = Wishlist(user_id=user_id, product_id=product_id)
        db.add(item)
        await db.flush()
        return item

    @staticmethod
    async def remove_item(db: AsyncSession, user_id: uuid.UUID, product_id: uuid.UUID) -> bool:
        stmt = delete(Wishlist).where(
            Wishlist.user_id == user_id,
            Wishlist.product_id == product_id,
        )
        result = await db.execute(stmt)
        await db.flush()
        return result.rowcount > 0
