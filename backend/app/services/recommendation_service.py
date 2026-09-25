from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.models.wishlist import Wishlist
from app.schemas.product import ProductResponse
from app.schemas.recommendation import RecommendationItem, RecommendationResponse


class RecommendationService:
    @classmethod
    async def get_recommendations(
        cls,
        db: AsyncSession,
        user: Optional[User] = None,
        limit: int = 8,
    ) -> RecommendationResponse:
        user_category_ids = set()
        user_product_ids = set()
        user_signal_reason = ""

        if user:
            # 1. Check user wishlist
            w_stmt = (
                select(Wishlist)
                .options(selectinload(Wishlist.product))
                .where(Wishlist.user_id == user.id)
                .limit(5)
            )
            w_res = await db.execute(w_stmt)
            wishlists = w_res.scalars().all()

            for w in wishlists:
                user_product_ids.add(w.product_id)
                if w.product and w.product.category_id:
                    user_category_ids.add(w.product.category_id)
                    user_signal_reason = f"Based on items saved in your wishlist"

            # 2. Check previous orders
            o_stmt = (
                select(Order)
                .options(selectinload(Order.items))
                .where(Order.user_id == user.id)
                .limit(3)
            )
            o_res = await db.execute(o_stmt)
            orders = o_res.scalars().all()
            for ord_obj in orders:
                for itm in ord_obj.items:
                    if itm.product_id:
                        user_product_ids.add(itm.product_id)

        # Query recommended candidate products
        stmt = (
            select(Product)
            .options(selectinload(Product.business), selectinload(Product.category))
            .where(Product.stock_status != "out_of_stock")
        )

        # Exclude products user already bought or saved
        if user_product_ids:
            stmt = stmt.where(~Product.id.in_(user_product_ids))

        # If we have category signals, prioritize those categories
        if user_category_ids:
            stmt = stmt.order_by(
                Product.category_id.in_(user_category_ids).desc(),
                Product.rating.desc(),
            )
        else:
            stmt = stmt.order_by(Product.rating.desc(), Product.created_at.desc())

        stmt = stmt.limit(limit)
        result = await db.execute(stmt)
        products = result.scalars().all()

        items = []
        for p in products:
            if user_category_ids and p.category_id in user_category_ids:
                reason = user_signal_reason or f"Because you showed interest in {p.category.name if p.category else 'this category'}"
            elif p.rating >= 4.9:
                reason = f"Top-rated marketplace favorite ({p.rating}★)"
            elif p.business:
                reason = f"Popular from {p.business.name}"
            else:
                reason = f"Recommended based on trending customer activity"

            items.append(
                RecommendationItem(
                    product=ProductResponse.model_validate(p),
                    reason=reason,
                )
            )

        return RecommendationResponse(
            items=items,
            strategy="personalized_signals" if user_category_ids else "curated_trending",
        )
