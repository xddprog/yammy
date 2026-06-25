import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from urllib.parse import parse_qsl
from uuid import UUID

import jwt
from passlib.context import CryptContext

from app.core.dto.auth import (
    DevAuthSwitchResponseSchema,
    DevAuthUserItemSchema,
    DevAuthUsersListSchema,
    LoginSchema,
    TokenSchema,
    TelegramAuthSchema,
)
from app.core.dto.admin import AdminSchema
from app.core.repositories.admin_repository import AdminRepository
from app.core.repositories.user_repository import UserRepository
from app.infrastructure.database.models.admin import Admin
from app.infrastructure.database.models.user import User
from app.infrastructure.errors.auth_errors import ForbiddenException, InvalidCredentials, InvalidTelegramData
from app.infrastructure.errors.base import ConflictException, NotFoundException
from app.infrastructure.config.config import APP_CONFIG, JWT_CONFIG, TELEGRAM_CONFIG


class AuthService:
    def __init__(self, admin_repository: AdminRepository, user_repository: UserRepository):
        self.admin_repository = admin_repository
        self.user_repository = user_repository
        self.pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

    def _hash_password(self, password: str) -> str:
        return self.pwd_context.hash(password)

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password)

    def _encode_token(self, sub: str, expire: datetime, scope: str) -> str:
        to_encode = {"sub": sub, "exp": expire, "scope": scope}
        return jwt.encode(to_encode, JWT_CONFIG.SECRET_KEY, algorithm=JWT_CONFIG.ALGORITHM)

    def create_staff_access_token(self, sub: str, role: str) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_CONFIG.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {
            "sub": sub,
            "exp": expire,
            "scope": JWT_CONFIG.SCOPE_STAFF,
            "role": role,
        }
        return jwt.encode(to_encode, JWT_CONFIG.SECRET_KEY, algorithm=JWT_CONFIG.ALGORITHM)

    def create_staff_refresh_token(self, sub: str, role: str) -> str:
        expire = datetime.now(timezone.utc) + timedelta(days=JWT_CONFIG.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode = {
            "sub": sub,
            "exp": expire,
            "scope": JWT_CONFIG.SCOPE_STAFF,
            "role": role,
        }
        return jwt.encode(to_encode, JWT_CONFIG.SECRET_KEY, algorithm=JWT_CONFIG.ALGORITHM)

    def create_access_token(self, sub: str) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_CONFIG.ACCESS_TOKEN_EXPIRE_MINUTES)
        return self._encode_token(sub, expire, JWT_CONFIG.SCOPE_USER)

    def create_refresh_token(self, sub: str) -> str:
        expire = datetime.now(timezone.utc) + timedelta(days=JWT_CONFIG.REFRESH_TOKEN_EXPIRE_DAYS)
        return self._encode_token(sub, expire, JWT_CONFIG.SCOPE_USER)

    def _create_onboarding_access_token(self, telegram_id: int) -> str:
        expire = datetime.now(timezone.utc) + timedelta(
            hours=JWT_CONFIG.ONBOARDING_ACCESS_TOKEN_EXPIRE_HOURS
        )
        return self._encode_token(str(telegram_id), expire, JWT_CONFIG.SCOPE_ONBOARDING)

    async def login_admin(self, form: LoginSchema) -> TokenSchema:
        admin = await self.admin_repository.get_by_filter(one_or_none=True, username=form.username)
        
        if not admin or not self._verify_password(form.password, admin.password_hash):
            raise InvalidCredentials()

        access_token = self.create_staff_access_token(str(admin.id), admin.role.value)
        refresh_token = self.create_staff_refresh_token(str(admin.id), admin.role.value)
        return TokenSchema(access_token=access_token, refresh_token=refresh_token)

    async def verify_staff_token(self, token: str) -> AdminSchema:
        payload = await self.verify_token(token)
        if payload.get("scope") != JWT_CONFIG.SCOPE_STAFF:
            raise InvalidCredentials()
        return await self.check_admin_exist(payload)

    async def verify_token(self, token: str | None) -> dict:
        if not token:
            raise ForbiddenException()

        try:
            payload = jwt.decode(token, JWT_CONFIG.SECRET_KEY, algorithms=[JWT_CONFIG.ALGORITHM])
            return payload
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            raise InvalidCredentials()

    async def check_admin_exist(self, token_data: dict) -> AdminSchema:
        try:
            admin_id = UUID(token_data.get("sub"))
        except (ValueError, TypeError):
            raise InvalidCredentials()

        admin = await self.admin_repository.get_by_filter(one_or_none=True, id=admin_id)
        if not admin:
            raise ForbiddenException()
        return AdminSchema.model_validate(admin, from_attributes=True)

    async def refresh_admin_token(self, refresh_token: str) -> TokenSchema:
        try:
            payload = await self.verify_token(refresh_token)
            if payload.get("scope") != JWT_CONFIG.SCOPE_STAFF:
                raise InvalidCredentials()
            admin_id = UUID(payload.get("sub"))

            admin = await self.admin_repository.get_by_filter(id=admin_id, one_or_none=True)

            if not admin:
                raise InvalidCredentials()

            access_token = self.create_staff_access_token(str(admin.id), admin.role.value)
            new_refresh_token = self.create_staff_refresh_token(str(admin.id), admin.role.value)

            return TokenSchema(access_token=access_token, refresh_token=new_refresh_token)

        except (ValueError, TypeError):
            raise InvalidCredentials()

    async def refresh_user_token(self, refresh_token: str) -> TokenSchema:
        try:
            payload = await self.verify_token(refresh_token)
            if (payload.get("scope") or JWT_CONFIG.SCOPE_USER) != JWT_CONFIG.SCOPE_USER:
                raise InvalidCredentials()
            user_id = UUID(payload.get("sub"))

            user = await self.user_repository.get_by_filter(one_or_none=True, id=user_id)
            if not user:
                raise InvalidCredentials()

            access_token = self.create_access_token(str(user.id))
            new_refresh = self.create_refresh_token(str(user.id))
            return TokenSchema(access_token=access_token, refresh_token=new_refresh)

        except (ValueError, TypeError):
            raise InvalidCredentials()

    @staticmethod
    def _telegram_data_check_hash(fields: dict[str, str], bot_token: str) -> str:
        data = dict(fields)
        data.pop("hash", None)
        data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(data.items()))
        secret_key = hmac.new(
            key="WebAppData".encode("utf-8"),
            msg=bot_token.encode("utf-8"),
            digestmod=hashlib.sha256,
        ).digest()
        return hmac.new(
            key=secret_key,
            msg=data_check_string.encode("utf-8"),
            digestmod=hashlib.sha256,
        ).hexdigest()

    def _verify_telegram_init_data(self, init_data: str) -> Tuple[int, Optional[str]]:
        data = dict(parse_qsl(init_data.strip(), keep_blank_values=True))

        if "hash" not in data:
            raise InvalidTelegramData("Отсутствует поле hash в init_data")

        received_hash = data.pop("hash")
        bot_token = TELEGRAM_CONFIG.BOT_TOKEN.strip()
        calculated_hash = self._telegram_data_check_hash(
            {"hash": received_hash, **data},
            bot_token=bot_token,
        )

        if not APP_CONFIG.DEBUG and calculated_hash != received_hash:
            raise InvalidTelegramData("Неверный хеш")

        if not APP_CONFIG.DEBUG:
            auth_date = int(data.get("auth_date", 0))
            current_time = int(time.time())
            if current_time - auth_date > 86400:
                raise InvalidTelegramData("Данные устарели")

        user_data = data.get("user")
        if not user_data:
            raise InvalidTelegramData("Отсутствует поле user в init_data")

        user = json.loads(user_data)

        telegram_id = user.get("id")
        username = user.get("username")

        if not telegram_id:
            raise InvalidTelegramData("Отсутствует ID пользователя")

        return telegram_id, username

    async def _authenticate_telegram_stub(self) -> TokenSchema:
        telegram_id = TELEGRAM_CONFIG.DEV_STUB_TELEGRAM_ID
        user = await self.user_repository.get_by_telegram_id(telegram_id)
        if user:
            return TokenSchema(
                access_token=self.create_access_token(str(user.id)),
                refresh_token=self.create_refresh_token(str(user.id)),
            )
        return TokenSchema(
            access_token=self._create_onboarding_access_token(telegram_id),
            refresh_token=None,
        )

    async def _authenticate_telegram_webapp(self, form: TelegramAuthSchema) -> TokenSchema:
        telegram_id, _username = self._verify_telegram_init_data(form.init_data)

        user = await self.user_repository.get_by_telegram_id(telegram_id)
        if user:
            return TokenSchema(
                access_token=self.create_access_token(str(user.id)),
                refresh_token=self.create_refresh_token(str(user.id)),
            )

        return TokenSchema(
            access_token=self._create_onboarding_access_token(telegram_id),
            refresh_token=None,
        )

    async def verify_onboarding_telegram_id(self, token: str) -> int:
        payload = await self.verify_token(token)
        if (payload.get("scope") or JWT_CONFIG.SCOPE_USER) != JWT_CONFIG.SCOPE_ONBOARDING:
            raise InvalidCredentials()
        try:
            return int(payload.get("sub"))
        except (TypeError, ValueError):
            raise InvalidCredentials()

    async def authenticate_telegram(self, form: TelegramAuthSchema) -> TokenSchema:
        if APP_CONFIG.ENVIRONMENT == "development":
            return await self._authenticate_telegram_stub()
        return await self._authenticate_telegram_webapp(form)

    async def login_dev_onboarding(self, telegram_id: int) -> TokenSchema:
        if APP_CONFIG.ENVIRONMENT != "development":
            raise NotFoundException(detail="Not found")
        if await self.user_repository.get_by_telegram_id(telegram_id):
            raise ConflictException(
                detail="Пользователь с этим telegram_id уже есть — удали запись или укажи другой id"
            )
        return TokenSchema(
            access_token=self._create_onboarding_access_token(telegram_id),
            refresh_token=None,
        )

    async def login_dev_by_user_id(self, user_id: UUID) -> TokenSchema:
        user = await self.user_repository.get_by_filter(one_or_none=True, id=user_id)
        if not user:
            raise NotFoundException(detail="Пользователь не найден")
        return TokenSchema(
            access_token=self.create_access_token(str(user.id)),
            refresh_token=self.create_refresh_token(str(user.id)),
        )

    async def _get_sorted_dev_users(self, limit: int = 50) -> list[User]:
        users = await self.user_repository.get_all_items(limit=limit)
        return sorted(users, key=lambda user: user.id)

    async def list_dev_users(
        self,
        current_user_id: UUID | None = None,
        limit: int = 50,
    ) -> DevAuthUsersListSchema:
        users = await self._get_sorted_dev_users(limit=limit)
        return DevAuthUsersListSchema(
            users=[
                DevAuthUserItemSchema(
                    id=user.id,
                    name=user.name,
                    age=user.age,
                    is_current=current_user_id is not None and user.id == current_user_id,
                )
                for user in users
            ]
        )

    async def resolve_dev_switch_user_id(
        self,
        current_user_id: UUID | None,
        requested_user_id: UUID | None,
    ) -> UUID:
        users = await self._get_sorted_dev_users()
        if not users:
            raise InvalidCredentials(detail="В базе нет пользователей")

        if requested_user_id is not None:
            if not any(user.id == requested_user_id for user in users):
                raise NotFoundException(detail="Пользователь не найден")
            return requested_user_id

        if current_user_id is None:
            return users[0].id

        for user in users:
            if user.id != current_user_id:
                return user.id

        return users[0].id

    async def switch_dev_user(
        self,
        current_user_id: UUID | None,
        requested_user_id: UUID | None,
    ) -> DevAuthSwitchResponseSchema:
        target_user_id = await self.resolve_dev_switch_user_id(
            current_user_id,
            requested_user_id,
        )
        user = await self.user_repository.get_by_filter(one_or_none=True, id=target_user_id)
        if not user:
            raise NotFoundException(detail="Пользователь не найден")

        return DevAuthSwitchResponseSchema(
            access_token=self.create_access_token(str(user.id)),
            refresh_token=self.create_refresh_token(str(user.id)),
            user=DevAuthUserItemSchema(
                id=user.id,
                name=user.name,
                age=user.age,
                is_current=True,
            ),
        )

    async def try_verify_user_token(self, token: str | None) -> User | None:
        if not token:
            return None
        try:
            return await self.verify_user_token(token)
        except InvalidCredentials:
            return None

    async def verify_user_token(self, token: str) -> User:
        try:
            payload = jwt.decode(token, JWT_CONFIG.SECRET_KEY, algorithms=[JWT_CONFIG.ALGORITHM])
            if (payload.get("scope") or JWT_CONFIG.SCOPE_USER) != JWT_CONFIG.SCOPE_USER:
                raise InvalidCredentials()
            user_id = UUID(payload.get("sub"))
            user = await self.user_repository.get_by_filter(one_or_none=True, id=user_id)
            if not user:
                raise InvalidCredentials()

            return user

        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError):
            raise InvalidCredentials()
        