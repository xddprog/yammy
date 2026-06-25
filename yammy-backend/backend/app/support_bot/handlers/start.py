from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message

from app.support_bot import callbacks as cb
from app.support_bot.keyboards import main_menu_keyboard, request_type_keyboard
from app.support_bot.texts import CHOOSE_TYPE, WELCOME


router = Router()


async def show_main_menu(message: Message, state: FSMContext) -> None:
    await state.clear()
    await message.answer(WELCOME, reply_markup=main_menu_keyboard())


@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext) -> None:
    await show_main_menu(message, state)


@router.callback_query(lambda c: c.data == cb.NAV_BACK)
async def on_back(callback: CallbackQuery, state: FSMContext) -> None:
    if callback.message is None:
        return
    await callback.answer()
    await show_main_menu(callback.message, state)


@router.callback_query(lambda c: c.data == cb.MENU_CREATE)
async def on_create_ticket(callback: CallbackQuery, state: FSMContext) -> None:
    if callback.message is None:
        return
    await callback.answer()
    await state.clear()
    await callback.message.edit_text(CHOOSE_TYPE, reply_markup=request_type_keyboard())
