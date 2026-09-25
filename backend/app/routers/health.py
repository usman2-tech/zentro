from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.session import get_db
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, status_code=status.HTTP_200_OK)
async def check_health(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    """
    Service health check endpoint verifying database connectivity and configuration.
    """
    db_status = "connected"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"unhealthy: {str(exc)}"

    is_healthy = db_status == "connected"
    return HealthResponse(
        status="healthy" if is_healthy else "degraded",
        environment=settings.ENVIRONMENT,
        version="0.1.0",
        database=db_status,
        services={
            "database": "ok" if is_healthy else "error",
            "vector_engine": "ready",
            "ai_provider": settings.AI_PROVIDER,
        },
    )
