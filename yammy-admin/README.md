# Yammy Admin

Desktop admin panel: stats, user lookup, profile moderation, reports.

**Полная документация:** [docs/ADMIN.md](../docs/ADMIN.md)

## Dev

```bash
# 1. Backend on :8000
cd yammy-backend/backend && alembic upgrade head

# 2. Admin UI on this repo
cd yammy-admin && npm install && npm run dev
```

Login: `admin/admin` (admin) · `support/support` (support)

Dev-сервер проксирует `/admin` и `/static` на backend. API URL можно переопределить через `VITE_API_BASE_URL`.

## Docker

```bash
# Сборка и запуск в контейнере
docker compose up --build

# Приложение доступно по адресу: http://localhost:5174
```

Остановка:

```bash
docker compose down
```

Для production-сборки задай URL API:

```bash
VITE_API_BASE_URL=https://api.lascovo.ru npm run build
```

или через build-arg в CI/CD.
