from typing import Annotated

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Query, WebSocket, status
from starlette.websockets import WebSocketDisconnect, WebSocketState

from app.core.dto.presence import PresenceSubscribeRequestSchema
from app.core.services import AuthService, PresenceService
from app.infrastructure.errors.base import BaseAPIException
from app.infrastructure.logging import get_logger
from app.utils.constants.enums import PresenceEvents

router = APIRouter()

logger = get_logger(__name__)


@router.websocket("/ws")
@inject
async def presence_websocket(
    websocket: WebSocket,
    auth_service: FromDishka[AuthService],
    presence_service: FromDishka[PresenceService],
    access_token: Annotated[str | None, Query()] = None,
) -> None:
    session_id: str | None = None

    if not access_token:
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Неверные учетные данные",
        )
        return

    try:
        user = await auth_service.verify_user_token(access_token)
    except BaseAPIException as error:
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION,
            reason=error.detail,
        )
        return

    try:
        await websocket.accept()
        session_id = await presence_service.register(user.id, websocket)

        while True:
            payload = await websocket.receive_json()
            event = payload.get("event")

            if event == PresenceEvents.HEARTBEAT:
                await presence_service.heartbeat(session_id)
                continue

            if event == PresenceEvents.SUBSCRIBE_PEERS:
                request = PresenceSubscribeRequestSchema(**payload)
                await presence_service.subscribe(
                    session_id,
                    set(request.peer_ids),
                )
                continue

            await presence_service.send_error(
                websocket,
                status_code=400,
                detail="Неизвестное событие presence",
            )
    except WebSocketDisconnect:
        pass
    except BaseAPIException as error:
        if websocket.application_state != WebSocketState.DISCONNECTED:
            await presence_service.send_error(
                websocket,
                status_code=error.status_code,
                detail=error.detail,
            )
    except Exception as error:
        logger.error("presence_websocket_error", error=error, exc_info=True)
        if websocket.application_state != WebSocketState.DISCONNECTED:
            await presence_service.send_error(
                websocket,
                status_code=500,
                detail="Ошибка presence-соединения",
            )
    finally:
        if session_id is not None:
            await presence_service.unregister(session_id, close_socket=False)
