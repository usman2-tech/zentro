import asyncio
import sys
import os
import uuid
from datetime import datetime, timezone
from passlib.context import CryptContext
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from app.db.session import async_session_factory, engine
from app.models import (
    Base,
    User,
    Business,
    Category,
    Product,
    FeedPost,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Wishlist,
)
from app.db.seed.data import (
    CATEGORIES,
    BUSINESSES,
    PRODUCTS_RAW,
    FEED_POSTS,
    DEMO_USER,
    generate_deterministic_embedding,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed_database() -> None:
    print("🌱 [Zentro Seeder] Connecting to database...")
    async with async_session_factory() as session:
        # Check existing categories
        existing_categories_stmt = await session.execute(select(Category))
        existing_categories = existing_categories_stmt.scalars().all()
        if existing_categories:
            print("⚠️ [Zentro Seeder] Existing records detected. Resetting database for fresh seed...")
            await session.execute(delete(OrderItem))
            await session.execute(delete(Order))
            await session.execute(delete(CartItem))
            await session.execute(delete(Cart))
            await session.execute(delete(Wishlist))
            await session.execute(delete(FeedPost))
            await session.execute(delete(Product))
            await session.execute(delete(Business))
            await session.execute(delete(Category))
            await session.execute(delete(User))
            await session.commit()

        # 1. Seed Categories
        print(f"📦 [Zentro Seeder] Inserting {len(CATEGORIES)} categories...")
        category_map = {}
        for cat_data in CATEGORIES:
            cat = Category(
                id=uuid.UUID(cat_data["id"]),
                name=cat_data["name"],
                slug=cat_data["slug"],
                image_url=cat_data["image_url"],
                icon_name=cat_data["icon_name"],
            )
            session.add(cat)
            category_map[cat_data["slug"]] = cat
        await session.flush()

        # 2. Seed Businesses
        print(f"🏢 [Zentro Seeder] Inserting {len(BUSINESSES)} businesses...")
        business_map = {}
        for b_data in BUSINESSES:
            biz = Business(
                id=uuid.UUID(b_data["id"]),
                name=b_data["name"],
                slug=b_data["slug"],
                description=b_data["description"],
                logo_url=b_data["logo_url"],
                banner_url=b_data["banner_url"],
                category=b_data["category"],
                rating=b_data["rating"],
                location=b_data["location"],
            )
            session.add(biz)
            business_map[b_data["slug"]] = biz
        await session.flush()

        # 3. Seed Products
        print(f"🛍️ [Zentro Seeder] Generating embeddings and inserting {len(PRODUCTS_RAW)} products...")
        product_map = {}
        for prod_data in PRODUCTS_RAW:
            biz = business_map[prod_data["business_slug"]]
            cat = category_map[prod_data["category_slug"]]
            
            # Embedding representation combines name, category, and specifications
            embed_text = f"{prod_data['name']}. Category: {cat.name}. Merchant: {biz.name}. {prod_data['description']}"
            embedding_vector = generate_deterministic_embedding(embed_text, prod_data["category_slug"])
            
            prod = Product(
                business_id=biz.id,
                category_id=cat.id,
                name=prod_data["name"],
                slug=prod_data["slug"],
                description=prod_data["description"],
                price=prod_data["price"],
                stock_quantity=prod_data["stock_quantity"],
                stock_status=prod_data["stock_status"],
                image_url=prod_data["image_url"],
                rating=prod_data["rating"],
                embedding=embedding_vector,
            )
            session.add(prod)
            product_map[prod_data["slug"]] = prod
        await session.flush()

        # 4. Seed Feed Posts
        print(f"📰 [Zentro Seeder] Inserting {len(FEED_POSTS)} business feed posts...")
        for post_data in FEED_POSTS:
            biz = business_map[post_data["business_slug"]]
            post = FeedPost(
                business_id=biz.id,
                type=post_data["type"],
                title=post_data["title"],
                content=post_data["content"],
                image_url=post_data.get("image_url"),
            )
            session.add(post)
        await session.flush()

        # 5. Seed Demo User
        print("👤 [Zentro Seeder] Creating demo customer (Alex Rivera)...")
        demo_password_hash = pwd_context.hash("ZentroDemo2026!")
        demo_user = User(
            id=uuid.UUID(DEMO_USER["id"]),
            name=DEMO_USER["name"],
            email=DEMO_USER["email"],
            password_hash=demo_password_hash,
            is_active=True,
        )
        session.add(demo_user)
        await session.flush()

        # 6. Seed Demo User Cart
        print("🛒 [Zentro Seeder] Initializing demo user cart...")
        demo_cart = Cart(user_id=demo_user.id)
        session.add(demo_cart)
        await session.flush()

        # Add 1 item to active cart
        cart_prod = product_map.get("aura-flow-anc-wireless-headphones")
        if cart_prod:
            session.add(CartItem(cart_id=demo_cart.id, product_id=cart_prod.id, quantity=1))

        # 7. Seed Demo User Wishlist
        print("❤️ [Zentro Seeder] Adding 4 wishlist items for demo user...")
        wishlist_slugs = [
            "kanso-75-cnc-mechanical-keyboard",
            "origin-precision-conical-burr-coffee-grinder",
            "vanguard-shift-26l-commuter-backpack",
            "nordic-ergo-lift-standing-desk",
        ]
        for w_slug in wishlist_slugs:
            w_prod = product_map.get(w_slug)
            if w_prod:
                session.add(Wishlist(user_id=demo_user.id, product_id=w_prod.id))

        # 8. Seed Demo Historical Orders
        print("📜 [Zentro Seeder] Creating 3 realistic historical orders...")
        orders_data = [
            {
                "order_number": "ZN-2026-89412",
                "status": "delivered",
                "subtotal": 177.00,
                "shipping_fee": 0.00,
                "total": 177.00,
                "shipping_name": "Alex Rivera",
                "shipping_address": "452 Market Street, Apt 7B",
                "shipping_city": "San Francisco",
                "shipping_country": "United States",
                "shipping_postal_code": "94105",
                "items": [
                    {
                        "product_slug": "aura-pulse-pro-sport-earbuds",
                        "quantity": 1,
                        "unit_price": 89.00,
                    },
                    {
                        "product_slug": "apex-aeroflex-compression-tights",
                        "quantity": 1,
                        "unit_price": 64.00,
                    },
                    {
                        "product_slug": "apex-speed-jump-rope-with-bearing-system",
                        "quantity": 1,
                        "unit_price": 24.00,
                    },
                ],
            },
            {
                "order_number": "ZN-2026-92147",
                "status": "shipped",
                "subtotal": 136.00,
                "shipping_fee": 10.00,
                "total": 146.00,
                "shipping_name": "Alex Rivera",
                "shipping_address": "452 Market Street, Apt 7B",
                "shipping_city": "San Francisco",
                "shipping_country": "United States",
                "shipping_postal_code": "94105",
                "items": [
                    {
                        "product_slug": "vanguard-shift-26l-commuter-backpack",
                        "quantity": 1,
                        "unit_price": 98.00,
                    },
                    {
                        "product_slug": "origin-yirgacheffe-single-origin-whole-beans-2lb",
                        "quantity": 1,
                        "unit_price": 38.00,
                    },
                ],
            },
            {
                "order_number": "ZN-2026-97305",
                "status": "processing",
                "subtotal": 240.00,
                "shipping_fee": 0.00,
                "total": 240.00,
                "shipping_name": "Alex Rivera",
                "shipping_address": "452 Market Street, Apt 7B",
                "shipping_city": "San Francisco",
                "shipping_country": "United States",
                "shipping_postal_code": "94105",
                "items": [
                    {
                        "product_slug": "nordic-walnut-dual-monitor-stand",
                        "quantity": 1,
                        "unit_price": 95.00,
                    },
                    {
                        "product_slug": "verdant-damascus-8-inch-chef-knife",
                        "quantity": 1,
                        "unit_price": 145.00,
                    },
                ],
            },
        ]

        for o_info in orders_data:
            ord_obj = Order(
                user_id=demo_user.id,
                order_number=o_info["order_number"],
                status=o_info["status"],
                subtotal=o_info["subtotal"],
                shipping_fee=o_info["shipping_fee"],
                total=o_info["total"],
                shipping_name=o_info["shipping_name"],
                shipping_address=o_info["shipping_address"],
                shipping_city=o_info["shipping_city"],
                shipping_country=o_info["shipping_country"],
                shipping_postal_code=o_info["shipping_postal_code"],
            )
            session.add(ord_obj)
            await session.flush()

            for itm in o_info["items"]:
                p_obj = product_map.get(itm["product_slug"])
                subtot = itm["unit_price"] * itm["quantity"]
                oi = OrderItem(
                    order_id=ord_obj.id,
                    product_id=p_obj.id if p_obj else None,
                    product_name_snapshot=p_obj.name if p_obj else itm["product_slug"],
                    product_image_snapshot=p_obj.image_url if p_obj else None,
                    unit_price=itm["unit_price"],
                    quantity=itm["quantity"],
                    subtotal=subtot,
                )
                session.add(oi)

        await session.commit()
        print("✅ [Zentro Seeder] Database seeding successfully completed!")
        print(f"   • Categories:  {len(CATEGORIES)}")
        print(f"   • Businesses:  {len(BUSINESSES)}")
        print(f"   • Products:    {len(PRODUCTS_RAW)} (all pre-embedded)")
        print(f"   • Feed Posts:  {len(FEED_POSTS)}")
        print(f"   • Demo User:   {demo_user.email} (password: ZentroDemo2026!)")
        print(f"   • Orders:      {len(orders_data)} with items")
        print(f"   • Wishlist:    {len(wishlist_slugs)} items")


if __name__ == "__main__":
    asyncio.run(seed_database())
