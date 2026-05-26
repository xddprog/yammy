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

    @staticmethod
    def _build_payload(message: BaseModel, event: str) -> dict:
        return {
            "data": message.model_dump(mode="json", by_alias=True),
            "event": event,
        }

    async def _send_to_connections(
        self,
        match_id: UUID,
        connections: list[WebSocket],
        payload: dict,
    ) -> None:
        stale_connections: list[WebSocket] = []

        for connection in list(connections):
            try:
                await connection.send_json(payload)
            except Exception:
                stale_connections.append(connection)

        for connection in stale_connections:
            await self.disconnect(match_id, connection)

    async def broadcast(self, match_id: UUID, message: BaseModel, event: str) -> None:
        connections = self.active_connections.get(match_id, [])
        if not connections:
            return

        await self._send_to_connections(
            match_id,
            connections,
            self._build_payload(message, event),
        )

    async def broadcast_except(
        self,
        match_id: UUID,
        exclude: WebSocket,
        message: BaseModel,
        event: str,
    ) -> None:
        connections = self.active_connections.get(match_id, [])
        if not connections:
            return

        recipients = [connection for connection in connections if connection is not exclude]
        if not recipients:
            return

        await self._send_to_connections(
            match_id,
            recipients,
            self._build_payload(message, event),
        )
