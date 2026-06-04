# Yammy — справочник проекта для следующего диалога с агентом

## Назначение этого файла

**Только справочная информация о проекте** — контекст для нового чата, без обязательства «доделать всё перечисленное».

| Это | Не это |
|-----|--------|
| Весь функционал, API, экраны, модели данных | Backlog на реализацию без запроса пользователя |
| Правила слоёв бэкенда | Рефакторинг «ради чистоты», новые абстракции |

**Подключение:** `@docs/GLOBAL.md`  
**Репозиторий:** `/Users/mago/yammy` · **Обновлено:** 2026-06-04

---

## Правила для агента (обязательно)

### Не усложнять код

- Минимальный diff, только запрос пользователя.
- Без over-engineering: лишние хелперы, Manager/UseCase-слои, дублирующие обёртки.
- Расширять существующие `*Service` / `*Repository` / роутер / DTO домена.
- Коммиты / PR / push — только по явной просьбе.

### Бэкенд: исходная архитектура, чёткие слои

**Вся бизнес-логика — в `core/services/`.**

```
api/v1/routers/     → тонко: auth, rate limit, FromDishka[Service], один вызов
core/services/      → ВСЯ бизнес-логика
core/repositories/  → только SQL/ORM
core/clients/       → Redis, ES, OpenRouter, Taskiq, Telegram, Yandex Pay
core/dto/           → схемы запросов/ответов
core/tasks/         → Taskiq → вызов метода сервиса
infrastructure/database/models/  → ORM без логики
```

| Слой | Нельзя |
|------|--------|
| Router | матчи, квоты, SQL, прямой репозиторий, raise ошибок |
| Repository | уведомления, бизнес-правила |
| Task | дублировать pipeline сервиса |

Эталон: `like_user` → `LikeService.add_like` → `LikeRepository`.

### Фронтенд

`entities/` (API, типы), `features/` (UI), `pages/`, `widgets/`, `shared/`. `ky` + `authApi`, `throwApiError`.

---

## Стек и инфраструктура

| Компонент | Назначение |
|-----------|------------|
| **Postgres** | users, photos, likes, matches, chats, messages, filters, reports, ratings, ai_search_history, payments (модель), subscriptions |
| **Redis** | seen-лента, буфер дизлайков, буфер appearance ratings, кэш user vector |
| **Elasticsearch** | поиск анкет в ленте, скоринг, trait boosts |
| **Taskiq** | `flush_dislikes`, `flush_appearance_ratings`, `process_ai_search_history` |
| **ML** (`ml_service`) | эмбеддинги bio, модерация текста/фото, детекция лиц |
| **OpenRouter** | AI search (LLM отбор кандидатов) |
| **Telegram Bot** | push: лайк, новый матч (`notification_service`) |

Запуск: `yammy-backend/docker compose up -d`, фронт `cd yammy-frontend && npm run dev`.

---

## Карта API (`/api/v1`)

Префиксы из `api/v1/routers/client/__init__.py`. Защищённые роуты — JWT (`get_current_user`), кроме auth и WS с `access_token` в query.

### Auth — `auth_service` · `/auth`

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/telegram` | TMA: полная анкета → access + refresh; иначе onboarding access (~2ч, без refresh) |
| POST | `/onboarding/finish` | multipart: `profile` (JSON `OnboardingFinishRequest` с `photos[{order,is_main}]`), `images[]` (в том же порядке) → user + фото + полные JWT |
| GET | `/onboarding/filters` | Каталог фильтров (onboarding JWT) |
| GET | `/onboarding/cities` | Подсказки городов (onboarding JWT) |
| POST | `/moderate/text` | Проверка текста при онбординге (без сохранения) |
| POST | `/moderate/image` | Проверка фото при выборе (`?is_main=`, без сохранения) |
| POST | `/dev/token` | Dev-only: токен по `user_id` |
| GET | `/current_user` | Сессия (`CurrentUserSessionSchema`) |
| POST | `/refresh` | Обновление access по refresh |

---

### Пользователь и профиль — `user_service`, `moderation_service` · `/users`

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/` | Профиль текущего пользователя (`UserProfileSchema`) |
| PUT | `/` | Обновление анкеты (`UserUpdateRequest`: имя, возраст, bio, город, работа, образование, цель знакомства, фильтры-теги, язык и т.д.) |
| POST | `/image` | Загрузка фото (+ `moderation_service` до сохранения) |
| DELETE | `/image?image_id=` | Удаление фото |
| PATCH | `/image/{id}/order` | Порядок фото в галерее |
| PATCH | `/image/main` | Главное фото: upload или `existing_image_id` |

