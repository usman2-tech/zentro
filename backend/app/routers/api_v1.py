from fastapi import APIRouter
from app.routers import (
    ai,
    auth,
    businesses,
    cart,
    categories,
    feed,
    health,
    orders,
    products,
    recommendations,
    search,
    wishlist,
)

api_router = APIRouter()

# System & Health
api_router.include_router(health.router)

# Authentication & Users
api_router.include_router(auth.router)

# Discovery & Catalog
api_router.include_router(categories.router)
api_router.include_router(products.router)
api_router.include_router(businesses.router)
api_router.include_router(feed.router)
api_router.include_router(search.router)

# Commerce (Cart, Checkout, Orders, Wishlist)
api_router.include_router(cart.router)
api_router.include_router(orders.router)
api_router.include_router(wishlist.router)

# AI & Recommendations
api_router.include_router(ai.router)
api_router.include_router(recommendations.router)
