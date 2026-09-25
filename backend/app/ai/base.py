from abc import ABC, abstractmethod
from typing import List


class BaseAIProvider(ABC):
    @abstractmethod
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate a 1536-dimensional embedding vector for input text."""
        pass

    @abstractmethod
    async def chat_completion(
        self,
        messages: List[dict],
        max_tokens: int = 600,
        temperature: float = 0.2,
    ) -> str:
        """Generate conversational chat response."""
        pass
