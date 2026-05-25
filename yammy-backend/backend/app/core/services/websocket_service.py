from uuid import UUID

from fastapi.websockets import WebSocket
from pydantic import BaseModel
from starlette.websockets import WebSocketState


class WebSocketService:
    def __init__(self):
        self.active_connections: dict[UUID, list[WebSocket]] = {}

    async def connect(self, match_id: UUID, websocket: WebSocket) -> None:
        self.active_connections.setdefault(match_id, []).append(websocket)

    async def disconnect(self, match_id: UUID, websocket: WebSocket) -> None:
        connections = self.active_connections.get(match_id)
        if not connections:
            return

        try:
            connections.remove(websocket)
        except ValueError:
            pass

        if not connections:
            self.active_connections.pop(match_id, None)

        try:
            if websocket.application_state != WebSocketState.DISCONNECTED:
                await websocket.close()
        except Exception:
            pass

    async def broadcast(self, match_id: UUID, message: BaseModel, event: str) -> None:
        connections = self.active_connections.get(match_id, [])
        if not connections:
            return

        payload = {
            "data": message.model_dump(mode="json", by_alias=True),
            "event": event,
        }
        stale_connections: list[WebSocket] = []

        for connection in list(connections):
            try:
                await connection.send_json(payload)
            except Exception:
                stale_connections.append(connection)

        for connection in stale_connections:
            await self.disconnect(match_id, connection)
