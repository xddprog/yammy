from dishka import Provider, Scope, provide

from app.core.clients.elasticsearch_client import ElasticsearchClient
from app.core.clients.telegram_client import TelegramClient
from app.core.services.ml_service import MLService
from app.core.clients.redis_client import RedisClient
from app.infrastructure.database.adapters.pg_connection import DatabaseConnection
from app.core.services.websocket_service import WebSocketService


class AppProvider(Provider):
    @provide(scope=Scope.APP)
    async def get_redis_client(self) -> RedisClient:
        return RedisClient()

    @provide(scope=Scope.APP)
    async def get_db_connection(self) -> DatabaseConnection:
        return DatabaseConnection()
    
    @provide(scope=Scope.APP)
    async def get_ml_service(self) -> MLService:
        return MLService()
    
    @provide(scope=Scope.APP)
    async def get_elasticsearch_client(self) -> ElasticsearchClient:
        return ElasticsearchClient()

    @provide(scope=Scope.APP)
    async def get_ws_service(self) -> WebSocketService:
        return WebSocketService()

    @provide(scope=Scope.APP)
    def get_telegram_client(self) -> TelegramClient:
        return TelegramClient()
