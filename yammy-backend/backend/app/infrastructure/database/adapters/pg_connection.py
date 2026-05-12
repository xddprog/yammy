from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.infrastructure.config.config import DB_CONFIG
from app.infrastructure.database.models.base import Base
from app.utils.loaders.test_db import init_test_db
from app.infrastructure.logging.logger import get_logger

# import app.infrastructure.database.events.is_active


logger = get_logger(__name__)


class DatabaseConnection:
    def __init__(self):
        self._engine = create_async_engine(
            url=DB_CONFIG.get_url(is_async=True),
        )

    async def get_session(self) -> AsyncSession:
        return AsyncSession(bind=self._engine)
        
    async def init_test_db(self, clear_db: bool = False) -> bool:
        async with self._engine.begin() as conn:
            if clear_db:
                await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        async with await self.get_session() as session:
            return await init_test_db(session)
        