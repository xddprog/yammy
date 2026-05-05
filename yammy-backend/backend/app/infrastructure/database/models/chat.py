from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.infrastructure.database.models.base import Base
import uuid
from datetime import datetime


if TYPE_CHECKING:
    from app.infrastructure.database.models.match import Match
    from app.infrastructure.database.models.message import Message

class Chat(Base):
    __tablename__ = "chats"

    match_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("matches.id", ondelete="CASCADE"), unique=True)
    
    match: Mapped["Match"] = relationship("Match", back_populates="chat")
    messages: Mapped[list["Message"]] = relationship("Message", back_populates="chat", lazy="selectin")
