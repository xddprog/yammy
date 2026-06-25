from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.support_bot import callbacks as cb


def main_menu_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Создать тикет", callback_data=cb.MENU_CREATE)],
            [InlineKeyboardButton(text="Мои тикеты", callback_data=cb.MENU_TICKETS)],
            [InlineKeyboardButton(text="Нашел баг", callback_data=cb.MENU_BUG)],
        ]
    )


def request_type_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="У меня предложение", callback_data=cb.TYPE_SUGGESTION)],
            [InlineKeyboardButton(text="У меня проблема", callback_data=cb.TYPE_PROBLEM)],
            [InlineKeyboardButton(text="Я нашел баг", callback_data=cb.TYPE_BUG)],
            [InlineKeyboardButton(text="Назад", callback_data=cb.NAV_BACK)],
        ]
    )


def back_to_menu_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="Назад", callback_data=cb.NAV_BACK)]]
    )
