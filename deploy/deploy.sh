#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ ! -f "$ROOT/yammy-backend/backend/.env" ]]; then
  echo "Missing yammy-backend/backend/.env — copy from local machine before deploy."
  exit 1
fi

echo "==> Swap (4GB, if missing)"
if [[ ! -f /swapfile ]]; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Nginx (yammy.fun / api.yammy.fun)"
cp "$ROOT/deploy/nginx/yammy.conf" /etc/nginx/conf.d/yammy.conf
nginx -t
systemctl reload nginx

echo "==> Backend (db, redis, elasticsearch, app only — 4GB RAM)"
mkdir -p "$ROOT/yammy-backend/static" "$ROOT/yammy-backend/hf_model_cache"
cd "$ROOT/yammy-backend"
docker compose build app
docker compose stop worker scheduler 2>/dev/null || true
docker rm -f grafana prometheus 2>/dev/null || true
docker compose up -d db redis elasticsearch app

echo "==> Frontend"
cd "$ROOT/yammy-frontend"
docker compose build
docker compose up -d

echo "==> Status"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo "==> Health"
sleep 20
curl -sf -o /dev/null -w "api: %{http_code}\n" http://127.0.0.1:8000/docs || echo "api: not ready"
curl -sf -o /dev/null -w "front: %{http_code}\n" http://127.0.0.1:3000/ || echo "front: not ready"
