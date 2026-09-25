"""
Authentication and user account service layer.
Handles registration, login, and password operations.
"""
from datetime import timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import BadRequestException, ConflictException, UnauthorizedException
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.auth import Token
from app.schemas.user import UserRegister, UserResponse


class AuthService:
    @staticmethod
    async def register(db: AsyncSession, payload: UserRegister) -> Token:
        # Check for duplicate email (case-insensitive)
        existing = await UserRepository.get_by_email(db, payload.email)
        if existing:
            raise ConflictException(
                message="An account with this email address already exists.",
                details={"email": payload.email},
            )

        # Validate password strength
        if len(payload.password) < 8:
            raise BadRequestException(
                message="Password must be at least 8 characters long."
            )

        password_hash = get_password_hash(payload.password)
        user = await UserRepository.create(
            db=db,
            name=payload.name,
            email=payload.email,
            password_hash=password_hash,
        )

        token = create_access_token(
            subject=str(user.id),
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )

        return Token(
            access_token=token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        )

    @staticmethod
    async def login(db: AsyncSession, email: str, password: str) -> Token:
        user = await UserRepository.get_by_email(db, email)

        # Use consistent error to avoid user enumeration
        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedException(
                message="Incorrect email or password.",
            )

        if not user.is_active:
            raise UnauthorizedException(
                message="This account has been deactivated. Please contact support."
            )

        token = create_access_token(
            subject=str(user.id),
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )

        return Token(
            access_token=token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        )

    @staticmethod
    async def get_current_user_profile(user: User) -> UserResponse:
        return UserResponse.model_validate(user)
