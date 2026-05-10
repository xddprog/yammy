from typing import AsyncIterable
from dishka import FromDishka, Provider, Scope, provide
from dishka.integrations.fastapi import inject
from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession


from app.core import repositories, services
from app.core.clients.redis_client import RedisClient
from app.core.dto.admin import BaseAdminSchema
from app.infrastructure.database.adapters.pg_connection import DatabaseConnection
from app.infrastructure.database.models.user import User
from app.core.clients.elasticsearch_client import ElasticsearchClient
from app.core.services.ml_service import MLService

security = HTTPBearer()


class RequestProvider(Provider):
    @provide(scope=Scope.REQUEST)
    async def get_session(self, db_connection: DatabaseConnection) -> AsyncIterable[AsyncSession]:
        session = await db_connection.get_session()
        try:
            yield session
        finally:
            await session.close()

    @provide(scope=Scope.REQUEST)
    def get_auth_service(self, session: AsyncSession) -> services.AuthService:
        return services.AuthService(
            admin_repository=repositories.AdminRepository(session=session),
            user_repository=repositories.UserRepository(session=session)
        )

    @provide(scope=Scope.REQUEST)
    def get_filter_service(self, session: AsyncSession, redis_client: RedisClient) -> services.FilterService:
        return services.FilterService(
            filter_repository=repositories.FilterRepository(session=session),
            redis_client=redis_client
        )

    @provide(scope=Scope.REQUEST)
    def get_search_service(
        self, 
        session: AsyncSession,
        elasticsearch_client: ElasticsearchClient,
        ml_service: MLService,
        redis_client: RedisClient,
    ) -> services.SearchService:
        return services.SearchService(
            user_repository=repositories.UserRepository(session=session),
            like_repository=repositories.LikeRepository(session=session),
            appearance_rating_repository=repositories.AppearanceRatingRepository(session=session),
            elasticsearch_client=elasticsearch_client,
            ml_service=ml_service,
            redis_client=redis_client
        )
            
    @provide(scope=Scope.REQUEST)
    def get_like_service(self, session: AsyncSession, redis_client: RedisClient) -> services.LikeService:
        return services.LikeService(
            like_repository=repositories.LikeRepository(session=session),
            redis_client=redis_client
        )
    
    @provide(scope=Scope.REQUEST)
    def get_appearance_rating_service(self, session: AsyncSession, redis_client: RedisClient) -> services.AppearanceRatingService:
        return services.AppearanceRatingService(
            appearance_rating_repository=repositories.AppearanceRatingRepository(session=session),
            redis_client=redis_client
        )

    @provide(scope=Scope.REQUEST)
    def get_image_service(self) -> services.ImageService:
        return services.ImageService()

    @provide(scope=Scope.REQUEST)
    def get_moderation_service(self, ml_service: MLService) -> services.ModerationService:
        return services.ModerationService(
            ml_service=ml_service
        )

    @provide(scope=Scope.REQUEST)
    def get_chat_service(self, session: AsyncSession) -> services.ChatService:
        return services.ChatService(
            chat_repository=repositories.ChatRepository(session=session)
        )

    @provide(scope=Scope.REQUEST)
    def get_university_service(self, redis_client: RedisClient) -> services.UniversityService:
        return services.UniversityService(redis_client=redis_client)

    @provide(scope=Scope.REQUEST)
    def get_city_service(self, redis_client: RedisClient) -> services.CityService:
        return services.CityService(redis_client=redis_client)

    @provide(scope=Scope.REQUEST)
    def get_user_service(
        self,
        session: AsyncSession,
        image_service: services.ImageService,
        moderation_service: services.ModerationService,
    ) -> services.UserService:
        return services.UserService(
            user_repository=repositories.UserRepository(session=session),
            image_service=image_service,
            moderation_service=moderation_service,
        )


@inject
async def get_current_admin(
    auth_service: FromDishka[services.AuthService], 
    request: Request
) -> BaseAdminSchema:
    token = request.cookies.get('access_token')
    data = await auth_service.verify_token(token)
    return await auth_service.check_admin_exist(data)


@inject
async def get_current_user(
    auth_service: FromDishka[services.AuthService],
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    return await auth_service.verify_user_token(credentials.credentials)
