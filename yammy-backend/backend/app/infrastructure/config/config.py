from pathlib import Path
import os
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent


def resolve_env_file() -> Path | None:
    explicit = os.getenv("YAMMY_ENV_FILE")
    if explicit:
        path = Path(explicit)
        return path if path.is_file() else None

    env_mode = (
        os.getenv("YAMMY_ENV")
        or os.getenv("APP_CONFIG__ENVIRONMENT")
        or "development"
    ).strip().lower()

    if env_mode == "production":
        candidate = BASE_DIR / ".env"
    else:
        candidate = BASE_DIR / ".env.dev"

    return candidate if candidate.is_file() else None


_ENV_FILE = resolve_env_file()
_ENV_FILE_STR = str(_ENV_FILE) if _ENV_FILE else None


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
    SCOPE_USER: str = Field(default="user")
    SCOPE_ONBOARDING: str = Field(default="onboarding")
    SCOPE_STAFF: str = Field(default="staff")
    ONBOARDING_ACCESS_TOKEN_EXPIRE_HOURS: int = Field(default=2)


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
    """Включить structlog ConsoleRenderer (цветные логи в терминале) без FastAPI debug."""
    PRETTY_LOGS: bool = Field(default=False)
    """development: POST /auth/telegram использует заглушку без проверки init_data. production — реальная проверка WebApp."""
    ENVIRONMENT: Literal["development", "production"] = Field(default="development")

    BASE_URL: str = Field(default="http://localhost:8000")
    STATIC_URL: str = Field(default="http://localhost:8000/static/images")
    
    MAX_IMAGE_SIZE_MB: int = Field(default=10)
    WEBP_QUALITY: int = Field(default=85)
    
    SLOW_REQUEST_THRESHOLD: float = Field(default=1.0, description="Порог медленных запросов в секундах")

    CORS_ALLOWED_ORIGINS: str = Field(
        default=(
            "http://localhost:3000,http://localhost:5173,http://localhost:5174"
        )
    )

    ADMIN_BOOTSTRAP_USERNAME: str = Field(default="")
    ADMIN_BOOTSTRAP_PASSWORD: str = Field(default="")



class TelegramConfig(Config):
    model_config = _settings_config(env_prefix="TELEGRAM_CONFIG__")
    BOT_TOKEN: str = Field(default="")
    ADMIN_CHAT_ID: str = Field(default="", description="ID чата для уведомлений администратора")
    BOT_USERNAME: str = Field(
        default="yammy_bot",
    )
    DEV_STUB_TELEGRAM_ID: int = Field(default=1212345678)


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
    API_KEY_SUGGEST_EDUCATIONS: str = Field(default="")
    REQUEST_TIMEOUT_SUGGEST_EDUCATIONS: int = Field(default=10)


class OpenRouterConfig(Config):
    model_config = _settings_config(env_prefix="OPENROUTER_CONFIG__")
    API_URL: str = Field(default="https://openrouter.ai/api/v1")
    API_KEY: str = Field(default="")
    MODEL: str = Field(default="openai/gpt-oss-20b:free")
    REQUEST_TIMEOUT: int = Field(default=90)
    MAX_RETRIES: int = Field(default=5)


class AiSearchConfig(Config):
    model_config = _settings_config(env_prefix="AI_SEARCH_CONFIG__")
    MIN_RESULTS: int = Field(default=30)
    CANDIDATE_BATCH_SIZE: int = Field(default=100)
    MAX_LLM_CALLS_PER_HISTORY_ITEM: int = Field(default=4)
    DAILY_LIMIT_FREE: int = Field(default=100)
    DAILY_LIMIT_VIP: int = Field(default=3)
    DAILY_LIMIT_PREMIUM: int = Field(default=6)


class Settings(Config):
    telegram_config: TelegramConfig = Field(default_factory=TelegramConfig)
    database_config: DatabaseConfig = Field(default_factory=DatabaseConfig)
    jwt_config: JWTConfig = Field(default_factory=JWTConfig)
    app_config: AppConfig = Field(default_factory=AppConfig)
    yandex_pay_config: YandexPayConfig = Field(default_factory=YandexPayConfig)
    redis_config: RedisConfig = Field(default_factory=RedisConfig)
    elasticsearch_config: ElasticsearchConfig = Field(default_factory=ElasticsearchConfig)
    gigdata_config: GigDataConfig = Field(default_factory=GigDataConfig)
    openrouter_config: OpenRouterConfig = Field(default_factory=OpenRouterConfig)
    ai_search_config: AiSearchConfig = Field(default_factory=AiSearchConfig)


settings = Settings()


TELEGRAM_CONFIG = settings.telegram_config
DB_CONFIG = settings.database_config
JWT_CONFIG = settings.jwt_config
APP_CONFIG = settings.app_config
YANDEX_PAY_CONFIG = settings.yandex_pay_config
REDIS_CONFIG = settings.redis_config
ELASTICSEARCH_CONFIG = settings.elasticsearch_config
GIGDATA_CONFIG = settings.gigdata_config
OPENROUTER_CONFIG = settings.openrouter_config
AI_SEARCH_CONFIG = settings.ai_search_config


__all__ = [
    "BASE_DIR", "TELEGRAM_CONFIG", "DB_CONFIG",
    "JWT_CONFIG", "APP_CONFIG", "YANDEX_PAY_CONFIG", "ELASTICSEARCH_CONFIG",
    "GIGDATA_CONFIG", "OPENROUTER_CONFIG", "AI_SEARCH_CONFIG",
]