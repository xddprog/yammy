from typing import AsyncIterable

from dishka import Provider, Scope, provide
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import repositories, services
from app.infrastructure.database.adapters.pg_connection import DatabaseConnection


class WebSocketProvider(Provider):
    @provide(scope=Scope.SESSION)
    async def get_session(self, db_connection: DatabaseConnection) -> AsyncIterable[AsyncSession]:
        session = await db_connection.get_session()
        try:
            yield session
        finally:
            await session.close()

    @provide(scope=Scope.SESSION)
    def get_auth_service(self, session: AsyncSession) -> services.AuthService:
        return services.AuthService(
            admin_repository=repositories.AdminRepository(session=session),
            user_repository=repositories.UserRepository(session=session),
        )

    @provide(scope=Scope.SESSION)
    def get_chat_service(self, session: AsyncSession) -> services.ChatService:
        return services.ChatService(
            chat_repository=repositories.ChatRepository(session=session),
            message_repository=repositories.MessageRepository(session=session),
        )

    @provide(scope=Scope.SESSION)
    def get_image_service(self) -> services.ImageService:
        return services.ImageService()

    @provide(scope=Scope.SESSION)
    def get_message_service(
        self,
        session: AsyncSession,
        image_service: services.ImageService,
    ) -> services.MessageService:
        return services.MessageService(
            message_repository=repositories.MessageRepository(session=session),
            image_service=image_service,
        )
