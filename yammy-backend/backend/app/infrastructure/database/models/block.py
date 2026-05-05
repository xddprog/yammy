from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.infrastructure.database.models.base import Base
import uuid


class Block(Base):
    __tablename__ = "blocks"

    blocker_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    blocked_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)