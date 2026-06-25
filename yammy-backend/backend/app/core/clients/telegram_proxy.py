import aiohttp
from aiohttp_socks import ProxyConnector
from aiogram.client.session.aiohttp import AiohttpSession

from app.infrastructure.config.config import SUPPORT_TELEGRAM_CONFIG, TELEGRAM_CONFIG


def telegram_api_proxy() -> str | None:
    for raw in (TELEGRAM_CONFIG.PROXY, SUPPORT_TELEGRAM_CONFIG.PROXY):
        proxy = raw.strip()
        if proxy:
            return proxy
    return None


def create_telegram_client_session() -> aiohttp.ClientSession:
    proxy = telegram_api_proxy()
    if proxy:
        return aiohttp.ClientSession(connector=ProxyConnector.from_url(proxy))
    return aiohttp.ClientSession()


def create_aiogram_session() -> AiohttpSession | None:
    proxy = telegram_api_proxy()
    if not proxy:
        return None
    return AiohttpSession(proxy=proxy)
