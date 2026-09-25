import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException
from app.models.user import User
from app.repositories.product_repo import ProductRepository
from app.repositories.wishlist_repo import WishlistRepository
from app.schemas.product import ProductResponse
from app.schemas.wishlist import WishlistResponse


class WishlistService:
    @staticmethod
    async def get_wishlist(db: AsyncSession, user: User) -> List[WishlistResponse]:
        items = await WishlistRepository.get_user_wishlist(db, user.id)
        results = []
        for itm in items:
            results.append(
                WishlistResponse(
                    product_id=itm.product_id,
                    created_at=itm.created_at,
                    product=ProductResponse.model_validate(itm.product),
                )
            )
        return results

    @staticmethod
    async def add_to_wishlist(db: AsyncSession, user: User, product_id: uuid.UUID) -> WishlistResponse:
        product = await ProductRepository.get_by_id(db, product_id)
        if not product:
            raise NotFoundException(message="Product not found.")

        item = await WishlistRepository.add_item(db, user.id, product_id)
        await db.commit()

        # Reload wishlists
        items = await WishlistRepository.get_user_wishlist(db, user.id)
        for itm in items:
            if itm.product_id == product_id:
                return WishlistResponse(
                    product_id=itm.product_id,
                    created_at=itm.created_at,
                    product=ProductResponse.model_validate(itm.product),
                )

        return WishlistResponse(
            product_id=item.product_id,
            created_at=item.created_at,
            product=ProductResponse.model_validate(product),
        )

    @staticmethod
    async def remove_from_wishlist(db: AsyncSession, user: User, product_id: uuid.UUID) -> bool:
        removed = await WishlistRepository.remove_item(db, user.id, product_id)
        await db.commit()
        return removed
