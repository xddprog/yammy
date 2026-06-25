from dishka import Provider, Scope, provide

from app.core.clients.elasticsearch_client import ElasticsearchClient
from app.core.clients.openrouter_client import OpenRouterClient
from app.core.clients.support_telegram_client import SupportTelegramClient
from app.core.clients.telegram_client import TelegramClient
from app.core.services.ml_service import MLService
from app.core.clients.redis_client import RedisClient
from app.infrastructure.database.adapters.pg_connection import DatabaseConnection
from app.core.services.presence_service import PresenceService
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
    def get_presence_service(
        self,
        redis_client: RedisClient,
        db_connection: DatabaseConnection,
    ) -> PresenceService:
        return PresenceService(
            redis_client=redis_client,
            db_connection=db_connection,
        )

    @provide(scope=Scope.APP)
    def get_telegram_client(self) -> TelegramClient:
        return TelegramClient()

    @provide(scope=Scope.APP)
    def get_support_telegram_client(self) -> SupportTelegramClient:
        return SupportTelegramClient()

    @provide(scope=Scope.APP)
    def get_openrouter_client(self) -> OpenRouterClient:
        return OpenRouterClient()
