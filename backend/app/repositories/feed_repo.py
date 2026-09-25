import uuid
from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.business import Business
from app.models.feed import FeedPost


class FeedRepository:
    @staticmethod
    async def get_all(
        db: AsyncSession,
        post_type: Optional[str] = None,
        business_slug: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[FeedPost], int]:
        stmt = select(FeedPost).join(FeedPost.business).options(selectinload(FeedPost.business))
        count_stmt = select(func.count(FeedPost.id)).join(FeedPost.business)

        if post_type:
            stmt = stmt.where(FeedPost.type == post_type.lower().strip())
            count_stmt = count_stmt.where(FeedPost.type == post_type.lower().strip())

        if business_slug:
            stmt = stmt.where(Business.slug == business_slug.lower().strip())
            count_stmt = count_stmt.where(Business.slug == business_slug.lower().strip())

        total = await db.scalar(count_stmt) or 0
        stmt = stmt.order_by(FeedPost.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all()), total

    @staticmethod
    async def get_by_business_id(
        db: AsyncSession,
        business_id: uuid.UUID,
        limit: int = 10,
    ) -> List[FeedPost]:
        stmt = (
            select(FeedPost)
            .options(selectinload(FeedPost.business))
            .where(FeedPost.business_id == business_id)
            .order_by(FeedPost.created_at.desc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())
