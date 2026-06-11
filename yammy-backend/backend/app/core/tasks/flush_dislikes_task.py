from dishka.integrations.taskiq import FromDishka, inject

from app.core.clients.taskiq_client import broker
from app.core.services.like_service import LikeService
from app.infrastructure.logging.logger import get_logger


logger = get_logger(__name__)


@broker.task(
    'flush_dislikes_to_database',
    schedule=[{"cron": "*/15 * * * *"}],
    retry_on_error=True,
    max_retries=3,
    delay=30,
)
@inject(patch_module=True)
async def flush_dislikes_to_database(like_service: FromDishka[LikeService]):
    logger.info("Starting dislikes flush task...")
    result = await like_service.flush_dislikes_to_db()
    logger.info(f"Flushed {result['flushed']} dislikes")
    logger.info("Dislikes flush completed")
