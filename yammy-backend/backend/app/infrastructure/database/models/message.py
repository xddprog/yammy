from typing import TYPE_CHECKING
from sqlalchemy import UUID, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.infrastructure.database.models.base import Base
import uuid


if TYPE_CHECKING:
    from app.infrastructure.database.models.chat import Chat
    from app.infrastructure.database.models.user import User


class MessagePhoto(Base):
    __tablename__ = "message_photos"
    message_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("messages.id", ondelete="CASCADE"))
    file_path: Mapped[str]
    order: Mapped[int] = mapped_column(default=0)
    message: Mapped["Message"] = relationship(back_populates="images")


class Message(Base):
    __tablename__ = "messages"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    chat_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("chats.id", ondelete="CASCADE"))
    sender_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    content: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(default=False)
    is_edited: Mapped[bool] = mapped_column(default=False)
    is_deleted: Mapped[bool] = mapped_column(default=False)

    reply_to_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("messages.id"), nullable=True)
    reply_to: Mapped["Message"] = relationship(remote_side=[id])

    images: Mapped[list["MessagePhoto"]] = relationship(back_populates="message", cascade="all, delete-orphan")
    chat: Mapped["Chat"] = relationship("Chat", back_populates="messages")
    sender: Mapped["User"] = relationship()