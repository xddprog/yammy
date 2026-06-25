import uuid
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import Base
from app.infrastructure.database.pg_enum import pg_enum
from app.utils.constants.enums import (
    SupportAttachmentTypeEnum,
    SupportMessageDirectionEnum,
)

if TYPE_CHECKING:
    from app.infrastructure.database.models.support_conversation import SupportConversation


class SupportMessage(Base):
    __tablename__ = "support_messages"
    __table_args__ = (
        UniqueConstraint("telegram_message_id", name="uq_support_messages_telegram_message_id"),
    )

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("support_conversations.id", ondelete="CASCADE"),
        index=True,
    )
    direction: Mapped[SupportMessageDirectionEnum] = mapped_column(pg_enum(SupportMessageDirectionEnum))
    admin_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("admins.id"), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    telegram_message_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    attachment_type: Mapped[SupportAttachmentTypeEnum | None] = mapped_column(
        pg_enum(SupportAttachmentTypeEnum),
        nullable=True,
    )
    telegram_file_id: Mapped[str | None] = mapped_column(String(256), nullable=True)
    telegram_file_unique_id: Mapped[str | None] = mapped_column(String(256), nullable=True)

    conversation: Mapped["SupportConversation"] = relationship(
        "SupportConversation",
        back_populates="messages",
    )
