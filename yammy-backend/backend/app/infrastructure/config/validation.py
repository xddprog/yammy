from app.infrastructure.config.config import APP_CONFIG, JWT_CONFIG, TELEGRAM_CONFIG

_INSECURE_JWT_SECRETS = frozenset({"", "change-me-in-production"})


def validate_production_config() -> None:
    if APP_CONFIG.ENVIRONMENT != "production":
        return

    errors: list[str] = []

    if APP_CONFIG.DEBUG:
        errors.append("APP_CONFIG__DEBUG must be false in production")

    if JWT_CONFIG.SECRET_KEY in _INSECURE_JWT_SECRETS:
        errors.append("JWT_CONFIG__SECRET_KEY must be set to a strong secret")

    if not TELEGRAM_CONFIG.BOT_TOKEN:
        errors.append("TELEGRAM_CONFIG__BOT_TOKEN is required in production")

    if errors:
        raise RuntimeError("Invalid production configuration: " + "; ".join(errors))
