#!/bin/sh
set -e

cd /app

if [ "${APP_CONFIG__ENVIRONMENT:-development}" = "production" ]; then
  if python scripts/bootstrap_empty_db.py; then
    alembic stamp head
  else
    alembic upgrade head
  fi
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
