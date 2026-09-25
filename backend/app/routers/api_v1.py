from fastapi import APIRouter
from app.routers import health, auth

api_router = APIRouter()

# System
api_router.include_router(health.router)

# Authentication & Users
api_router.include_router(auth.router)
