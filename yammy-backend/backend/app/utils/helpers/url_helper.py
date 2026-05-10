from app.infrastructure.config.config import APP_CONFIG


def get_absolute_url(path: str) -> str:
    if not path:
        return None
    if path.startswith(("http://", "https://")):
        return path

    base = APP_CONFIG.STATIC_URL.rstrip("/")
    cleaned = path.lstrip("/")

    if cleaned.startswith("static/"):
        cleaned = cleaned[len("static/"):]

    if base.endswith("/static/images") and cleaned.startswith("images/"):
        cleaned = cleaned[len("images/"):]

    return f"{base}/{cleaned}"