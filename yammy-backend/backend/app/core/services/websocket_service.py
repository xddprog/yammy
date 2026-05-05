from fastapi.websockets import WebSocket
from pydantic import BaseModel


class WebSocketService:
    def __init__(self):
        self.active_connections = {}

    async def connect(self, chat_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[chat_id] = websocket

    async def disconnect(self, chat_id: str):
        con: WebSocket = self.active_connections.get(chat_id)
        if con:
            try:
                await con.close()
            except:
                pass
            del self.active_connections[chat_id]

    async def broadcast(self, chat_id: str, message: BaseModel, event: str):
        conn = self.active_connections.get(chat_id)

        if conn:
            await conn.send_json({
                "data": message.model_dump(),
                "event": event
            })