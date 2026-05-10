from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.clients.elasticsearch_client import ElasticsearchClient
from app.core.clients.redis_client import RedisClient
from app.core.clients.taskiq_client import TaskiqClient
from app.infrastructure.config.config import APP_CONFIG
from app.infrastructure.database.adapters.pg_connection import DatabaseConnection
from app.infrastructure.logging.logger import get_logger
from app.utils.loaders.cities_loader import load_russian_city_names_to_redis
from app.utils.loaders.universities_loader import load_university_names_to_redis
from app.utils.loaders.test_db import sync_test_users_to_es

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("application_startup", app_name=APP_CONFIG.APP_NAME, debug=APP_CONFIG.DEBUG)
    try:
        db_connection = DatabaseConnection()
        es_client = ElasticsearchClient()
        taskiq_client = TaskiqClient()
        redis_client = RedisClient()

        await db_connection.init_test_db()
        await load_russian_city_names_to_redis(redis_client)
        await load_university_names_to_redis(redis_client)
        await es_client.init_indices()
        await taskiq_client.startup()

        async with await db_connection.get_session() as session:
            await sync_test_users_to_es(
                session=session,
                es_client=es_client,
                container=app.state.dishka_container,
            )
        logger.info("App work with environment", environment=APP_CONFIG.ENVIRONMENT)
    except Exception:
        logger.exception("application_startup_error")
        raise

    logger.info("database_connected")
    logger.info("elasticsearch_initialized")
    logger.info("taskiq_client_initialized")
    yield

    await taskiq_client.shutdown()
    logger.info("application_shutdown")
