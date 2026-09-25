from typing import Dict
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", description="Overall system health status")
    environment: str = Field(default="development", description="Current execution environment")
    version: str = Field(default="0.1.0", description="API version")
    database: str = Field(default="connected", description="Database connection health")
    services: Dict[str, str] = Field(
        default_factory=lambda: {"database": "ok", "vector_engine": "ready", "ai_provider": "active"},
        description="Subsystem status indicators",
    )
