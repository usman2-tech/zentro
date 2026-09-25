from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_optional_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.recommendation import RecommendationResponse
from app.services.recommendation_service import RecommendationService

router = APIRouter(tags=["Recommendations"])


@router.get("/recommendations", response_model=RecommendationResponse)
async def get_product_recommendations(
    limit: int = Query(8, ge=1, le=24),
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve explainable recommendations based on user wishlist/order signals or trending catalog items."""
    return await RecommendationService.get_recommendations(
        db=db, user=current_user, limit=limit
    )
