import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartResponse
from app.services.cart_service import CartService

router = APIRouter(tags=["Cart"])


@router.get("/cart", response_model=CartResponse)
async def get_my_cart(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve current customer's shopping cart with populated item details and subtotal."""
    return await CartService.get_user_cart(db, current_user)


@router.post("/cart/items", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
async def add_item_to_cart(
    payload: CartItemCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a product to cart or increment quantity if already present."""
    return await CartService.add_item_to_cart(
        db, current_user, payload.product_id, payload.quantity
    )


@router.patch("/cart/items/{item_id}", response_model=CartResponse)
async def update_cart_item(
    item_id: uuid.UUID,
    payload: CartItemUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update cart item quantity. Setting quantity to 0 removes the item."""
    return await CartService.update_cart_item(db, current_user, item_id, payload.quantity)


@router.delete("/cart/items/{item_id}", response_model=CartResponse)
async def remove_cart_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove an item from cart."""
    return await CartService.remove_cart_item(db, current_user, item_id)
