from app.ai.base import BaseAIProvider
from app.ai.mock_provider import MockAIProvider
from app.ai.openai_provider import OpenAIProvider
from app.core.config import settings


def get_ai_provider() -> BaseAIProvider:
    if settings.AI_PROVIDER != "mock" and settings.OPENAI_API_KEY:
        try:
            return OpenAIProvider()
        except Exception:
            return MockAIProvider()
    return MockAIProvider()
