from typing import List
from openai import AsyncOpenAI
from app.ai.base import BaseAIProvider
from app.core.config import settings


class OpenAIProvider(BaseAIProvider):
    def __init__(self) -> None:
        self.client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL,
        )
        self.embedding_model = settings.AI_EMBEDDING_MODEL
        self.chat_model = settings.AI_CHAT_MODEL

    async def generate_embedding(self, text: str) -> List[float]:
        clean_text = text.replace("\n", " ").strip()
        response = await self.client.embeddings.create(
            input=[clean_text],
            model=self.embedding_model,
        )
        return response.data[0].embedding

    async def chat_completion(
        self,
        messages: List[dict],
        max_tokens: int = 600,
        temperature: float = 0.2,
    ) -> str:
        response = await self.client.chat.completions.create(
            model=self.chat_model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content or ""
