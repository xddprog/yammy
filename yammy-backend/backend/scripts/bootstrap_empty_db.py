"""Create schema from SQLAlchemy models when the database is empty (fresh prod deploy)."""

import asyncio
import sys

from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import create_async_engine

from app.infrastructure.config.config import DB_CONFIG
from app.infrastructure.database.models.base import Base
import app.infrastructure.database.models  # noqa: F401


async def _bootstrap() -> bool:
    engine = create_async_engine(DB_CONFIG.get_url(is_async=True))
    async with engine.begin() as conn:
        tables = await conn.run_sync(
            lambda sync_conn: inspect(sync_conn).get_table_names()
        )
        if tables:
            return False
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    return True


if __name__ == "__main__":
    sys.exit(0 if asyncio.run(_bootstrap()) else 1)
