import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.cart import Cart
from app.models.user import User
from app.repositories.cart_repo import CartRepository
from app.repositories.product_repo import ProductRepository
from app.schemas.cart import CartItemResponse, CartResponse
from app.schemas.product import ProductResponse


class CartService:
    @classmethod
    def _format_cart_response(cls, cart: Cart) -> CartResponse:
        items = []
        subtotal = 0.0
        item_count = 0

        for item in cart.items:
            item_subtotal = round(item.product.price * item.quantity, 2)
            subtotal += item_subtotal
            item_count += item.quantity
            items.append(
                CartItemResponse(
                    id=item.id,
                    cart_id=item.cart_id,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    product=ProductResponse.model_validate(item.product),
                    subtotal=item_subtotal,
                )
            )

        return CartResponse(
            id=cart.id,
            user_id=cart.user_id,
            items=items,
            subtotal=round(subtotal, 2),
            item_count=item_count,
        )

    @classmethod
    async def get_user_cart(cls, db: AsyncSession, user: User) -> CartResponse:
        cart = await CartRepository.get_or_create_user_cart(db, user.id)
        return cls._format_cart_response(cart)

    @classmethod
    async def add_item_to_cart(
        cls,
        db: AsyncSession,
        user: User,
        product_id: uuid.UUID,
        quantity: int = 1,
    ) -> CartResponse:
        product = await ProductRepository.get_by_id(db, product_id)
        if not product:
            raise NotFoundException(message="Product not found.")

        if product.stock_status == "out_of_stock" or product.stock_quantity <= 0:
            raise BadRequestException(message=f"'{product.name}' is currently out of stock.")

        cart = await CartRepository.get_or_create_user_cart(db, user.id)

        # Check existing item quantity in cart
        existing_qty = 0
        for itm in cart.items:
            if itm.product_id == product_id:
                existing_qty = itm.quantity
                break

        if existing_qty + quantity > product.stock_quantity:
            raise BadRequestException(
                message=f"Cannot add {quantity} more. Only {product.stock_quantity} available in stock."
            )

        user_id = user.id
        await CartRepository.add_item(db, cart.id, product_id, quantity)
        await db.commit()

        # Reload updated cart with populate_existing=True
        updated_cart = await CartRepository.get_or_create_user_cart(db, user_id)
        return cls._format_cart_response(updated_cart)

    @classmethod
    async def update_cart_item(
        cls,
        db: AsyncSession,
        user: User,
        item_id: uuid.UUID,
        quantity: int,
    ) -> CartResponse:
        user_id = user.id
        cart_item = await CartRepository.get_cart_item(db, item_id)
        if not cart_item:
            raise NotFoundException(message="Cart item not found.")

        # Ensure user owns the cart
        user_cart = await CartRepository.get_or_create_user_cart(db, user_id)
        if cart_item.cart_id != user_cart.id:
            raise ForbiddenException(message="You cannot modify another user's cart.")

        if quantity > 0:
            if quantity > cart_item.product.stock_quantity:
                raise BadRequestException(
                    message=f"Only {cart_item.product.stock_quantity} available in stock."
                )
            await CartRepository.update_item_quantity(db, cart_item, quantity)
        else:
            await CartRepository.remove_item(db, cart_item)

        await db.commit()
        updated_cart = await CartRepository.get_or_create_user_cart(db, user_id)
        return cls._format_cart_response(updated_cart)

    @classmethod
    async def remove_cart_item(
        cls,
        db: AsyncSession,
        user: User,
        item_id: uuid.UUID,
    ) -> CartResponse:
        user_id = user.id
        cart_item = await CartRepository.get_cart_item(db, item_id)
        if not cart_item:
            raise NotFoundException(message="Cart item not found.")

        user_cart = await CartRepository.get_or_create_user_cart(db, user_id)
        if cart_item.cart_id != user_cart.id:
            raise ForbiddenException(message="You cannot modify another user's cart.")

        await CartRepository.remove_item(db, cart_item)
        await db.commit()

        updated_cart = await CartRepository.get_or_create_user_cart(db, user_id)
        return cls._format_cart_response(updated_cart)
