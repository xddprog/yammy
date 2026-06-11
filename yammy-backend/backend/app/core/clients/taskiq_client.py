from taskiq_redis import RedisAsyncResultBackend, ListQueueBroker
from taskiq import AsyncBroker, TaskiqScheduler, PrometheusMiddleware
from taskiq.middlewares import SmartRetryMiddleware
from taskiq.schedule_sources import LabelScheduleSource

from app.infrastructure.config.config import REDIS_CONFIG
from app.infrastructure.logging.logger import get_logger

from taskiq.instrumentation import TaskiqInstrumentor


logger = get_logger(__name__)
_taskiq_instrumented = False


class TaskiqClient:
    def __init__(self) -> None:
        global _taskiq_instrumented
        if TaskiqInstrumentor and not _taskiq_instrumented:
            TaskiqInstrumentor().instrument()
            _taskiq_instrumented = True
        elif not TaskiqInstrumentor:
            logger.warning("taskiq_otel_instrumentor_unavailable")

        self.result_backend = RedisAsyncResultBackend(
            redis_url=f"redis://{REDIS_CONFIG.REDIS_HOST}:{REDIS_CONFIG.REDIS_PORT}/1"
        )

        middlewares = [
            SmartRetryMiddleware(
                default_retry_count=5,
                default_delay=10,
                use_jitter=True,
                use_delay_exponent=True,
                max_delay_exponent=120,
            ),
            PrometheusMiddleware(server_addr="0.0.0.0", server_port=9000),
        ]

        self.broker: AsyncBroker = ListQueueBroker(
            url=f"redis://{REDIS_CONFIG.REDIS_HOST}:{REDIS_CONFIG.REDIS_PORT}/0"
        ).with_middlewares(*middlewares).with_result_backend(self.result_backend)

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
