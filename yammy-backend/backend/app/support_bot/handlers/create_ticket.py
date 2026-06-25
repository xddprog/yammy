from aiogram import Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery

from app.support_bot import callbacks as cb
from app.support_bot.states import SupportStates
from app.support_bot.texts import DESCRIBE_BUG, DESCRIBE_QUESTION
from app.utils.constants.enums import SupportRequestTypeEnum


router = Router()

_TYPE_MAP = {
    cb.TYPE_SUGGESTION: SupportRequestTypeEnum.SUGGESTION,
    cb.TYPE_PROBLEM: SupportRequestTypeEnum.PROBLEM,
    cb.TYPE_BUG: SupportRequestTypeEnum.BUG,
}


async def _prompt_description(
    callback: CallbackQuery,
    state: FSMContext,
    request_type: SupportRequestTypeEnum,
) -> None:
    if callback.message is None:
        return
    await callback.answer()
    await state.set_state(SupportStates.waiting_description)
    await state.update_data(request_type=request_type.value)
    prompt = DESCRIBE_BUG if request_type == SupportRequestTypeEnum.BUG else DESCRIBE_QUESTION
    await callback.message.edit_text(prompt)


@router.callback_query(lambda c: c.data in _TYPE_MAP)
async def on_type_selected(callback: CallbackQuery, state: FSMContext) -> None:
    request_type = _TYPE_MAP[callback.data]
    await _prompt_description(callback, state, request_type)


@router.callback_query(lambda c: c.data == cb.MENU_BUG)
async def on_bug_shortcut(callback: CallbackQuery, state: FSMContext) -> None:
    await _prompt_description(callback, state, SupportRequestTypeEnum.BUG)
