from uuid import UUID

from dishka.integrations.taskiq import FromDishka, inject

from app.core.clients.taskiq_client import broker
from app.core.services.ai_search_service import AiSearchService
from app.infrastructure.logging.logger import get_logger


logger = get_logger(__name__)


@broker.task("process_ai_search_history")
@inject(patch_module=True)
async def process_ai_search_history(history_id: str, ai_search_service: FromDishka[AiSearchService]) -> None:
    logger.info("process_ai_search_history_started", history_id=history_id)
    await ai_search_service.process_history_item(UUID(history_id))
    logger.info("process_ai_search_history_finished", history_id=history_id)
