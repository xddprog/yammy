from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

_ENV_FILE = BASE_DIR / ".env"
_ENV_FILE_STR = str(_ENV_FILE) if _ENV_FILE.exists() else None


def _settings_config(env_prefix: str | None = None) -> SettingsConfigDict:
    opts: dict = dict(
        env_file=_ENV_FILE_STR,
        case_sensitive=True,
        extra="ignore",
        env_nested_delimiter="__",
    )
    if env_prefix is not None:
        opts["env_prefix"] = env_prefix
    return SettingsConfigDict(**opts)


class Config(BaseSettings):
    model_config = _settings_config()


class RedisConfig(Config):
    model_config = _settings_config(env_prefix="REDIS_CONFIG__")
    REDIS_PORT: int
    REDIS_HOST: str


class DatabaseConfig(Config):
    model_config = _settings_config(env_prefix="DATABASE_CONFIG__")
    DB_NAME: str
    DB_USER: str
    DB_PASS: str
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    
    def get_url(self, is_async: bool = True) -> str:
        user, password, host, port, db = (
            self.DB_USER, self.DB_PASS, 
            self.DB_HOST, self.DB_PORT, self.DB_NAME
        )
        
        driver = "postgresql+asyncpg" if is_async else "postgresql"
        return f"{driver}://{user}:{password}@{host}:{port}/{db}"


class JWTConfig(Config):
    model_config = _settings_config(env_prefix="JWT_CONFIG__")
    SECRET_KEY: str = Field(default="change-me-in-production")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=3)


class YandexPayConfig(Config):
    model_config = _settings_config(env_prefix="YANDEX_PAY_CONFIG__")
    API_URL: str = Field(default="https://pay.yandex.ru")
    ON_ERROR_REDIRECT_URL: str = Field(default="")
    ON_SUCCESS_REDIRECT_URL: str = Field(default="")
    ON_ABORT_REDIRECT_URL: str = Field(default="")
    CALLBACK_URL: str = Field(default="http://localhost:8000/api/v1/order/callback")
    REQUEST_TIMEOUT: int = Field(default=10)
    MAX_RETRIES: int = Field(default=3)
    API_KEY: str = Field(default="")
    

class AppConfig(Config):
    model_config = _settings_config(env_prefix="APP_CONFIG__")
    APP_NAME: str = Field(default="yammy")
    DEBUG: bool = Field(default=False)
    """development: POST /auth/telegram использует заглушку без проверки init_data. production — реальная проверка WebApp."""
    ENVIRONMENT: Literal["development", "production"] = Field(default="development")

    BASE_URL: str = Field(default="http://localhost:8000")
    STATIC_URL: str = Field(default="http://localhost:8000/static/images")
    
    MAX_IMAGE_SIZE_MB: int = Field(default=10)
    WEBP_QUALITY: int = Field(default=85)
    
    SLOW_REQUEST_THRESHOLD: float = Field(default=1.0, description="Порог медленных запросов в секундах")

    CORS_ALLOWED_ORIGINS: str = Field(default="http://localhost:3000,http://localhost:5173")



class TelegramConfig(Config):
    model_config = _settings_config(env_prefix="TELEGRAM_CONFIG__")
    BOT_TOKEN: str = Field(default="")
    ADMIN_CHAT_ID: str = Field(default="", description="ID чата для уведомлений администратора")


class ElasticsearchConfig(Config):
    model_config = _settings_config(env_prefix="ELASTICSEARCH_CONFIG__")
    ES_HOST: str = Field(default="localhost")
    ES_PORT: int = Field(default=9200)
    ES_USER: str = Field(default="")
    ES_PASSWORD: str = Field(default="")
    ES_SCHEME: str = Field(default="http")


class GigDataConfig(Config):
    model_config = _settings_config(env_prefix="GIGDATA_CONFIG__")
    API_URL_SUGGEST_EDUCATIONS: str = Field(default="https://api.gigdata.ru/api/v2/suggest/educations")
    API_KEY_SUGGEST_EDUCATIONS: str = Field(default="tqxccbn7lxjk4jqhuzrfh353f4cjtba0jkdeuozo")
    REQUEST_TIMEOUT_SUGGEST_EDUCATIONS: int = Field(default=10)


class Settings(Config):
    telegram_config: TelegramConfig = Field(default_factory=TelegramConfig)
    database_config: DatabaseConfig = Field(default_factory=DatabaseConfig)
    jwt_config: JWTConfig = Field(default_factory=JWTConfig)
    app_config: AppConfig = Field(default_factory=AppConfig)
    yandex_pay_config: YandexPayConfig = Field(default_factory=YandexPayConfig)
    redis_config: RedisConfig = Field(default_factory=RedisConfig)
    elasticsearch_config: ElasticsearchConfig = Field(default_factory=ElasticsearchConfig)
    gigdata_config: GigDataConfig = Field(default_factory=GigDataConfig)


settings = Settings()


TELEGRAM_CONFIG = settings.telegram_config
DB_CONFIG = settings.database_config
JWT_CONFIG = settings.jwt_config
APP_CONFIG = settings.app_config
YANDEX_PAY_CONFIG = settings.yandex_pay_config
REDIS_CONFIG = settings.redis_config
ELASTICSEARCH_CONFIG = settings.elasticsearch_config
GIGDATA_CONFIG = settings.gigdata_config


__all__ = [
    "BASE_DIR", "TELEGRAM_CONFIG", "DB_CONFIG",
    "JWT_CONFIG", "APP_CONFIG", "YANDEX_PAY_CONFIG", "ELASTICSEARCH_CONFIG",
    "GIGDATA_CONFIG",
]