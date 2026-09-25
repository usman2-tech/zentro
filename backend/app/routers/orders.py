from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.order import CheckoutRequest, OrderResponse
from app.services.checkout_service import CheckoutService

router = APIRouter(tags=["Orders & Checkout"])


@router.post("/checkout", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def checkout(
    payload: CheckoutRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Complete simulated checkout, validate stock, snapshot prices, decrement inventory, and clear cart."""
    return await CheckoutService.checkout(db, current_user, payload)


@router.get("/orders", response_model=List[OrderResponse])
async def list_my_orders(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve purchase history for the authenticated user."""
    return await CheckoutService.get_user_orders(db, current_user)


@router.get("/orders/{id_or_number}", response_model=OrderResponse)
async def get_order_detail(
    id_or_number: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve details for a specific order. Enforces user-level ownership."""
    return await CheckoutService.get_order_detail(db, current_user, id_or_number)
