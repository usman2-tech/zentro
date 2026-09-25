import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Float, ForeignKey, Integer, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, VectorType

if TYPE_CHECKING:
    from app.models.business import Business
    from app.models.category import Category
    from app.models.cart import CartItem
    from app.models.order import OrderItem
    from app.models.wishlist import Wishlist


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    business_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("businesses.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    stock_status: Mapped[str] = mapped_column(String(50), default="in_stock", nullable=False)  # in_stock, low_stock, out_of_stock
    image_url: Mapped[str] = mapped_column(String(512), nullable=False)
    rating: Mapped[float] = mapped_column(Float, default=4.5, nullable=False)
    embedding: Mapped[Optional[List[float]]] = mapped_column(VectorType(1536), nullable=True)

    # Relationships
    business: Mapped["Business"] = relationship("Business", back_populates="products")
    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="products")
    cart_items: Mapped[List["CartItem"]] = relationship("CartItem", back_populates="product", cascade="all, delete-orphan")
    order_items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="product")
    wishlists: Mapped[List["Wishlist"]] = relationship("Wishlist", back_populates="product", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Product {self.name} - ${self.price}>"
