from contextlib import asynccontextmanager
from pathlib import Path

from dishka.integrations.fastapi import setup_dishka as setup_dishka_fastapi
from dishka.integrations.taskiq import setup_dishka as setup_dishka_taskiq
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.v1.dependency.setup import setup_container
from app.api.v1.routers import api_v1_routers
from app.infrastructure.database.adapters.pg_connection import DatabaseConnection
from app.infrastructure.logging.logger import configure_logging, get_logger
from app.infrastructure.middleware import LoggingMiddleware
from app.infrastructure.config.config import APP_CONFIG, BASE_DIR
from app.core.clients.elasticsearch_client import ElasticsearchClient
from app.core.clients.taskiq_client import TaskiqClient
from app.core.services.ml_service import MLService
from app.utils.test_db import sync_test_users_to_es



configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app):
    logger.info("application_startup", app_name=APP_CONFIG.APP_NAME, debug=APP_CONFIG.DEBUG)
    
    try:
        db_connection = DatabaseConnection()
        es_client = ElasticsearchClient()
        taskiq_client = TaskiqClient()

        await db_connection.init_test_db()
        await es_client.init_indices()
        await taskiq_client.startup()

        async with await db_connection.get_session() as session:
            await sync_test_users_to_es(
                session=session,
                es_client=es_client,
                ml_service=MLService()
            )
    except Exception as e:
        logger.error("application_startup_error", error=e)
    
    logger.info("database_connected")
    logger.info("elasticsearch_initialized")
    logger.info("taskiq_client_initialized")
    yield

    await taskiq_client.shutdown()
    
    logger.info("application_shutdown")


app = FastAPI(
    title=APP_CONFIG.APP_NAME,
    debug=APP_CONFIG.DEBUG,
    lifespan=lifespan
)
Instrumentator().instrument(app).expose(app)


di_container = setup_container()
setup_dishka_fastapi(di_container, app)


app.add_middleware(
    CORSMiddleware,
    allow_origins=APP_CONFIG.CORS_ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(LoggingMiddleware)

static_dir = BASE_DIR / "static"
if not static_dir.exists():
    static_dir.mkdir(parents=True, exist_ok=True)
    logger.info("static_directory_created", path=str(static_dir))

app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
logger.info("static_files_mounted", directory=str(static_dir))

app.include_router(api_v1_routers)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    try:
        errors = []
        for error in exc.errors():
            field = error["loc"]
            input = error["input"]
            message = error["msg"]

            if isinstance(input, dict):
                input = input.get(field[-1])
            elif isinstance(input, bytes):
                input = "invalid file"

            errors.append(
                {
                    "location": " -> ".join(field),
                    "detail": message,
                    "input": input,
                }
            )
        return JSONResponse(content=errors, status_code=422)
    except TypeError:
        return JSONResponse(
            status_code=422, content={"detail": exc.errors()}
        )
