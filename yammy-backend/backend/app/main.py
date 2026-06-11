from pathlib import Path

from dishka.integrations.fastapi import setup_dishka as setup_dishka_fastapi
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.v1.dependency.setup import setup_container
from app.api.v1.routers import api_v1_routers
from app.infrastructure.logging.logger import configure_logging, get_logger
from app.infrastructure.middleware import LoggingMiddleware
from app.infrastructure.config.config import APP_CONFIG, BASE_DIR
from app.lifespan import lifespan


configure_logging()
logger = get_logger(__name__)


app = FastAPI(
    title=APP_CONFIG.APP_NAME,
    debug=APP_CONFIG.DEBUG,
    lifespan=lifespan,
)
Instrumentator().instrument(app).expose(app)


di_container = setup_container()
setup_dishka_fastapi(di_container, app)


app.add_middleware(
    CORSMiddleware,
    allow_origins=APP_CONFIG.CORS_ALLOWED_ORIGINS.split(","),
    allow_origin_regex=r"https://yammy-[a-zA-Z0-9-]+\.vercel\.app",
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
