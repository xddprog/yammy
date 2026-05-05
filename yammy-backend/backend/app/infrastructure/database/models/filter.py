import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.infrastructure.database.models.base import Base

class FilterCategory(Base):
    __tablename__ = "filter_categories"

    slug: Mapped[str] = mapped_column(unique=True, index=True)
    name: Mapped[str]
    
    subcategories: Mapped[list["FilterSubcategory"]] = relationship(
        back_populates="category", 
        cascade="all, delete-orphan"
    )

class FilterSubcategory(Base):
    __tablename__ = "filter_subcategories"

    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("filter_categories.id"))
    
    slug: Mapped[str]
    name: Mapped[str]
    
    category: Mapped["FilterCategory"] = relationship(back_populates="subcategories")
    options: Mapped[list["FilterOption"]] = relationship(
        back_populates="subcategory", cascade="all, delete-orphan"
    )


class FilterOption(Base):
    __tablename__ = "filter_options"

    subcategory_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("filter_subcategories.id"))
    
    slug: Mapped[str]
    name: Mapped[str]

    subcategory: Mapped["FilterSubcategory"] = relationship(back_populates="options")


class UserFilterAssociation(Base):
    __tablename__ = "user_filters"
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    option_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("filter_options.id"), primary_key=True)