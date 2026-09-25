import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.order import Order, OrderItem


class OrderRepository:
    @staticmethod
    async def create_order(
        db: AsyncSession,
        user_id: uuid.UUID,
        order_number: str,
        status: str,
        subtotal: float,
        shipping_fee: float,
        total: float,
        shipping_name: str,
        shipping_address: str,
        shipping_city: str,
        shipping_country: str,
        shipping_postal_code: str,
        items: List[Dict[str, Any]],
    ) -> Order:
        order = Order(
            id=uuid.uuid4(),
            user_id=user_id,
            order_number=order_number,
            status=status,
            subtotal=subtotal,
            shipping_fee=shipping_fee,
            total=total,
            shipping_name=shipping_name,
            shipping_address=shipping_address,
            shipping_city=shipping_city,
            shipping_country=shipping_country,
            shipping_postal_code=shipping_postal_code,
        )
        db.add(order)
        await db.flush()

        for itm in items:
            order_item = OrderItem(
                id=uuid.uuid4(),
                order_id=order.id,
                product_id=itm.get("product_id"),
                product_name_snapshot=itm["product_name_snapshot"],
                product_image_snapshot=itm.get("product_image_snapshot"),
                unit_price=itm["unit_price"],
                quantity=itm["quantity"],
                subtotal=itm["subtotal"],
            )
            db.add(order_item)

        await db.flush()
        return order

    @staticmethod
    async def get_user_orders(db: AsyncSession, user_id: uuid.UUID) -> List[Order]:
        stmt = (
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id_or_number(db: AsyncSession, id_or_number: str) -> Optional[Order]:
        stmt = (
            select(Order)
            .options(selectinload(Order.items))
        )
        try:
            ord_uuid = uuid.UUID(id_or_number)
            stmt = stmt.where((Order.id == ord_uuid) | (Order.order_number == id_or_number))
        except ValueError:
            stmt = stmt.where(Order.order_number == id_or_number)

        result = await db.execute(stmt)
        return result.scalar_one_or_none()
