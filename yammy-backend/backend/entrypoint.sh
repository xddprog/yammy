#!/bin/sh
set -e

cd /app

if [ "${APP_CONFIG__ENVIRONMENT:-development}" = "production" ]; then
  if PYTHONPATH=/app python -c "
from sqlalchemy import create_engine, inspect
from app.infrastructure.config.config import DB_CONFIG
with create_engine(DB_CONFIG.get_url(is_async=False)).connect() as conn:
    raise SystemExit(0 if inspect(conn).has_table('alembic_version') else 1)
"; then
    alembic upgrade head
  else
    PYTHONPATH=/app python scripts/bootstrap_empty_db.py
  fi
fi

if [ "$#" -gt 0 ]; then
  exec "$@"
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
