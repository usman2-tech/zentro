"""
Auth Router — /auth and /users endpoints.
Handles registration, login, and profile retrieval.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import Token
from app.schemas.user import UserLogin, UserRegister, UserResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post(
    "/auth/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer account",
    description=(
        "Creates a new customer account with the provided name, email, and password. "
        "Returns a JWT access token and the user profile on success. "
        "Passwords are bcrypt-hashed and never stored in plain text."
    ),
    tags=["Authentication"],
)
async def register(
    payload: UserRegister,
    db: AsyncSession = Depends(get_db),
) -> Token:
    return await AuthService.register(db=db, payload=payload)


@router.post(
    "/auth/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="Authenticate and obtain a JWT token",
    description=(
        "Authenticates a customer with their email and password. "
        "Returns a JWT Bearer token for use in the Authorization header on subsequent requests. "
        "Consistent error messages are returned for invalid credentials to prevent user enumeration."
    ),
    tags=["Authentication"],
)
async def login(
    payload: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> Token:
    return await AuthService.login(db=db, email=payload.email, password=payload.password)


@router.get(
    "/users/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get the authenticated user's profile",
    description=(
        "Returns the profile of the currently authenticated user. "
        "Requires a valid JWT Bearer token in the Authorization header."
    ),
    tags=["Users"],
)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user),
) -> UserResponse:
    return UserResponse.model_validate(current_user)
