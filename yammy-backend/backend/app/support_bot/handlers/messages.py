from aiogram import Router
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from app.core.services.support_service import SupportService
from app.support_bot.handlers.start import show_main_menu
from app.support_bot.states import SupportStates
from app.support_bot.texts import CREATE_TICKET_HINT, MEDIA_ONLY
from app.utils.constants.enums import SupportRequestTypeEnum


router = Router()


@router.message(SupportStates.waiting_description)
async def on_ticket_description(
    message: Message,
    state: FSMContext,
    support_service: SupportService,
) -> None:
    if message.from_user is None or not message.text:
        await message.answer(MEDIA_ONLY)
        return

    data = await state.get_data()
    request_type_value = data.get("request_type", SupportRequestTypeEnum.PROBLEM.value)
    request_type = SupportRequestTypeEnum(request_type_value)

    await support_service.create_ticket(
        telegram_id=message.from_user.id,
        request_type=request_type,
        content=message.text.strip(),
        telegram_message_id=message.message_id,
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

    if not message.text:
        await message.answer(MEDIA_ONLY)
        return

    current_state = await state.get_state()
    if current_state is not None:
        return

    conversation = await support_service.append_user_message(
        telegram_id=message.from_user.id,
        content=message.text.strip(),
        telegram_message_id=message.message_id,
    )
    if conversation is None:
        from app.support_bot.keyboards import main_menu_keyboard
        await message.answer(CREATE_TICKET_HINT, reply_markup=main_menu_keyboard())
        return
