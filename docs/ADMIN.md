# Yammy Admin — справочник

Отдельная desktop-панель для модерации и аналитики. Клиентское TMA-приложение (`yammy-frontend`) админку **не содержит**.

**Репозиторий:** `yammy-admin/` · **Backend API:** `/admin` (не `/api/v1`) · **Обновлено:** 2026-06-25

---

## Быстрый старт (dev)

1. Backend: `http://localhost:8000`
2. Миграция: `cd yammy-backend/backend && alembic upgrade head`
3. Админка: `cd yammy-admin && npm install && npm run dev` → http://localhost:5174
4. Vite проксирует `/admin` → backend

**Учётки (seed в `test_db.py`):**

| Login | Password | Role |
|-------|----------|------|
| `admin` | `admin` | admin |
| `support` | `support` | support |

---

## Роли (RBAC)

| | Admin | Support |
|---|:-----:|:-------:|
| Dashboard / stats | ✓ | — |
| Users: поиск + карточка + actions | ✓ | — |
| Profile moderation (`profile_moderation_approved`) | ✓ | ✓ |
| Reports: список user + count | ✓ | ✓ |
| Reports: деталка + actions на репорт | ✓ | ✓ |
| Support inbox (Telegram тикеты) | ✓ | ✓ |
| Ban / subscription / balances | ✓ | — |

Support после логина → `/support`. Admin → `/dashboard`.

---

## Frontend (`yammy-admin/`)

**Стек:** React 19, Vite, TanStack Query, ky, Tailwind, recharts.

| Route | Экран | Доступ |
|-------|-------|--------|
| `/login` | Login | public |
| `/dashboard` | KPI + графики | admin |
| `/users`, `/users/:id` | Поиск + карточка user | admin |
| `/moderation/profiles` | Очередь модерации профилей | admin, support |
| `/moderation/profiles/:id` | Review + approve/reject | admin, support |
| `/moderation/reported-users` | User + count жалоб | admin, support |
| `/moderation/reported-users/:id` | Профиль + список репортов | admin, support |
| `/support` | Inbox тикетов Telegram-бота | admin, support |
| `/support/:id` | Переписка + ответ + close/reopen | admin, support |

**Auth на клиенте:** `localStorage` keys `yammy_admin_*`, Bearer в `adminApi` (`src/shared/api/adminApi.ts`).

---

## Backend API

**Auth:** `POST /admin/auth/login` → `{ access_token, refresh_token }`. Все protected endpoints — header `Authorization: Bearer …`, JWT `scope: staff`.

### Auth
| Method | Path | Описание |
|--------|------|----------|
| POST | `/admin/auth/login` | username + password |
| GET | `/admin/auth/current_user` | `{ id, username, role, created_at }` |
| POST | `/admin/auth/refresh` | refresh token |

### Stats (admin only)
| Method | Path | Описание |
|--------|------|----------|
| GET | `/admin/stats/overview?period=7d\|30d\|90d` | KPI, growth, engagement, monetization, AI, safety |

### Moderation (admin + support)
| Method | Path | Описание |
|--------|------|----------|
| GET | `/admin/moderation/profiles` | Очередь `profile_moderation_approved=false` |
| GET | `/admin/moderation/profiles/{user_id}` | Профиль для review |
| PATCH | `/admin/moderation/profiles/{user_id}` | `{ approved, note? }` |
| GET | `/admin/moderation/reported-users` | User + `pending/total` count (не flat reports) |
| GET | `/admin/moderation/reported-users/{user_id}` | User + список репортов |
| POST | `/admin/moderation/reported-users/{user_id}/resolve-all` | Пометить все pending → reviewed |

### Users (admin only)
| Method | Path | Описание |
|--------|------|----------|
| GET | `/admin/users/` | Поиск: `q`, `city`, `is_banned`, `subscription_tier`, `profile_moderation_approved` |
| GET | `/admin/users/{user_id}` | Detail + per-user stats |
| GET | `/admin/users/{user_id}/reports` | Жалобы на user |
| PATCH | `/admin/users/{user_id}/ban` | `{ is_banned }` → sync ES |
| PATCH | `/admin/users/{user_id}/subscription` | `{ tier, expires_at? }` + `subscription_history` |
| PATCH | `/admin/users/{user_id}/balances` | superlikes / boosts |
| PATCH | `/admin/users/{user_id}/moderation` | `{ profile_moderation_approved }` |

### Reports (admin + support)
| Method | Path | Описание |
|--------|------|----------|
| PATCH | `/admin/reports/{report_id}` | `{ status: reviewed\|dismissed, review_note? }` |

### Support (admin + support)
| Method | Path | Описание |
|--------|------|----------|
| GET | `/admin/support/conversations` | Inbox; `?status=open\|closed`, пагинация |
| GET | `/admin/support/conversations/{id}` | Деталь тикета + превью user |
| GET | `/admin/support/conversations/{id}/messages` | История сообщений |
| POST | `/admin/support/conversations/{id}/messages` | `{ content }` → Telegram + БД |
| PATCH | `/admin/support/conversations/{id}` | `{ status: open\|closed }` |

**Support-бот (отдельный Telegram):** `SUPPORT_TELEGRAM_CONFIG__BOT_TOKEN`, контейнер `support-bot`, webhook `https://api.yammy.fun/api/v1/support/telegram/webhook`.

### Прочее
| Method | Path | Описание |
|--------|------|----------|
| GET | `/admin/filters/` | Каталог фильтров (admin) |

---

## Ключевые файлы

### Backend
| Путь | Назначение |
|------|------------|
| `app/api/v1/dependency/staff_auth.py` | `get_current_staff`, `require_admin` |
| `app/api/v1/routers/admin/` | Роутеры admin API |
| `app/core/services/admin_stats_service.py` | Dashboard stats |
| `app/core/services/admin_user_service.py` | Users, moderation, reports |
| `app/infrastructure/database/models/admin.py` | `admins.role` |
| `app/infrastructure/database/models/report.py` | `status`, `reviewed_at`, `review_note` |
| `migrations/versions/20260619_admin_panel.py` | Миграция admin panel |

### Frontend
| Путь | Назначение |
|------|------------|
| `src/entities/admin-auth/api.ts` | API-методы |
| `src/app/AdminAuthGate.tsx` | Auth gate + RoleGuard |
| `src/widgets/AdminLayout.tsx` | Sidebar |
| `src/widgets/UserDetailView.tsx` | Карточка + reports + actions |

---

## Модель данных (дополнения)

- **`admins.role`:** `admin` | `support`
- **`users.profile_moderation_approved`:** сбрасывается в `false` при смене фото; approve через moderation API
- **`reports.status`:** `pending` | `reviewed` | `dismissed`

---

## UX-модель жалоб

1. **Список** — пользователи с `pending_reports_count` / `total_reports_count` (не плоский inbox репортов).
2. **Деталка** — preview профиля + все репорты с actions (dismiss / reviewed).
3. **Admin users** — тот же компонент списка репортов на вкладке в `/users/:id`.

---

## Post-MVP (не реализовано)

- CRUD staff-аккаунтов через UI
- UI управления каталогом фильтров
- Audit log модерации
- Export CSV
