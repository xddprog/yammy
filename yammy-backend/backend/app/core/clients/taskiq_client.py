from taskiq_redis import RedisAsyncResultBackend, ListQueueBroker
from taskiq import AsyncBroker, TaskiqScheduler
from taskiq.schedule_sources import LabelScheduleSource
from app.infrastructure.config.config import REDIS_CONFIG


class TaskiqClient:
    def __init__(self) -> None:
        self.result_backend = RedisAsyncResultBackend(
            redis_url=f"redis://{REDIS_CONFIG.REDIS_HOST}:{REDIS_CONFIG.REDIS_PORT}/1"
        )

        self.broker: AsyncBroker = ListQueueBroker(
            url=f"redis://{REDIS_CONFIG.REDIS_HOST}:{REDIS_CONFIG.REDIS_PORT}/0"
        ).with_result_backend(self.result_backend)

        self.scheduler = TaskiqScheduler(
            broker=self.broker,
            sources=[LabelScheduleSource(self.broker)]
        )

    async def startup(self):
        if not self.broker.is_worker_process:
            await self.broker.startup()

    async def shutdown(self):
        if not self.broker.is_worker_process:
            await self.broker.shutdown()


taskiq_client = TaskiqClient()

broker = taskiq_client.broker
scheduler = taskiq_client.scheduler


def _setup_dishka():
    from dishka.integrations.taskiq import setup_dishka
    from app.api.v1.dependency.setup import setup_container
    
    container = setup_container()
    setup_dishka(container, broker)


def _register_tasks() -> None:
    import app.core.tasks  # noqa: F401 — регистрация @broker.task для worker


_setup_dishka()
_register_tasks()
