"""Create schema from SQLAlchemy models when the database is empty (fresh prod deploy)."""

import asyncio
import sys

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import create_async_engine

from app.infrastructure.config.config import DB_CONFIG
from app.infrastructure.database.models.base import Base
import app.infrastructure.database.models  # noqa: F401


def _stamp_head(sync_conn) -> None:
    head = ScriptDirectory.from_config(Config("/app/alembic.ini")).get_current_head()
    sync_conn.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS alembic_version (
                version_num VARCHAR(64) NOT NULL,
                CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
            )
            """
        )
    )
    sync_conn.execute(text("DELETE FROM alembic_version"))
    sync_conn.execute(
        text("INSERT INTO alembic_version (version_num) VALUES (:head)"),
        {"head": head},
    )


async def _bootstrap() -> bool:
    engine = create_async_engine(DB_CONFIG.get_url(is_async=True))
    async with engine.begin() as conn:
        tables = await conn.run_sync(
            lambda sync_conn: inspect(sync_conn).get_table_names()
        )
        if tables:
            return False
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_stamp_head)
    await engine.dispose()
    return True


if __name__ == "__main__":
    sys.exit(0 if asyncio.run(_bootstrap()) else 1)
