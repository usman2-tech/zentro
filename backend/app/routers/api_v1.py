from fastapi import APIRouter
from app.routers import auth, businesses, categories, feed, health, products, search

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
