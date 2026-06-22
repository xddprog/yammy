#!/bin/sh
set -e

cd /app

if [ "${APP_CONFIG__ENVIRONMENT:-development}" = "production" ]; then
  alembic upgrade head
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
