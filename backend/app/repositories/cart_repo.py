import uuid
from typing import Optional
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.cart import Cart, CartItem
from app.models.product import Product


class CartRepository:
    @staticmethod
    async def get_or_create_user_cart(db: AsyncSession, user_id: uuid.UUID) -> Cart:
        stmt = (
            select(Cart)
            .options(
                selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.business),
                selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.category),
            )
            .where(Cart.user_id == user_id)
            .execution_options(populate_existing=True)
        )
        result = await db.execute(stmt)
        cart = result.scalar_one_or_none()

        if not cart:
            cart = Cart(user_id=user_id)
            db.add(cart)
            await db.flush()
            # Reload with relationships
            result = await db.execute(stmt)
            cart = result.scalar_one()

        return cart

    @staticmethod
    async def get_cart_item(db: AsyncSession, item_id: uuid.UUID) -> Optional[CartItem]:
        stmt = (
            select(CartItem)
            .options(
                selectinload(CartItem.product).selectinload(Product.business),
                selectinload(CartItem.product).selectinload(Product.category),
            )
            .where(CartItem.id == item_id)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def add_item(
        db: AsyncSession,
        cart_id: uuid.UUID,
        product_id: uuid.UUID,
        quantity: int = 1,
    ) -> CartItem:
        # Check if item already exists in this cart
        stmt = select(CartItem).where(
            CartItem.cart_id == cart_id,
            CartItem.product_id == product_id,
        )
        result = await db.execute(stmt)
        existing_item = result.scalar_one_or_none()

        if existing_item:
            existing_item.quantity += quantity
            await db.flush()
            return existing_item

        new_item = CartItem(
            id=uuid.uuid4(),
            cart_id=cart_id,
            product_id=product_id,
            quantity=quantity,
        )
        db.add(new_item)
        await db.flush()
        return new_item

    @staticmethod
    async def update_item_quantity(
        db: AsyncSession,
        item: CartItem,
        quantity: int,
    ) -> Optional[CartItem]:
        if quantity <= 0:
            await db.delete(item)
            await db.flush()
            return None
        item.quantity = quantity
        await db.flush()
        return item

    @staticmethod
    async def remove_item(db: AsyncSession, item: CartItem) -> None:
        await db.delete(item)
        await db.flush()

    @staticmethod
    async def clear_cart(db: AsyncSession, cart_id: uuid.UUID) -> None:
        stmt = delete(CartItem).where(CartItem.cart_id == cart_id)
        await db.execute(stmt)
        await db.flush()
