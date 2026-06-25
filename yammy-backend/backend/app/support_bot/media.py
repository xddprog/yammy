from dataclasses import dataclass

from aiogram.types import Message

from app.utils.constants.enums import SupportAttachmentTypeEnum


@dataclass(frozen=True)
class IncomingUserMessage:
    content: str
    attachment_type: SupportAttachmentTypeEnum | None = None
    telegram_file_id: str | None = None
    telegram_file_unique_id: str | None = None


def parse_user_message(message: Message) -> IncomingUserMessage | None:
    if message.photo:
        photo = message.photo[-1]
        caption = (message.caption or "").strip()
        return IncomingUserMessage(
            content=caption or "📷 Фото",
            attachment_type=SupportAttachmentTypeEnum.PHOTO,
            telegram_file_id=photo.file_id,
            telegram_file_unique_id=photo.file_unique_id,
        )

    if message.document:
        doc = message.document
        caption = (message.caption or "").strip()
        file_name = doc.file_name or "Документ"
        return IncomingUserMessage(
            content=caption or f"📎 {file_name}",
            attachment_type=SupportAttachmentTypeEnum.DOCUMENT,
            telegram_file_id=doc.file_id,
            telegram_file_unique_id=doc.file_unique_id,
        )

    if message.text:
        return IncomingUserMessage(content=message.text.strip())

    return None
