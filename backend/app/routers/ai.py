from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.ai import AIAssistantRequest, AIAssistantResponse, AISearchRequest, AISearchResponse
from app.services.ai_service import AIService

router = APIRouter(tags=["AI Features"])


@router.post("/ai/search", response_model=AISearchResponse)
async def natural_language_search(
    payload: AISearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """Semantic vector search across products grounded strictly in catalog embeddings with price constraint parsing."""
    return await AIService.semantic_search(
        db=db,
        query=payload.query,
        limit=payload.limit,
        max_price=payload.max_price,
    )


@router.post("/ai/assistant", response_model=AIAssistantResponse)
async def shopping_assistant(
    payload: AIAssistantRequest,
    db: AsyncSession = Depends(get_db),
):
    """Grounded AI shopping assistant providing product recommendations and comparisons without hallucination."""
    return await AIService.shopping_assistant(db=db, payload=payload)
