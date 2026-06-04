from sqlalchemy import ForeignKey, Enum as SQLAlchemyEnum, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.infrastructure.database.models.base import Base
from app.utils.constants.enums import LikeTypeEnum
import uuid

class Like(Base):
    __tablename__ = "likes"

    user_from_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    user_to_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    
    like_type: Mapped[LikeTypeEnum] = mapped_column(SQLAlchemyEnum(LikeTypeEnum))
    message: Mapped[str | None] = mapped_column(nullable=True)
    __table_args__ = (UniqueConstraint('user_from_id', 'user_to_id', name='unique_like_pair'),)