from pydantic import BaseModel, Field
from typing import Optional


class TelegramAuthSchema(BaseModel):
    init_data: str = Field(..., description="Данные инициализации из Telegram WebApp")


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RefreshTokenSchema(BaseModel):
    refresh_token: str


class LoginSchema(BaseModel):
    username: str
    password: str
