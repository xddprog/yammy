from aiogram import Router
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from app.core.services.support_service import SupportService
from app.support_bot.handlers.start import show_main_menu
from app.support_bot.media import parse_user_message
from app.support_bot.states import SupportStates
from app.support_bot.texts import CREATE_TICKET_HINT, MEDIA_ONLY
from app.utils.constants.enums import SupportRequestTypeEnum


router = Router()


async def _save_user_message(
    support_service: SupportService,
    telegram_id: int,
    message: Message,
    *,
    create_ticket: SupportRequestTypeEnum | None = None,
) -> None:
    parsed = parse_user_message(message)
    if parsed is None:
        await message.answer(MEDIA_ONLY)
        return

    if create_ticket is not None:
        await support_service.create_ticket(
            telegram_id=telegram_id,
            request_type=create_ticket,
            content=parsed.content,
            telegram_message_id=message.message_id,
            attachment_type=parsed.attachment_type,
            telegram_file_id=parsed.telegram_file_id,
            telegram_file_unique_id=parsed.telegram_file_unique_id,
        )
        return

    conversation = await support_service.append_user_message(
        telegram_id=telegram_id,
        content=parsed.content,
        telegram_message_id=message.message_id,
        attachment_type=parsed.attachment_type,
        telegram_file_id=parsed.telegram_file_id,
        telegram_file_unique_id=parsed.telegram_file_unique_id,
    )
    if conversation is None:
        from app.support_bot.keyboards import main_menu_keyboard
        await message.answer(CREATE_TICKET_HINT, reply_markup=main_menu_keyboard())


@router.message(SupportStates.waiting_description)
async def on_ticket_description(
    message: Message,
    state: FSMContext,
    support_service: SupportService,
) -> None:
    if message.from_user is None:
        return

    data = await state.get_data()
    request_type_value = data.get("request_type", SupportRequestTypeEnum.PROBLEM.value)
    request_type = SupportRequestTypeEnum(request_type_value)

    await _save_user_message(
        support_service,
        message.from_user.id,
        message,
        create_ticket=request_type,
    )
    await state.clear()
    await show_main_menu(message, state)


@router.message()
async def on_free_text(
    message: Message,
    state: FSMContext,
    support_service: SupportService,
) -> None:
    if message.from_user is None:
        return

    current_state = await state.get_state()
    if current_state is not None:
        return

    await _save_user_message(support_service, message.from_user.id, message)
