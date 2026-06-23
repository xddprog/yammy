from uuid import UUID

from dishka.integrations.taskiq import FromDishka, inject

from app.core.clients.taskiq_client import broker
from app.core.services.tarot_compatibility_service import TarotCompatibilityService
from app.infrastructure.logging.logger import get_logger


logger = get_logger(__name__)


@broker.task("process_tarot_compatibility", retry_on_error=True, max_retries=6, delay=20)
@inject(patch_module=True)
async def process_tarot_compatibility(
    history_id: str,
    tarot_compatibility_service: FromDishka[TarotCompatibilityService],
) -> None:
    logger.info("process_tarot_compatibility_started", history_id=history_id)
    await tarot_compatibility_service.process_history_item(UUID(history_id))
    logger.info("process_tarot_compatibility_finished", history_id=history_id)