**Поля пользователя (важное):** `telegram_id`, `gender`, `relationship_goal`, `subscription_tier` (free/vip/premium), `subscription_expires_at`, `superlikes_balance`, `boosts_balance`, `boost_expires_at`, `profile_moderation_approved`, `is_banned`, `adequacy_score`, `activity_score`, `last_seen`, `notifications_enabled`, `language` (ru/en).

**Фронт:** `pages/(main)/profilePage/` — просмотр/редактирование, фото, характеристики из каталога фильтров; отображение баланса суперлайков/бустов.

---

### Поиск ленты (свайп) — `search_service` · `POST /users/search`

Основная лента на **дашборде** (`?mode=swipe` по умолчанию).

**Тело `SearchRequest`:** пол, возраст, цель, город, сферы работы, образование, **filters** (теги `category:sub:code` или nested dict), веса appearance/social/personality, `only_online`, `only_premium`, `show_seen`.

**Логика (`SearchService`):**

- ES-запрос через `UserSearchQueryBuilder` + вектор личности из bio (`MLService` / Redis cache).
- Исключения: уже seen (Redis), лайки/дизлайки, матчи; слоты для **boosted** анкет.
- `match_percentage` в ответе; лимит выдачи ~30 карточек.
- Fallback по городу, если мало результатов.

**Фронт:** `useUsersSearch`, `SwipeFeed`, фильтры в оверлее (`features/matches-filter`), `Header` — кнопка фильтров и переключение swipe/rate по клику на лого.

---

### Входящие лайки — `search_service` · `GET /users/likes`

Пагинация `PaginationRequestModel` → список **`UserSearchResponseSchema`** (кто лайкнул, с match %).

Исключаются пары, уже ставшие **Match**.

**Фронт:** `pages/(main)/likesPage/`, сетка `LikesCard`, ответ взаимным like/dislike из оверлея профиля.

**Суперлайк в API списка:** пока **нет** `like_type` / `message` (см. § Незавершённое).

---

### Лайки и дизлайки — `like_service` · `/likes`

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/` | Лайк `user_to_id`; при взаимном — матч + JSON `{message: "У вас новый метч!"}` иначе 204 + Telegram «X лайкнул вас» |
| POST | `/dislike` | Дизлайк в Redis-буфер (`LikeCacheKeys.DISLIKE_BUFFER`), flush таской в БД |
| POST | `/match` | Служебный like+match (rate limit) |

**Seen:** после like/dislike user_to попадает в Redis seen (`LikeService`).

**Enum `LikeTypeEnum`:** `like`, `dislike`, `superlike` — в БД; суперлайк **без отдельного endpoint** в роутере сейчас.

**Фронт:** `entities/like/api/likeService.ts` — `sendUserLike`, `sendUserDislike`; суперлайк UI (`superLikeOverlay`, long-press) часто вызывает обычный лайк.

---

### AI Search (премиум) — `ai_search_service` · `/users/search/ai/history`

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/search/ai/history` | Создать job (`query_text`), enqueue `process_ai_search_history` |
| GET | `/search/ai/history` | Список jobs + `remaining_today` (лимит по `subscription_tier`) |
| GET | `/search/ai/history/{id}` | Статус job (без полного `results_json` в ответе) |
| GET | `/search/ai/history/{id}/feed` | Лента: профили из Postgres + `highlight` из LLM, порядок из результата |

