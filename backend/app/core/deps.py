"""
FastAPI dependency injection providers for authentication and authorization.

Provides:
  - get_current_user:          Requires a valid JWT. Raises 401 if missing/invalid.
  - get_current_active_user:   As above, plus requires is_active=True.
  - get_optional_user:         Returns the authenticated user OR None (guest-friendly routes).
"""
import uuid
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import UnauthorizedException
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repo import UserRepository

# HTTPBearer does NOT auto-error on missing header — we handle it manually
# so we can support optional-auth routes cleanly.
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Strict authentication dependency.
    Decodes and validates the JWT Bearer token from the Authorization header.
    Raises HTTP 401 Unauthorized for missing, expired, or tampered tokens.
    """
    if not credentials or not credentials.credentials:
        raise UnauthorizedException(
            message="Authentication required. Please log in to continue.",
        )

    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise UnauthorizedException(
            message="Invalid or expired authentication token.",
        )

    user_id_str: Optional[str] = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedException(message="Malformed authentication token.")

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise UnauthorizedException(message="Malformed authentication token.")

    user = await UserRepository.get_by_id(db, user_id)
    if not user:
        raise UnauthorizedException(
            message="The account associated with this token no longer exists.",
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Extends get_current_user by also ensuring the account is active.
    """
    if not current_user.is_active:
        raise UnauthorizedException(
            message="This account has been deactivated.",
        )
    return current_user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    Optional authentication dependency for guest-accessible routes.
    Returns the authenticated User if a valid token is present, otherwise None.
    Never raises an error for missing credentials.
    """
    if not credentials or not credentials.credentials:
        return None

    payload = decode_access_token(credentials.credentials)
    if not payload:
        return None

    user_id_str: Optional[str] = payload.get("sub")
    if not user_id_str:
        return None

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        return None

    return await UserRepository.get_by_id(db, user_id)
