import uuid
from typing import TYPE_CHECKING, List
from sqlalchemy import Float, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.feed import FeedPost


class Business(Base, TimestampMixin):
    __tablename__ = "businesses"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    logo_url: Mapped[str] = mapped_column(String(512), nullable=False)
    banner_url: Mapped[str] = mapped_column(String(512), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    rating: Mapped[float] = mapped_column(Float, default=4.5, nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationships
    products: Mapped[List["Product"]] = relationship("Product", back_populates="business", cascade="all, delete-orphan")
    feed_posts: Mapped[List["FeedPost"]] = relationship("FeedPost", back_populates="business", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Business {self.name}>"