Статусы: `searching`, `ready`, `failed`. Квота: failed не в счётчик дня. Feed без уже лайкнутых/дизлайкнутых.

**Фронт:** `/ai-search`, `/ai-search/:jobId/results`, `entities/ai-search/`, `features/ai-search/`, вход с дашборда (иконка Bot в `Header`).

---

### Фильтры анкеты (каталог) — `filter_service` · `GET /filters/`

Иерархия **Category → Subcategory → Option**; пользователь хранит выбранные option id в `UserFilterAssociation`.

Используется в поиске (ES trait boosts), профиле, AI preview. **`GET /filters/`** — полный JWT; онбординг — **`GET /auth/onboarding/filters`**.

**Фронт:** `useFiltersMetadata`, `filterOptionIdsToUserFilters`, секции в карточке матча.

---

### Справочники — `city_service`, `university_service`

| Префикс | Назначение |
|---------|------------|
| `GET /cities` | Поиск городов (query) |
| `GET /universities` | Поиск вузов (query) |

Используются при регистрации/редактировании профиля (когда формы будут готовы).

---

### Рейтинг внешности — `appearance_rating_service`, `search_service` · `/appearance-ratings`

| Метод | Назначение |
|-------|------------|
| GET | Кандидаты для оценки (`get_users_for_appearance_rating`, limit 20) |
| POST | Оценка 1–10 (`AppearanceRatingRequest`) → буфер Redis, flush таской |

**Фронт:** дашборд `?mode=rate`, `RateFeed`, `appearanceRatingService`.

---

### Чаты и сообщения — `chat_service`, `message_service`, `websocket_service` · `/chats`

| Метод | Назначение |
|-------|------------|
| GET | `/` — список чатов пользователя (пагинация), превью последнего сообщения, собеседник |
| WS | `/{match_id}?access_token=` — real-time чат |

**События WebSocket (`ChatEvents`):**

| event | Действие |
|-------|----------|
| `open_chat` | Метаданные чата по match_id |
| `messages` | История (пагинация) |
| `message` | Отправка (`MessageCreateRequest`) |
| `read` | Прочитано |
| `delete` | Удаление сообщения |
| `edit` | Редактирование |
| `typing` | Индикатор набора (broadcast кроме отправителя) |
| `error` | Ошибки API в WS |

Матч создаётся при взаимном лайке (`LikeRepository.create_match`); чат привязан к match.

**Фронт:** `pages/(main)/chatsPage/`, `chatDetailPage`, `entities/chat/` (`useChatsList`, `useChatWebSocket`), navbar скрывается в деталке чата.

---

### Presence (онлайн) — `presence_service` · WS `/presence/ws`

| event | Назначение |
|-------|------------|
| `heartbeat` | Продление сессии, обновление `last_seen` |
| `subscribe_peers` | Подписка на статусы peer user ids |
| `presence_snapshot` / `presence_update` | Ответы сервера |

**Фронт:** `PresenceProvider` в `rootPage`, хуки `usePresence`, `useGlobalPresence`; «был(а) …» в списке чатов.

---

### Жалобы — `report_service` · `POST /reports/`

Причины: `spam`, `inappropriate_content`, `harassment`, `fake_profile`, `other`. Дубликат на того же user в течение 1 часа — ошибка.

**Фронт:** форма в `matchesCard` / оверлей профиля, `entities/report/api/reportService.ts`.

---

### Admin API — `/admin` (отдельно от клиента)

| Префикс | Назначение |
|---------|------------|
| `/admin/auth` | login, current_user, refresh для админов |
| `/admin/filters` | GET каталог фильтров (админка) |

---

## Фоновые задачи (Taskiq)

| Task | Назначение |
|------|------------|
| `flush_dislikes_to_database` | Redis dislike buffer → `likes` с `DISLIKE` |
| `flush_appearance_ratings_to_database` | Redis ratings → `ratings` |
| `process_ai_search_history` | Pipeline OpenRouter в `AiSearchService.process_history_item` |

