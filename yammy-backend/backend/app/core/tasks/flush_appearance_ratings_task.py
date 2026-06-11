from dishka.integrations.taskiq import FromDishka, inject

from app.core.clients.taskiq_client import broker
from app.core.services.appearance_rating_service import AppearanceRatingService
from app.infrastructure.logging.logger import get_logger


logger = get_logger(__name__)


@broker.task(
    'flush_appearance_ratings_to_database',
    schedule=[{"cron": "*/15 * * * *"}],
    retry_on_error=True,
    max_retries=3,
    delay=30,
)
@inject(patch_module=True)
async def flush_appearance_ratings_to_database(appearance_rating_service: FromDishka[AppearanceRatingService]):
    logger.info("Starting appearance ratings flush task...")
    result = await appearance_rating_service.flush_appearance_ratings_to_db()
    logger.info(f"Flushed {result['flushed']} appearance ratings")
    logger.info("Appearance ratings flush completed")
