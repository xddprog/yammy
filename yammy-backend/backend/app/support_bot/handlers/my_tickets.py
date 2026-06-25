from aiogram import Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery

from app.support_bot import callbacks as cb
from app.support_bot.handlers.start import show_main_menu
from app.support_bot.keyboards import back_to_menu_keyboard
from app.support_bot.texts import REQUEST_TYPE_LABELS, STATUS_LABELS, TICKETS_EMPTY, TICKETS_HEADER
from app.core.services.support_service import SupportService


router = Router()


@router.callback_query(lambda c: c.data == cb.MENU_TICKETS)
async def on_my_tickets(
    callback: CallbackQuery,
    support_service: SupportService,
    state: FSMContext,
) -> None:
    if callback.message is None or callback.from_user is None:
        return
    await callback.answer()
    await state.clear()

    tickets = await support_service.list_user_tickets(callback.from_user.id)
    if not tickets:
        await callback.message.edit_text(TICKETS_EMPTY, reply_markup=back_to_menu_keyboard())
        return

    lines = [TICKETS_HEADER, ""]
    for ticket in tickets:
        ticket_id = str(ticket.id)[:8]
        type_label = REQUEST_TYPE_LABELS.get(ticket.request_type.value, ticket.request_type.value)
        status_label = STATUS_LABELS.get(ticket.status.value, ticket.status.value)
        preview = ""
        if ticket.messages:
            preview = ticket.messages[-1].content[:80]
        elif ticket.last_message_at:
            preview = "..."
        lines.append(f"• <code>{ticket_id}</code> — {type_label} ({status_label})")
        if preview:
            lines.append(f"  {preview}")

    await callback.message.edit_text("\n".join(lines), reply_markup=back_to_menu_keyboard())
