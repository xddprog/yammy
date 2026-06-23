from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.clients.elasticsearch_client import ElasticsearchClient
from app.core.clients.redis_client import RedisClient
from app.core.clients.taskiq_client import taskiq_client
from app.infrastructure.config.config import APP_CONFIG
from app.infrastructure.config.validation import validate_production_config
from app.infrastructure.database.adapters.pg_connection import DatabaseConnection
from app.infrastructure.logging.logger import get_logger
from app.utils.loaders.bootstrap_db import bootstrap_production
from app.utils.loaders.cities_loader import load_russian_city_names_to_redis
from app.utils.loaders.test_db import clear_elasticsearch_users_index, sync_test_users_to_es
from app.utils.loaders.universities_loader import load_university_names_to_redis

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_production_config()
    logger.info("application_startup", app_name=APP_CONFIG.APP_NAME, debug=APP_CONFIG.DEBUG)
    try:
        db_connection = DatabaseConnection()
        es_client = ElasticsearchClient()
        redis_client = RedisClient()

        await load_russian_city_names_to_redis(redis_client)
        await load_university_names_to_redis(redis_client)

        seeded_new_users = False
        if APP_CONFIG.ENVIRONMENT == "development":
            seeded_new_users = await db_connection.init_development_db(clear_db=False)
            if seeded_new_users:
                await clear_elasticsearch_users_index(es_client)
        else:
            async with await db_connection.get_session() as session:
                await db_connection.init_tables(clear_db=False)
                await bootstrap_production(session)

        await es_client.init_indices()
        await taskiq_client.startup()

        if APP_CONFIG.ENVIRONMENT == "development":
            async with await db_connection.get_session() as session:
                await sync_test_users_to_es(
                    session=session,
                    es_client=es_client,
                    container=app.state.dishka_container,
                )
        logger.info("app_environment", environment=APP_CONFIG.ENVIRONMENT)
    except Exception:
        logger.exception("application_startup_error")
        raise

    logger.info("database_connected")
    logger.info("elasticsearch_initialized")
    yield

    await taskiq_client.shutdown()
    # await redis_client.clear()
    logger.info("application_shutdown")
