from uuid import UUID
from fastapi import APIRouter, HTTPException
from fastapi_limiter.depends import WebSocketRateLimiter
from pyrate_limiter import Duration, Limiter, Rate
from app.core.services import AuthService, ChatService, WebSocketService
from dishka.integrations.fastapi import FromDishka, inject
from fastapi import WebSocket

from app.utils.enums import ChatEvents
from app.infrastructure.logging import get_logger
from app.core.dto.chat import ChatErrorResponseSchema
from app.core.dto.message import MessageCreateRequest, MessageEditRequest
from app.core.services.message_service import MessageService


router = APIRouter()



logger = get_logger(__name__)


@router.websocket("/{match_id}")
@inject
async def chat_websocket(
    websocket: WebSocket,
    match_id: UUID,
    chat_service: FromDishka[ChatService],
    message_service: FromDishka[MessageService],
    auth_service: FromDishka[AuthService],
    ws_service: FromDishka[WebSocketService],
    access_token: str | None = None,
) -> None:
    await ws_service.connect(match_id, websocket)
    try:
        user = await auth_service.verify_user_token(access_token)
        ratelimit = WebSocketRateLimiter(limiter=Limiter(Rate(5, Duration.SECOND)))

        while True:
            user_input = await websocket.receive_json()
            await ratelimit(websocket)
            event = user_input.get("event")

            response = None
            event = None
            if event == ChatEvents.OPEN_CHAT:
                response = await chat_service.get_chat_by_match_id(match_id, user.id)
                event = ChatEvents.OPEN_CHAT
            elif event == ChatEvents.MESSAGE:
                form = MessageCreateRequest(**user_input)
                response = await message_service.create_message(form)
                event = ChatEvents.MESSAGE
            elif event == ChatEvents.READ:
                message_id = user_input.get("message_id")
                response = await message_service.read_message(message_id, user.id)
                event = ChatEvents.READ
            elif event == ChatEvents.DELETE:
                message_id = user_input.get("message_id")
                response = await message_service.delete_message(message_id, user.id)
                event = ChatEvents.DELETE
            elif event == ChatEvents.EDIT:
                message_id = user_input.get("message_id")
                form = MessageEditRequest(**user_input)
                response = await message_service.edit_message(message_id, user.id, form)
                event = ChatEvents.EDIT

            if response:
                await ws_service.broadcast(match_id, response, event)
    except HTTPException as e:
        await ws_service.broadcast(
            match_id,
            ChatErrorResponseSchema(
                status_code=e.status_code,
                detail=e.detail,
            ), 
            ChatEvents.ERROR
        )
    except Exception as e:
        logger.error("Error in chat websocket", match_id=match_id, error=e)
        await ws_service.broadcast(
            match_id,
            ChatErrorResponseSchema(
                status_code=500,
                detail="Ошибка при обработке сообщения",
            ), 
            ChatEvents.ERROR
        )
    finally:
        await websocket.close()