import re
from typing import Dict, List, Optional
import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.ai.factory import get_ai_provider
from app.models.product import Product
from app.schemas.ai import AIAssistantRequest, AIAssistantResponse, AISearchRequest, AISearchResponse, ChatMessage
from app.schemas.product import ProductResponse


def extract_price_constraint(query: str) -> Optional[float]:
    """Extract price upper bound from natural language query like 'under $150', 'below 100', 'don't want to spend more than $150'."""
    patterns = [
        r"(?:under|below|less\s+than|budget\s+(?:of|is)?|up\s+to|no\s+more\s+than|not\s+more\s+than|don'?t\s+want\s+to\s+spend\s+more\s+than|maximum\s+(?:of)?|max)\s*\$?(\d+(?:\.\d{1,2})?)",
        r"\$?(\d+(?:\.\d{1,2})?)\s*(?:budget|or\s+less|max|maximum)",
    ]
    for pattern in patterns:
        match = re.search(pattern, query, re.IGNORECASE)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                continue
    return None


def calculate_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    if not vec1 or not vec2:
        return 0.0
    v1 = np.array(vec1, dtype=np.float32)
    v2 = np.array(vec2, dtype=np.float32)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(v1, v2) / (norm1 * norm2))


class AIService:
    @classmethod
    async def semantic_search(
        cls,
        db: AsyncSession,
        query: str,
        limit: int = 8,
        max_price: Optional[float] = None,
    ) -> AISearchResponse:
        ai_provider = get_ai_provider()
        
        # 1. Extract natural language constraints
        extracted_max_price = extract_price_constraint(query)
        effective_max_price = max_price if max_price is not None else extracted_max_price

        # 2. Generate embedding for user query
        query_vector = await ai_provider.generate_embedding(query)

        # 3. Retrieve all products with embeddings from database
        stmt = (
            select(Product)
            .options(selectinload(Product.business), selectinload(Product.category))
        )
        result = await db.execute(stmt)
        all_products = result.scalars().all()

        scored_products = []
        for p in all_products:
            # Apply structured price constraint
            if effective_max_price is not None and p.price > effective_max_price:
                continue

            # Prioritize in-stock / low-stock
            if p.stock_status == "out_of_stock":
                continue

            similarity = 0.0
            if p.embedding:
                similarity = calculate_cosine_similarity(query_vector, p.embedding)
            else:
                q_words = set(query.lower().split())
                p_words = set(f"{p.name} {p.description}".lower().split())
                similarity = len(q_words & p_words) / (len(q_words) + 1)

            # Minimum relevance threshold prevents completely unrelated products
            if similarity < 0.25:
                continue

            scored_products.append((p, similarity))

        # Sort by similarity score descending
        scored_products.sort(key=lambda x: x[1], reverse=True)
        top_matches = scored_products[:limit]

        products = []
        match_reasons = {}
        for p, score in top_matches:
            products.append(ProductResponse.model_validate(p))
            # Generate explainable match reason
            reason_parts = []
            if effective_max_price is not None and p.price <= effective_max_price:
                reason_parts.append(f"Fits budget (${p.price:.2f})")
            if p.rating >= 4.8:
                reason_parts.append(f"Top-rated ({p.rating}★)")
            if p.business:
                reason_parts.append(f"Crafted by {p.business.name}")
            
            match_reasons[str(p.id)] = " • ".join(reason_parts) if reason_parts else f"Strong semantic match ({score:.2f})"

        explanation = (
            f"Retrieved {len(products)} products matched to '{query}'."
            if products
            else f"No products matching '{query}' were found within budget constraints."
        )

        return AISearchResponse(
            query=query,
            explanation=explanation,
            products=products,
            match_reasons=match_reasons,
        )

    @classmethod
    async def shopping_assistant(
        cls,
        db: AsyncSession,
        payload: AIAssistantRequest,
    ) -> AIAssistantResponse:
        ai_provider = get_ai_provider()
        user_query = payload.query.strip()

        # 1. Grounded retrieval: fetch top matching products from DB
        search_res = await cls.semantic_search(db, query=user_query, limit=5)
        matched_products = search_res.products
        match_reasons = search_res.match_reasons

        # 2. Build strict grounding context
        if not matched_products:
            message = (
                f"I searched our marketplace catalog for '{user_query}', but unfortunately no matching products "
                f"meet your criteria or budget. You might try adjusting your price filter or browsing our category list."
            )
            return AIAssistantResponse(
                message=message,
                products=[],
                match_reasons={},
                suggested_followups=[
                    "Show me trending products",
                    "Browse all categories",
                    "What are your top-rated items?",
                ],
            )

        context_items = []
        for p in matched_products:
            merchant_name = p.business.name if p.business else "Verified Merchant"
            context_items.append(
                f"- [Product ID: {p.id}] {p.name} | ${p.price:.2f} | Rating: {p.rating}★ | Merchant: {merchant_name}\n"
                f"  Specs: {p.description[:180]}..."
            )
        context_str = "\n".join(context_items)

        system_prompt = (
            "You are Zentro's AI Shopping Assistant, a knowledgeable, concise, and helpful commerce guide. "
            "CRITICAL RULE: You MUST strictly recommend ONLY the products listed in the Context below. "
            "NEVER invent, hallucinate, or recommend external brands, products, or fake prices. "
            "Direct the customer to the specific matched products and explain why each matches their use case.\n\n"
            f"Context Products from Catalog:\n{context_str}"
        )

        messages = [{"role": "system", "content": system_prompt}]
        for msg in payload.history[-4:]:  # last 4 turns
            messages.append({"role": msg.role, "content": msg.content})
        messages.append({"role": "user", "content": user_query})

        # 3. Generate response from LLM / Mock provider
        try:
            llm_text = await ai_provider.chat_completion(messages, max_tokens=500, temperature=0.2)
        except Exception:
            # Fallback if external API fails
            llm_text = (
                f"I found {len(matched_products)} verified options in our catalog that match your request. "
                f"Review the options below to compare prices, ratings, and merchant specifications."
            )

        suggested_followups = [
            f"Compare specifications for these options",
            "Show me accessories for this",
            "Find products under $100",
        ]

        return AIAssistantResponse(
            message=llm_text,
            products=matched_products,
            match_reasons=match_reasons,
            suggested_followups=suggested_followups,
        )
