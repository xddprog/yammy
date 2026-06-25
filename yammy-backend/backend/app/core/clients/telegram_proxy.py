import aiohttp
from aiohttp_socks import ProxyConnector
from aiogram.client.session.aiohttp import AiohttpSession

from app.infrastructure.config.config import SUPPORT_TELEGRAM_CONFIG


def support_telegram_proxy() -> str | None:
    proxy = SUPPORT_TELEGRAM_CONFIG.PROXY.strip()
    return proxy or None


def create_telegram_client_session() -> aiohttp.ClientSession:
    proxy = support_telegram_proxy()
    if proxy:
        return aiohttp.ClientSession(connector=ProxyConnector.from_url(proxy))
    return aiohttp.ClientSession()


def create_aiogram_session() -> AiohttpSession | None:
    proxy = support_telegram_proxy()
    if not proxy:
        return None
    return AiohttpSession(proxy=proxy)
