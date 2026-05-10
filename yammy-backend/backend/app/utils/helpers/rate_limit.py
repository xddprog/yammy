
from typing import Any

from fastapi import WebSocket
from fastapi_limiter.depends import RateLimiter, WebSocketRateLimiter
from pyrate_limiter import Duration, Limiter, Rate
from starlette.requests import Request
from starlette.responses import Response

from app.infrastructure.errors.base import RateLimitExceededException


async def rate_limit_exceeded_callback(*_args: object, **_kwargs: object) -> None:
    raise RateLimitExceededException()


class RateLimited:
    _impl: RateLimiter | WebSocketRateLimiter
    _is_websocket: bool

    def __init__(
        self,
        limit: int,
        interval: Duration,
        *,
        is_websocket: bool = False,
    ) -> None:
        self._is_websocket = is_websocket
        limiter = Limiter(Rate(limit=limit, interval=interval))
        kw: dict[str, Any] = {
            'limiter': limiter,
            'callback': rate_limit_exceeded_callback,
        }

        if is_websocket:
            self._impl = WebSocketRateLimiter(**kw)
        else:
            self._impl = RateLimiter(**kw)

    async def __call__(self, request: Request, response: Response) -> Any:
        return await self._impl(request, response)

    async def ws(self, websocket: WebSocket, context_key: str = '') -> Any:
        return await self._impl(websocket, context_key=context_key)
