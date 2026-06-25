from typing import AsyncIterable
from dishka import FromDishka, Provider, Scope, provide
from dishka.integrations.fastapi import inject
from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession


from app.core import repositories, services
from app.core.clients.redis_client import RedisClient
from app.infrastructure.database.adapters.pg_connection import DatabaseConnection
from app.infrastructure.database.models.user import User
from app.core.clients.elasticsearch_client import ElasticsearchClient
from app.core.clients.openrouter_client import OpenRouterClient
from app.core.clients.support_telegram_client import SupportTelegramClient
from app.core.clients.telegram_client import TelegramClient
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
    def get_user_repository(self, session: AsyncSession) -> repositories.UserRepository:
        return repositories.UserRepository(session=session)

    @provide(scope=Scope.REQUEST)
    def get_auth_service(self, session: AsyncSession) -> services.AuthService:
        return services.AuthService(
            admin_repository=repositories.AdminRepository(session=session),
            user_repository=repositories.UserRepository(session=session)
        )

    @provide(scope=Scope.REQUEST)
    def get_filter_service(
        self,
        session: AsyncSession,
        redis_client: RedisClient,
        user_index_service: services.UserIndexService,
    ) -> services.FilterService:
        return services.FilterService(
            filter_repository=repositories.FilterRepository(session=session),
            redis_client=redis_client,
            user_index_service=user_index_service,
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
    def get_notification_service(self, telegram_client: TelegramClient) -> services.NotificationService:
        return services.NotificationService(telegram_client=telegram_client)

    @provide(scope=Scope.REQUEST)
    def get_telegram_bot_service(self, telegram_client: TelegramClient) -> services.TelegramBotService:
        return services.TelegramBotService(telegram_client=telegram_client)

    @provide(scope=Scope.REQUEST)
    def get_support_service(
        self,
        session: AsyncSession,
        support_telegram_client: SupportTelegramClient,
    ) -> services.SupportService:
        return services.SupportService(
            support_repository=repositories.SupportRepository(session=session),
            user_repository=repositories.UserRepository(session=session),
            support_telegram_client=support_telegram_client,
        )

    @provide(scope=Scope.REQUEST)
    def get_like_service(
        self,
        session: AsyncSession,
        redis_client: RedisClient,
        notification_service: services.NotificationService,
    ) -> services.LikeService:
        return services.LikeService(
            like_repository=repositories.LikeRepository(session=session),
            user_repository=repositories.UserRepository(session=session),
            redis_client=redis_client,
            notification_service=notification_service,
        )
    
    @provide(scope=Scope.REQUEST)
    def get_appearance_rating_service(
        self,
        session: AsyncSession,
        redis_client: RedisClient,
        notification_service: services.NotificationService,
    ) -> services.AppearanceRatingService:
        return services.AppearanceRatingService(
            appearance_rating_repository=repositories.AppearanceRatingRepository(session=session),
            user_repository=repositories.UserRepository(session=session),
            like_repository=repositories.LikeRepository(session=session),
            redis_client=redis_client,
            notification_service=notification_service,
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
            chat_repository=repositories.ChatRepository(session=session),
            message_repository=repositories.MessageRepository(session=session),
        )

    @provide(scope=Scope.REQUEST)
    def get_adequacy_score_service(
        self,
        session: AsyncSession,
        user_index_service: services.UserIndexService,
    ) -> services.AdequacyScoreService:
        return services.AdequacyScoreService(
            user_repository=repositories.UserRepository(session=session),
            user_index_service=user_index_service,
        )

    @provide(scope=Scope.REQUEST)
    def get_report_service(
        self,
        session: AsyncSession,
        adequacy_score_service: services.AdequacyScoreService,
    ) -> services.ReportService:
        return services.ReportService(
            report_repository=repositories.ReportRepository(session=session),
            user_repository=repositories.UserRepository(session=session),
            adequacy_score_service=adequacy_score_service,
        )

    @provide(scope=Scope.REQUEST)
    def get_ai_search_service(
        self,
        session: AsyncSession,
        redis_client: RedisClient,
        openrouter_client: OpenRouterClient,
    ) -> services.AiSearchService:
        return services.AiSearchService(
            ai_search_history_repository=repositories.AiSearchHistoryRepository(session=session),
            user_repository=repositories.UserRepository(session=session),
            like_repository=repositories.LikeRepository(session=session),
            redis_client=redis_client,
            openrouter_client=openrouter_client,
        )

    @provide(scope=Scope.REQUEST)
    def get_tarot_compatibility_service(
        self,
        session: AsyncSession,
        openrouter_client: OpenRouterClient,
    ) -> services.TarotCompatibilityService:
        return services.TarotCompatibilityService(
            tarot_history_repository=repositories.TarotCompatibilityHistoryRepository(session=session),
            user_repository=repositories.UserRepository(session=session),
            like_repository=repositories.LikeRepository(session=session),
            chat_repository=repositories.ChatRepository(session=session),
            message_repository=repositories.MessageRepository(session=session),
            openrouter_client=openrouter_client,
        )

    @provide(scope=Scope.REQUEST)
    def get_university_service(self, redis_client: RedisClient) -> services.UniversityService:
        return services.UniversityService(redis_client=redis_client)

    @provide(scope=Scope.REQUEST)
    def get_city_service(self, redis_client: RedisClient) -> services.CityService:
        return services.CityService(redis_client=redis_client)

    @provide(scope=Scope.REQUEST)
    def get_user_index_service(
        self,
        session: AsyncSession,
        elasticsearch_client: ElasticsearchClient,
        ml_service: MLService,
    ) -> services.UserIndexService:
        return services.UserIndexService(
            user_repository=repositories.UserRepository(session=session),
            elasticsearch_client=elasticsearch_client,
            ml_service=ml_service,
        )

    @provide(scope=Scope.REQUEST)
    def get_user_service(
        self,
        session: AsyncSession,
        image_service: services.ImageService,
        moderation_service: services.ModerationService,
        user_index_service: services.UserIndexService,
    ) -> services.UserService:
        return services.UserService(
            user_repository=repositories.UserRepository(session=session),
            like_repository=repositories.LikeRepository(session=session),
            appearance_rating_repository=repositories.AppearanceRatingRepository(session=session),
            image_service=image_service,
            moderation_service=moderation_service,
            user_index_service=user_index_service,
        )


    @provide(scope=Scope.REQUEST)
    def get_admin_stats_service(self, session: AsyncSession) -> services.AdminStatsService:
        return services.AdminStatsService(
            admin_stats_repository=repositories.AdminStatsRepository(session=session),
        )

    @provide(scope=Scope.REQUEST)
    def get_admin_user_service(
        self,
        session: AsyncSession,
        user_index_service: services.UserIndexService,
        adequacy_score_service: services.AdequacyScoreService,
        notification_service: services.NotificationService,
    ) -> services.AdminUserService:
        return services.AdminUserService(
            admin_user_repository=repositories.AdminUserRepository(session=session),
            like_repository=repositories.LikeRepository(session=session),
            report_repository=repositories.ReportRepository(session=session),
            user_index_service=user_index_service,
            adequacy_score_service=adequacy_score_service,
            notification_service=notification_service,
        )


@inject
async def get_current_user(
    auth_service: FromDishka[services.AuthService],
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    return await auth_service.verify_user_token(credentials.credentials)


@inject
async def get_onboarding_telegram_id(
    auth_service: FromDishka[services.AuthService],
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> int:
    return await auth_service.verify_onboarding_telegram_id(credentials.credentials)
