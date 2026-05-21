from uuid import UUID

from fastapi.websockets import WebSocket
from pydantic import BaseModel


class WebSocketService:
    def __init__(self):
        self.active_connections: dict[UUID, WebSocket] = {}

    async def connect(self, match_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections[match_id] = websocket

    async def disconnect(self, match_id: UUID) -> None:
        connection = self.active_connections.pop(match_id, None)
        if connection is None:
            return
        try:
            await connection.close()
        except Exception:
            pass

    async def broadcast(self, match_id: UUID, message: BaseModel, event: str) -> None:
        connection = self.active_connections.get(match_id)
        if connection:
            await connection.send_json({
                "data": message.model_dump(mode="json"),
                "event": event,
            })
