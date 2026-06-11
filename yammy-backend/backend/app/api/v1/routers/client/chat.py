from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket
from pyrate_limiter import Duration
from starlette.websockets import WebSocketDisconnect, WebSocketState

from app.api.v1.dependency.providers.request import get_current_user
from app.core.dto.chat import ChatErrorResponseSchema, ChatListItemSchema
from app.core.dto.pagination import PaginationRequestModel, PaginationResponseModel
from app.core.services import AuthService, ChatService, WebSocketService
from app.infrastructure.database.models.user import User
from app.infrastructure.errors.base import BaseAPIException
from app.utils.helpers.rate_limit import RateLimited
from app.utils.constants.enums import ChatEvents
from app.infrastructure.logging import get_logger
from app.core.dto.message import MessageCreateRequest, MessageEditRequest
from app.core.services.message_service import MessageService


router = APIRouter()

logger = get_logger(__name__)


async def _send_ws_error(
    websocket: WebSocket,
    status_code: int,
    detail: str,
) -> None:
    if websocket.application_state == WebSocketState.DISCONNECTED:
        return

    await websocket.send_json(
        {
            "event": ChatEvents.ERROR,
            "data": ChatErrorResponseSchema(
                status_code=status_code,
                detail=detail,
            ).model_dump(mode="json"),
        }
    )


@router.get(
    "/",
    dependencies=[
        Depends(RateLimited(30, Duration.MINUTE)),
    ],
)
@inject
async def list_chats(
    chat_service: FromDishka[ChatService],
    current_user: Annotated[User, Depends(get_current_user)],
    pagination: Annotated[PaginationRequestModel, Query()],
) -> PaginationResponseModel[ChatListItemSchema]:
    return await chat_service.list_user_chats(current_user.id, pagination)


@router.websocket("/{match_id}")
@inject
async def chat_websocket(
    websocket: WebSocket,
    match_id: UUID,
    chat_service: FromDishka[ChatService],
    message_service: FromDishka[MessageService],
    auth_service: FromDishka[AuthService],
    ws_service: FromDishka[WebSocketService],
    access_token: Annotated[str | None, Query()] = None,
) -> None:
    await websocket.accept()
    await ws_service.connect(match_id, websocket)
    try:
        if not access_token:
            raise HTTPException(status_code=401, detail="Неверные учетные данные")
        user = await auth_service.verify_user_token(access_token)
        user_id = user.id
        ratelimit = RateLimited(10, Duration.SECOND, is_websocket=True)

        while True:
            user_input = await websocket.receive_json()
            await ratelimit.ws(websocket)
            incoming_event = user_input.get("event")
            payload = {key: value for key, value in user_input.items() if key != "event"}

            response = None
            outgoing_event = None
            if incoming_event == ChatEvents.OPEN_CHAT:
                response = await chat_service.get_chat_by_match_id(match_id, user_id)
                outgoing_event = ChatEvents.OPEN_CHAT
            elif incoming_event == ChatEvents.MESSAGES:
                pagination = PaginationRequestModel(**payload)
                response = await chat_service.list_messages(match_id, user_id, pagination)
                outgoing_event = ChatEvents.MESSAGES
            elif incoming_event == ChatEvents.MESSAGE:
                form = MessageCreateRequest(**payload)
                response = await message_service.create_message(form)
                outgoing_event = ChatEvents.MESSAGE
            elif incoming_event == ChatEvents.READ:
                message_id = payload.get("message_id")
                response = await message_service.read_message(message_id, user_id)
                outgoing_event = ChatEvents.READ
            elif incoming_event == ChatEvents.DELETE:
                message_id = payload.get("message_id")
                response = await message_service.delete_message(message_id, user_id)
                outgoing_event = ChatEvents.DELETE
            elif incoming_event == ChatEvents.EDIT:
                message_id = payload.get("message_id")
                form = MessageEditRequest(**payload)
                response = await message_service.edit_message(message_id, user_id, form)
                outgoing_event = ChatEvents.EDIT
            elif incoming_event == ChatEvents.TYPING:
                chat_id = UUID(payload["chat_id"])
                is_typing = bool(payload.get("is_typing", True))
                response = await chat_service.build_typing_event(
                    match_id,
                    chat_id,
                    user_id,
                    is_typing,
                )
                await ws_service.broadcast_except(
                    match_id,
                    websocket,
                    response,
                    ChatEvents.TYPING,
                )
                continue

            if response is not None and outgoing_event is not None:
                await ws_service.broadcast(match_id, response, outgoing_event)
    except WebSocketDisconnect:
        pass
    except HTTPException as e:
        await _send_ws_error(websocket, e.status_code, e.detail)
    except BaseAPIException as e:
        await _send_ws_error(websocket, e.status_code, e.detail)
    except Exception as e:
        logger.error("Error in chat websocket", match_id=match_id, error=e, exc_info=True)
        await _send_ws_error(websocket, 500, "Ошибка при обработке сообщения")
    finally:
        await ws_service.disconnect(match_id, websocket)
