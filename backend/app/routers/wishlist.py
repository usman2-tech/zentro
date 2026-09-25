import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.wishlist import WishlistResponse
from app.services.wishlist_service import WishlistService

router = APIRouter(tags=["Wishlist"])


@router.get("/wishlist", response_model=List[WishlistResponse])
async def get_my_wishlist(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve saved wishlist items for the authenticated user."""
    return await WishlistService.get_wishlist(db, current_user)


@router.post("/wishlist/{product_id}", response_model=WishlistResponse, status_code=status.HTTP_201_CREATED)
async def add_to_wishlist(
    product_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Save a product to the user's wishlist."""
    return await WishlistService.add_to_wishlist(db, current_user, product_id)


@router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(
    product_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a product from the user's wishlist."""
    success = await WishlistService.remove_from_wishlist(db, current_user, product_id)
    return {"success": success, "product_id": str(product_id)}
