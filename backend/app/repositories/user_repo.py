import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.cart import Cart


class UserRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email.lower().strip())
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, name: str, email: str, password_hash: str) -> User:
        user = User(
            id=uuid.uuid4(),
            name=name.strip(),
            email=email.lower().strip(),
            password_hash=password_hash,
            is_active=True,
        )
        db.add(user)
        await db.flush()

        # Initialize active cart for new user
        cart = Cart(user_id=user.id)
        db.add(cart)
        await db.flush()

        return user

    @staticmethod
    async def save(db: AsyncSession, user: User) -> User:
        db.add(user)
        await db.flush()
        return user
