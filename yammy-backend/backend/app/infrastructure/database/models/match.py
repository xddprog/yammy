from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.infrastructure.database.models.base import Base
import uuid


if TYPE_CHECKING:
    from app.infrastructure.database.models.chat import Chat


class Match(Base):
    __tablename__ = "matches"

    user1_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    user2_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    
    chat: Mapped["Chat"] = relationship("Chat", back_populates="match", uselist=False, lazy="selectin")

    __table_args__ = (UniqueConstraint('user1_id', 'user2_id', name='unique_match_pair'),)