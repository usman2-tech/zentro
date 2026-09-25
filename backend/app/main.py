from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import AppException, app_exception_handler, generic_exception_handler
from app.db.session import engine
from app.routers.api_v1 import api_router
from app.routers.health import router as health_router
from app.routers.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager for clean startup and resource disposal."""
    # Startup actions
    yield
    # Shutdown actions
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade AI-Enhanced B2C Marketplace REST API with Vector Search and Grounded RAG.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Configuration
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Exception Handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Top-level Health and Root Route
app.include_router(health_router, tags=["Health"])
app.include_router(health_router, prefix="/api/backend", include_in_schema=False)


@app.get("/", tags=["System"])
async def root() -> JSONResponse:
    return JSONResponse(
        content={
            "app": settings.PROJECT_NAME,
            "version": "0.1.0",
            "environment": settings.ENVIRONMENT,
            "docs": "/docs",
            "health": "/health",
        }
    )


# API routes: versioned (/api/v1), /api/backend aliases, and convenient top-level aliases
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router, prefix="/api/backend/api/v1", include_in_schema=False)
app.include_router(api_router, prefix="/api/backend", include_in_schema=False)
app.include_router(api_router, include_in_schema=False)
