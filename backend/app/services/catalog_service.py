import math
import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException
from app.models.business import Business
from app.models.category import Category
from app.models.product import Product
from app.repositories.business_repo import BusinessRepository
from app.repositories.category_repo import CategoryRepository
from app.repositories.feed_repo import FeedRepository
from app.repositories.product_repo import ProductRepository
from app.schemas.business import BusinessResponse
from app.schemas.category import CategoryResponse
from app.schemas.common import PaginatedResponse
from app.schemas.feed import FeedPostResponse
from app.schemas.product import ProductDetailResponse, ProductResponse, SearchResults


class CatalogService:
    @staticmethod
    async def get_categories(db: AsyncSession) -> List[CategoryResponse]:
        categories = await CategoryRepository.get_all(db)
        results = []
        for cat in categories:
            count = await CategoryRepository.get_product_count(db, cat.id)
            cat_dict = {
                "id": cat.id,
                "name": cat.name,
                "slug": cat.slug,
                "image_url": cat.image_url,
                "icon_name": cat.icon_name,
                "product_count": count,
            }
            results.append(CategoryResponse.model_validate(cat_dict))
        return results

    @staticmethod
    async def get_products(
        db: AsyncSession,
        category: Optional[str] = None,
        business: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_rating: Optional[float] = None,
        stock_status: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "relevance",
        page: int = 1,
        limit: int = 12,
    ) -> PaginatedResponse[ProductResponse]:
        page = max(1, page)
        limit = min(100, max(1, limit))
        skip = (page - 1) * limit

        products, total = await ProductRepository.get_all(
            db=db,
            category=category,
            business=business,
            min_price=min_price,
            max_price=max_price,
            min_rating=min_rating,
            stock_status=stock_status,
            search=search,
            sort_by=sort_by,
            skip=skip,
            limit=limit,
        )

        items = [ProductResponse.model_validate(p) for p in products]
        total_pages = math.ceil(total / limit) if total > 0 else 0

        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    @staticmethod
    async def get_product_detail(db: AsyncSession, id_or_slug: str) -> ProductDetailResponse:
        product: Optional[Product] = None
        try:
            prod_uuid = uuid.UUID(id_or_slug)
            product = await ProductRepository.get_by_id(db, prod_uuid)
        except ValueError:
            pass

        if not product:
            product = await ProductRepository.get_by_slug(db, id_or_slug)

        if not product:
            raise NotFoundException(message=f"Product '{id_or_slug}' not found.")

        related = await ProductRepository.get_related_products(
            db=db,
            category_id=product.category_id,
            exclude_id=product.id,
            limit=4,
        )

        res_dict = ProductResponse.model_validate(product).model_dump()
        res_dict["related_products"] = [ProductResponse.model_validate(r) for r in related]
        return ProductDetailResponse(**res_dict)

    @staticmethod
    async def get_businesses(
        db: AsyncSession,
        category: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> PaginatedResponse[BusinessResponse]:
        page = max(1, page)
        limit = min(50, max(1, limit))
        skip = (page - 1) * limit

        businesses, total = await BusinessRepository.get_all(
            db=db, category=category, search=search, skip=skip, limit=limit
        )

        items = []
        for b in businesses:
            p_count = await BusinessRepository.get_product_count(db, b.id)
            b_dict = {
                "id": b.id,
                "name": b.name,
                "slug": b.slug,
                "description": b.description,
                "logo_url": b.logo_url,
                "banner_url": b.banner_url,
                "category": b.category,
                "rating": b.rating,
                "location": b.location,
                "created_at": b.created_at,
                "product_count": p_count,
            }
            items.append(BusinessResponse.model_validate(b_dict))

        total_pages = math.ceil(total / limit) if total > 0 else 0
        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    @staticmethod
    async def get_business_detail(db: AsyncSession, id_or_slug: str) -> dict:
        business: Optional[Business] = None
        try:
            biz_uuid = uuid.UUID(id_or_slug)
            business = await BusinessRepository.get_by_id(db, biz_uuid)
        except ValueError:
            pass

        if not business:
            business = await BusinessRepository.get_by_slug(db, id_or_slug)

        if not business:
            raise NotFoundException(message=f"Business '{id_or_slug}' not found.")

        # Get business products
        products, _ = await ProductRepository.get_all(db=db, business=business.slug, limit=20)
        # Get business feed posts
        posts = await FeedRepository.get_by_business_id(db, business.id, limit=10)

        p_count = await BusinessRepository.get_product_count(db, business.id)
        b_dict = {
            "id": business.id,
            "name": business.name,
            "slug": business.slug,
            "description": business.description,
            "logo_url": business.logo_url,
            "banner_url": business.banner_url,
            "category": business.category,
            "rating": business.rating,
            "location": business.location,
            "created_at": business.created_at,
            "product_count": p_count,
            "products": [ProductResponse.model_validate(p) for p in products],
            "posts": [FeedPostResponse.model_validate(post) for post in posts],
        }
        return b_dict

    @staticmethod
    async def get_feed(
        db: AsyncSession,
        post_type: Optional[str] = None,
        business: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> PaginatedResponse[FeedPostResponse]:
        page = max(1, page)
        limit = min(50, max(1, limit))
        skip = (page - 1) * limit

        posts, total = await FeedRepository.get_all(
            db=db, post_type=post_type, business_slug=business, skip=skip, limit=limit
        )

        items = [FeedPostResponse.model_validate(p) for p in posts]
        total_pages = math.ceil(total / limit) if total > 0 else 0

        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    @staticmethod
    async def search(db: AsyncSession, query: str, limit: int = 10) -> SearchResults:
        query_str = query.strip()
        if not query_str:
            return SearchResults()

        products, prod_total = await ProductRepository.get_all(
            db=db, search=query_str, limit=limit
        )
        businesses, biz_total = await BusinessRepository.get_all(
            db=db, search=query_str, limit=limit
        )

        return SearchResults(
            products=[ProductResponse.model_validate(p) for p in products],
            businesses=[BusinessResponse.model_validate(b) for b in businesses],
            total_products=prod_total,
            total_businesses=biz_total,
        )
