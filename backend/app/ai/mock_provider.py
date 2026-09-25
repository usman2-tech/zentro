from typing import List
from app.ai.base import BaseAIProvider
from app.db.seed.data import generate_deterministic_embedding


class MockAIProvider(BaseAIProvider):
    """
    Offline/deterministic AI provider for test suites and environments
    where an external LLM API key is not configured.
    Generates genuine normalized 1536-dim vectors and grounded conversational text.
    """

    async def generate_embedding(self, text: str) -> List[float]:
        # Use first word or general category cluster
        words = text.lower().split()
        category_hint = "audio-wearables"
        if any(w in text.lower() for w in ["desk", "chair", "keyboard", "monitor", "office", "laptop"]):
            category_hint = "workspace-tech"
        elif any(w in text.lower() for w in ["run", "gym", "workout", "fitness", "tights", "shoe", "dumbbell"]):
            category_hint = "fitness-activewear"
        elif any(w in text.lower() for w in ["coffee", "grinder", "kettle", "knife", "espresso", "skillet"]):
            category_hint = "specialty-coffee-kitchen"
        elif any(w in text.lower() for w in ["backpack", "sling", "bag", "duffel", "wallet"]):
            category_hint = "bags-commute"
        elif any(w in text.lower() for w in ["lamp", "light", "air", "purifier", "diffuser", "home"]):
            category_hint = "smart-living"
        elif any(w in text.lower() for w in ["camp", "tent", "stove", "hike", "outdoor"]):
            category_hint = "outdoors-expedition"
        elif any(w in text.lower() for w in ["skin", "serum", "oil", "face", "sleep", "wellness"]):
            category_hint = "wellness-grooming"

        return generate_deterministic_embedding(text, category_hint, dim=1536)

    async def chat_completion(
        self,
        messages: List[dict],
        max_tokens: int = 600,
        temperature: float = 0.2,
    ) -> str:
        last_message = messages[-1]["content"] if messages else ""
        return (
            f"Based on your requirements, I analyzed the verified products in our catalog. "
            f"I found the best matches that balance your budget, technical specifications, and customer ratings. "
            f"You can explore the interactive product cards below to view complete details or add them directly to your cart."
        )