Регистрация: импорт `app.core.tasks` в `taskiq_client.py`.

---

## Модели данных (Postgres) — кратко

| Таблица / сущность | Назначение |
|--------------------|------------|
| `users`, `photos` | Анкета |
| `likes` | like / dislike / superlike (пара user_from → user_to); `message` — для суперлайка (колонка может быть локально) |
| `matches` | Взаимный интерес |
| `chats`, `messages` | Переписка после матча |
| `filter_*`, `user_filter_association` | Характеристики анкеты |
| `ratings` | Оценки внешности |
| `reports` | Жалобы |
| `ai_search_history` | Jobs AI поиска |
| `blocks` | Модель есть, **публичного API нет** |
| `payments`, `subscription_history` | Модели + `yandex_pay_client`, **публичного API оплаты нет** |

---

## Фронтенд: экраны и навигация

**Navbar:** Метчи (chats) · Лайки · **Главная** (dashboard) · Профиль.

| Маршрут | Страница | Функционал |
|---------|----------|------------|
| `/dashboard` | `dashboardPage` | Свайп-лента (`SwipeFeed`) или рейтинг (`RateFeed`, `?mode=rate`); like/dislike; оверлей профиля; суперлайк UI |
| `/likes` | `likesPage` | Входящие лайки, infinite scroll |
| `/chats` | `chatsPage` | Список матчей/чатов |
| `/chats/:id` | `chatDetailPage` | WS-чат, сообщения, typing, presence |
| `/profile` | `profilePage` | Просмотр/редактирование анкеты и фото |
| `/ai-search` | `aiSearchPage` | История AI jobs, запуск нового поиска |
| `/ai-search/:jobId/results` | `aiSearchResultsPage` | Лента результатов + highlight |
| `/onboarding` | `onboardingPage` | Первичная регистрация (4 шага, без navbar) |

**Общие UI:** `widgets/header` (фильтры, AI, swipe↔rate), `features/matches-feed` (карточки, свайп, оверлей, report), `features/matches-filter`, `features/likes-feed`, `features/ai-search`.

---

## Домены → сервисы (бэкенд)

| Домен | Service |
|--------|---------|
| Auth | `auth_service` |
| Профиль, фото | `user_service`, `image_service`, `moderation_service` |
| Лента, входящие лайки | `search_service` |
| Лайки/матчи | `like_service` |
| AI search | `ai_search_service` |
| Фильтры (каталог) | `filter_service` |
| Города / вузы | `city_service`, `university_service` |
| Appearance rating | `appearance_rating_service` (+ выдача кандидатов в `search_service`) |
| Чаты | `chat_service` |
| Сообщения | `message_service` |
| WebSocket hub | `websocket_service` |
| Presence | `presence_service` |
| Жалобы | `report_service` |
| Уведомления | `notification_service` |
| ML | `ml_service` |

---

## Незавершённое / частично (не путать с «нет в продукте»)

| Фича | Состояние |
|------|-----------|
| **Суперлайк end-to-end** | UI есть; `POST /likes/superlike`, списание баланса, `GET /likes` с message — **нет** |
| **Оплата / подписка** | Поля user + модели Payment; API и UI оплаты **нет** |
| **Block** | ORM без API |

Типичные грабли AI search: Taskiq register, scalar id до LLM, не failed при partial results, OpenRouter 429.

---

## Команды

```bash
cd yammy-backend && docker compose up -d
cd yammy-frontend && npm run dev
cd yammy-backend/backend && python3 -m compileall app
```

Секреты — только `.env`. SQL для `likes.message` при старой БД: добавить колонку вручную, если модель уже с `message`.

---

*Последнее (2026-06-04): финиш онбординга — `OnboardingFinishRequest` + фото в одном `POST /auth/onboarding/finish`.*

*В конце файла при крупных изменениях: строка «Последнее (дата): …».*
