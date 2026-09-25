import asyncio
import sys
import os
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import async_session_factory
from app.models import (
    User,
    Business,
    Category,
    Product,
    FeedPost,
    Cart,
    Order,
    OrderItem,
    Wishlist,
)


async def verify():
    async with async_session_factory() as session:
        user_cnt = await session.scalar(select(func.count(User.id)))
        biz_cnt = await session.scalar(select(func.count(Business.id)))
        cat_cnt = await session.scalar(select(func.count(Category.id)))
        prod_cnt = await session.scalar(select(func.count(Product.id)))
        post_cnt = await session.scalar(select(func.count(FeedPost.id)))
        order_cnt = await session.scalar(select(func.count(Order.id)))
        item_cnt = await session.scalar(select(func.count(OrderItem.id)))
        wish_cnt = await session.scalar(select(func.count(Wishlist.user_id)))

        print("=== DATABASE RECORD COUNTS ===")
        print(f"Users:        {user_cnt}")
        print(f"Businesses:   {biz_cnt}")
        print(f"Categories:   {cat_cnt}")
        print(f"Products:     {prod_cnt}")
        print(f"Feed Posts:   {post_cnt}")
        print(f"Orders:       {order_cnt}")
        print(f"Order Items:  {item_cnt}")
        print(f"Wishlists:    {wish_cnt}")

        assert user_cnt >= 1, "User count must be at least 1"
        assert biz_cnt >= 10, "Business count must be at least 10"
        assert cat_cnt >= 8, "Category count must be at least 8"
        assert prod_cnt >= 50, "Product count must be at least 50"
        assert post_cnt >= 15, "Feed post count must be at least 15"
        assert order_cnt >= 3, "Order count must be at least 3"

        # Check product relationship and embedding vector length
        stmt = (
            select(Product)
            .options(selectinload(Product.business), selectinload(Product.category))
            .limit(3)
        )
        sample_prods = (await session.execute(stmt)).scalars().all()
        print("\n=== SAMPLE PRODUCT INSPECTION ===")
        for p in sample_prods:
            vec_len = len(p.embedding) if p.embedding else 0
            print(f"- [{p.category.name}] {p.name} (${p.price}) sold by {p.business.name}")
            print(f"  Embedding dimension: {vec_len} (expected 1536)")
            assert vec_len == 1536, f"Expected 1536 dim embedding, got {vec_len}"

        # Check orders with items
        order_stmt = select(Order).options(selectinload(Order.items)).limit(1)
        sample_order = (await session.execute(order_stmt)).scalar_one()
        print("\n=== SAMPLE ORDER INSPECTION ===")
        print(f"Order {sample_order.order_number}: Status={sample_order.status}, Total=${sample_order.total}")
        for itm in sample_order.items:
            print(f"  • {itm.product_name_snapshot} x{itm.quantity} @ ${itm.unit_price} = ${itm.subtotal}")

        print("\n[ALL DATABASE VERIFICATION CHECKS PASSED]")


if __name__ == "__main__":
    asyncio.run(verify())
