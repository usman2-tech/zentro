import random
from datetime import datetime, timezone
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.user import User
from app.repositories.cart_repo import CartRepository
from app.repositories.order_repo import OrderRepository
from app.repositories.product_repo import ProductRepository
from app.schemas.order import CheckoutRequest, OrderItemResponse, OrderResponse


class CheckoutService:
    @staticmethod
    def _generate_order_number() -> str:
        rand_num = random.randint(10000, 99999)
        return f"ZN-2026-{rand_num}"

    @classmethod
    async def checkout(
        cls,
        db: AsyncSession,
        user: User,
        payload: CheckoutRequest,
    ) -> OrderResponse:
        cart = await CartRepository.get_or_create_user_cart(db, user.id)
        if not cart.items:
            raise BadRequestException(message="Your cart is empty. Add products before checking out.")

        subtotal = 0.0
        items_snapshot = []

        # Validate stock & prepare snapshots
        for item in cart.items:
            product = await ProductRepository.get_by_id(db, item.product_id)
            if not product:
                raise BadRequestException(
                    message=f"Product with ID '{item.product_id}' is no longer available."
                )

            if product.stock_quantity < item.quantity:
                raise BadRequestException(
                    message=f"Insufficient stock for '{product.name}'. Only {product.stock_quantity} available."
                )

            item_subtotal = round(product.price * item.quantity, 2)
            subtotal += item_subtotal

            items_snapshot.append(
                {
                    "product_id": product.id,
                    "product_name_snapshot": product.name,
                    "product_image_snapshot": product.image_url,
                    "unit_price": product.price,
                    "quantity": item.quantity,
                    "subtotal": item_subtotal,
                }
            )

            # Decrement stock atomically
            product.stock_quantity -= item.quantity
            if product.stock_quantity <= 0:
                product.stock_quantity = 0
                product.stock_status = "out_of_stock"
            elif product.stock_quantity <= 5:
                product.stock_status = "low_stock"

        subtotal = round(subtotal, 2)
        # Free shipping for orders $100 and above, otherwise $10.00
        shipping_fee = 0.0 if subtotal >= 100.0 else 10.00
        total = round(subtotal + shipping_fee, 2)

        order_number = cls._generate_order_number()

        # Create Order and OrderItems
        order = await OrderRepository.create_order(
            db=db,
            user_id=user.id,
            order_number=order_number,
            status="confirmed",
            subtotal=subtotal,
            shipping_fee=shipping_fee,
            total=total,
            shipping_name=payload.shipping_name.strip(),
            shipping_address=payload.shipping_address.strip(),
            shipping_city=payload.shipping_city.strip(),
            shipping_country=payload.shipping_country.strip(),
            shipping_postal_code=payload.shipping_postal_code.strip(),
            items=items_snapshot,
        )

        # Clear cart upon successful order
        await CartRepository.clear_cart(db, cart.id)
        await db.commit()

        # Reload created order
        persisted_order = await OrderRepository.get_by_id_or_number(db, str(order.id))
        if not persisted_order:
            raise NotFoundException(message="Order creation failed.")

        return OrderResponse.model_validate(persisted_order)

    @classmethod
    async def get_user_orders(cls, db: AsyncSession, user: User) -> List[OrderResponse]:
        orders = await OrderRepository.get_user_orders(db, user.id)
        return [OrderResponse.model_validate(o) for o in orders]

    @classmethod
    async def get_order_detail(cls, db: AsyncSession, user: User, id_or_number: str) -> OrderResponse:
        order = await OrderRepository.get_by_id_or_number(db, id_or_number)
        if not order:
            raise NotFoundException(message=f"Order '{id_or_number}' not found.")

        # Strict authorization: user can only view their own orders
        if order.user_id != user.id:
            raise ForbiddenException(message="You are not authorized to view this order.")

        return OrderResponse.model_validate(order)
