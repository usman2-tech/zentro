import uuid
from typing import TYPE_CHECKING, List
from sqlalchemy import Boolean, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.cart import Cart
    from app.models.order import Order
    from app.models.wishlist import Wishlist
    from app.models.user_event import UserEvent


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    cart: Mapped["Cart"] = relationship("Cart", back_populates="user", uselist=False, cascade="all, delete-orphan")
    orders: Mapped[List["Order"]] = relationship("Order", back_populates="user")
    wishlist_items: Mapped[List["Wishlist"]] = relationship("Wishlist", back_populates="user", cascade="all, delete-orphan")
    events: Mapped[List["UserEvent"]] = relationship("UserEvent", back_populates="user")

    def __repr__(self) -> str:
        return f"<User {self.email}>"
