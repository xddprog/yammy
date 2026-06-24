#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ ! -f "$ROOT/yammy-backend/backend/.env" ]]; then
  echo "Missing yammy-backend/backend/.env — copy from local machine before deploy."
  exit 1
fi

echo "==> Nginx (yammy.fun / api.yammy.fun)"
cp "$ROOT/deploy/nginx/yammy.conf" /etc/nginx/conf.d/yammy.conf
nginx -t
systemctl reload nginx

echo "==> Backend"
mkdir -p "$ROOT/yammy-backend/static" "$ROOT/yammy-backend/hf_model_cache"
cd "$ROOT/yammy-backend"
docker compose build app
docker compose up -d

echo "==> Frontend"
cd "$ROOT/yammy-frontend"
docker compose build
docker compose up -d

echo "==> Status"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
