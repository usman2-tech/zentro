from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.user import UserResponse


class Token(BaseModel):
    access_token: str = Field(..., description="JWT Bearer access token")
    token_type: str = Field(default="bearer", description="Token type")
    user: UserResponse = Field(..., description="Authenticated user profile")


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
