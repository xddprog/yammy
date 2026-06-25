from datetime import datetime
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.base import Base
from app.infrastructure.database.pg_enum import pg_enum
from app.utils.constants.enums import SupportConversationStatusEnum, SupportRequestTypeEnum

if TYPE_CHECKING:
    from app.infrastructure.database.models.support_message import SupportMessage


class SupportConversation(Base):
    __tablename__ = "support_conversations"

    telegram_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    request_type: Mapped[SupportRequestTypeEnum] = mapped_column(pg_enum(SupportRequestTypeEnum))
    status: Mapped[SupportConversationStatusEnum] = mapped_column(
        pg_enum(SupportConversationStatusEnum),
        default=SupportConversationStatusEnum.OPEN,
        server_default=SupportConversationStatusEnum.OPEN.value,
    )
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    messages: Mapped[list["SupportMessage"]] = relationship(
        "SupportMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="SupportMessage.created_at",
    )
