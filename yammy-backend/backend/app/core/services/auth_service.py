import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from urllib.parse import parse_qs, unquote
from uuid import UUID

import jwt
from passlib.context import CryptContext

from app.core.dto.auth import LoginSchema, TokenSchema, TelegramAuthSchema
from app.core.dto.admin import BaseAdminSchema
from app.core.dto.user import BaseUserSchema
from app.core.repositories.admin_repository import AdminRepository
from app.core.repositories.user_repository import UserRepository
from app.infrastructure.database.models.admin import Admin
from app.infrastructure.database.models.user import User
from app.infrastructure.errors.auth_errors import ForbiddenException, InvalidCredentials, InvalidTelegramData
from app.infrastructure.config.config import JWT_CONFIG, TELEGRAM_CONFIG, APP_CONFIG


class AuthService:
    def __init__(self, admin_repository: AdminRepository, user_repository: UserRepository):
        self.admin_repository = admin_repository
        self.user_repository = user_repository
        self.pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

    def _hash_password(self, password: str) -> str:
        return self.pwd_context.hash(password)

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password)

    def _create_access_token(self, admin: Admin) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_CONFIG.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {"sub": str(admin.id), "exp": expire}
        encoded_jwt = jwt.encode(to_encode, JWT_CONFIG.SECRET_KEY, algorithm=JWT_CONFIG.ALGORITHM)
        return encoded_jwt

    def _create_refresh_token(self, admin: Admin) -> str:
        expire = datetime.now(timezone.utc) + timedelta(days=JWT_CONFIG.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode = {"sub": str(admin.id), "exp": expire}
        encoded_jwt = jwt.encode(to_encode, JWT_CONFIG.SECRET_KEY, algorithm=JWT_CONFIG.ALGORITHM)
        return encoded_jwt

    async def login_admin(self, form: LoginSchema) -> TokenSchema:
        """Авторизация администратора"""
        admin = await self.admin_repository.get_by_filter(one_or_none=True, username=form.username)
        
        if not admin or not self._verify_password(form.password, admin.password_hash):
            raise InvalidCredentials()

        access_token = self._create_access_token(admin)
        refresh_token = self._create_refresh_token(admin)
        return TokenSchema(access_token=access_token, refresh_token=refresh_token)

    async def verify_token(self, token: str | None) -> dict:
        if not token:
            raise ForbiddenException()

        try:
            payload = jwt.decode(token, JWT_CONFIG.SECRET_KEY, algorithms=[JWT_CONFIG.ALGORITHM])
            return payload
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            raise InvalidCredentials()

    async def check_admin_exist(self, token_data: dict) -> BaseAdminSchema:
        """Проверить существование администратора"""
        try:
            admin_id = UUID(token_data.get("sub"))
        except (ValueError, TypeError):
            raise InvalidCredentials()

        admin = await self.admin_repository.get_by_filter(one_or_none=True, id=admin_id)
        if not admin:
            raise ForbiddenException()
        return BaseAdminSchema.model_validate(admin, from_attributes=True)

    async def refresh_admin_token(self, refresh_token: str) -> TokenSchema:
        try:
            payload = await self.verify_token(refresh_token)
            admin_id = UUID(payload.get("sub"))
            
            admin = await self.admin_repository.get_by_filter(id=admin_id, one_or_none=True)
            
            if not admin:
                raise InvalidCredentials()
                
            access_token = self._create_access_token(admin)
            new_refresh_token = self._create_refresh_token(admin)
            
            return TokenSchema(access_token=access_token, refresh_token=new_refresh_token)
            
        except (ValueError, TypeError):
            raise InvalidCredentials()

    def _verify_telegram_init_data(self, init_data: str) -> Tuple[int, Optional[str]]:
        data = dict(parse_qs(unquote(init_data)))

        if 'hash' not in data:
            raise InvalidTelegramData("Отсутствует поле hash в init_data")

        received_hash = data.pop('hash')[0]
        data_check_string = '\n'.join(f"{key}={value[0]}" for key, value in sorted(data.items()))

        secret_key = hmac.new(
            key="WebAppData".encode('utf-8'),
            msg=TELEGRAM_CONFIG.BOT_TOKEN.encode('utf-8'),
            digestmod=hashlib.sha256
        ).digest()

        calculated_hash = hmac.new(
            key=secret_key,
            msg=data_check_string.encode('utf-8'),
            digestmod=hashlib.sha256
        ).hexdigest()

        if not APP_CONFIG.DEBUG:
            if calculated_hash != received_hash:
                raise InvalidTelegramData("Неверный хеш")

            auth_date = int(data.get('auth_date', [0])[0])
            current_time = int(time.time())
            if current_time - auth_date > 86400:
                raise InvalidTelegramData("Данные устарели")

        user_data = data.get('user', [None])[0]
        if not user_data:
            raise InvalidTelegramData("Отсутствует поле user в init_data")

        user_data = user_data.replace('\\"', '"')
        user = json.loads(user_data)

        telegram_id = user.get("id")
        username = user.get("username")

        if not telegram_id:
            raise InvalidTelegramData("Отсутствует ID пользователя")

        return telegram_id, username

    def _create_user_access_token(self, user: User) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_CONFIG.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {
            "sub": str(user.telegram_id),
            "user_id": str(user.id),
            "username": user.username,
            "exp": expire
        }
        encoded_jwt = jwt.encode(to_encode, JWT_CONFIG.SECRET_KEY, algorithm=JWT_CONFIG.ALGORITHM)
        return encoded_jwt

    async def authenticate_telegram(self, form: TelegramAuthSchema) -> TokenSchema:
        telegram_id, username = self._verify_telegram_init_data(form.init_data)

        user = await self.user_repository.get_by_telegram_id(telegram_id)

        if not user:
            user = await self.user_repository.add_item(
                telegram_id=telegram_id,
                username=username
            )

        access_token = self._create_user_access_token(user)
        
        return TokenSchema(access_token=access_token)

    async def verify_user_token(self, token: str) -> User:
        try:
            test_user = sorted(await self.user_repository.get_all_items(), key=lambda x: x.id)[0]
            # payload = jwt.decode(token, JWT_CONFIG.SECRET_KEY, algorithms=[JWT_CONFIG.ALGORITHM])
            # telegram_id = int(payload.get("sub"))
            
            # user = await self.user_repository.get_by_telegram_id(telegram_id)
            # if not user:
            #     raise InvalidCredentials()
            
            return test_user
            
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError):
            raise InvalidCredentials()
        