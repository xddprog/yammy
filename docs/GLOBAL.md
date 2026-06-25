# Yammy — справочник проекта для следующего диалога с агентом

## Назначение этого файла

**Только справочная информация о проекте** — контекст для нового чата, без обязательства «доделать всё перечисленное».

| Это | Не это |
|-----|--------|
| Весь функционал, API, экраны, модели данных | Backlog на реализацию без запроса пользователя |
| Правила слоёв бэкенда | Рефакторинг «ради чистоты», новые абстракции |

**Подключение:** `@docs/GLOBAL.md`  
**Репозиторий:** `/Users/mago/yammy` · **Обновлено:** 2026-06-23

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

**Старт приложения:** `main.tsx` → `ensureAppAuth()` (`bootstrapTelegramAuth.ts`) до рендера; `TelegramProvider` грузит `telegram-web-app.js` асинхронно (без блокировки белым экраном).

| Режим | Поведение |
|-------|-----------|
| **Prod TMA** | `POST /auth/telegram` с `initData`; есть user → access+refresh; нет user → **onboarding JWT** (~2ч, без refresh) |
| **DEV** | `VITE_DEV_AUTH=onboarding` → `POST /auth/dev/onboarding`; иначе dev token по `DEV_STUB_TELEGRAM_ID` (см. `config.py`) |
| **DEV без TMA** | `AppAuthGate` пропускает без токена; для API нужен dev-токен |

`AppAuthGate`: onboarding JWT → только `/onboarding`; полная сессия → редирект с `/onboarding` на `/dashboard`; `GET /users/` при бане.

**Dev-грабля онбординга:** `VITE_DEV_AUTH=onboarding` нужен для свежей регистрации. После успешного `POST /auth/onboarding/finish` фронт получает full access+refresh и чистит `yammy_onboarding_*` из `sessionStorage`. Если после reload/перезапуска снова выдан onboarding JWT (например, refresh не восстановился или dev-сервер всё ещё стартует в onboarding mode), `AppAuthGate` вернёт на `/onboarding`, а шаг будет 1, потому что sessionStorage уже очищен.

---

## Стек и инфраструктура

| Компонент | Назначение |
|-----------|------------|
| **Postgres** | users, photos, likes, matches, chats, messages, filters, reports, `appearance_rating_pairs`, ai_search_history, payments (модель), subscriptions |
| **Redis** | seen-лента, буфер дизлайков, кэш `appearance_rated_users`, idempotency уведомлений, presence last_seen buffer, кэш user vector |
| **Elasticsearch** | поиск анкет в ленте, скоринг, trait boosts |
| **Taskiq** | `flush_dislikes`, `flush_presence_last_seen_to_es`, `reconcile_users_index_daily`, `process_ai_search_history`, уведомления (like/match/mutual rating), reindex ES |
| **ML** (`ml_service`) | эмбеддинги bio, модерация текста/фото, детекция лиц |
| **OpenRouter** | AI search (LLM отбор кандидатов) |
| **Telegram Bot** | push: лайк, новый матч (`notification_service`) |
| **Support Bot** | отдельный aiogram-бот: тикеты в Telegram → админка `/support` |

Запуск: `yammy-backend/docker compose up -d`, фронт `cd yammy-frontend && npm run dev`.

---

## Карта API (`/api/v1`)

Префиксы из `api/v1/routers/client/__init__.py`. Защищённые роуты — JWT (`get_current_user`), кроме auth и WS с `access_token` в query.

### Auth — `auth_service` · `/auth`

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/telegram` | TMA: полная анкета → access + refresh; иначе onboarding access (~2ч, без refresh) |
| POST | `/onboarding/finish` | multipart: `profile` (JSON: имя, возраст, пол, город, цель, `education_level`, опц. `education_details`, bio, `filters[]` uuid опций, `notifications_enabled`, `photos[{order,is_main}]`), `images[]` → user + фото + полные JWT |
| GET | `/onboarding/filters` | Каталог фильтров (onboarding JWT) |
| GET | `/onboarding/cities` | Подсказки городов (onboarding JWT) |
| POST | `/auth/dev/onboarding` | Dev-only: onboarding JWT, если telegram_id ещё нет в БД |
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
| POST | `/{user_id}/view` | Записать просмотр детальной анкеты пользователя (204; self-view не считается) |
| POST | `/image` | Загрузка фото (+ `moderation_service` до сохранения) |
| DELETE | `/image?image_id=` | Удаление фото |
| PATCH | `/image/{id}/order` | Порядок фото в галерее |
| PATCH | `/image/main` | Главное фото: upload или `existing_image_id` |

**Поля пользователя (важное):** `telegram_id`, `gender`, `relationship_goal`, `subscription_tier` (free/vip/premium), `subscription_expires_at`, `superlikes_balance`, `boosts_balance`, `boost_expires_at`, `profile_views_count`, `profile_moderation_approved`, `is_banned`, `adequacy_score`, `activity_score`, `last_seen`, `notifications_enabled`, `language` (ru/en).

**Статистика профиля (`UserProfileSchema`):**

- `received_likes_count` — **все** входящие like/superlike за всё время (включая уже ставших match).
- `matches_count` — количество текущих матчей пользователя.
- `profile_views_count` — простой инкремент в `users`; история просмотров и «кто смотрел» не хранятся.
- `appearance_rating_average` — средний балл по **всем** полученным оценкам внешности.
- `received_appearance_ratings_count` — **все** полученные оценки за всё время (для чипа «Оценки» в профиле).
- `sent_appearance_ratings_count` — сколько оценок пользователь поставил другим.

**Фронт:** `pages/(main)/profilePage/` — просмотр/редактирование, фото, характеристики из каталога фильтров; отображение баланса суперлайков/бустов. Под `ProfileMainRow` — **две строки** по 3 чипа: «Лайкнули» / «Мэтчи» / «Просмотры» и «Ср. оценка» / «Оценки» / «Мои оценки». По клику на чип — нижний sheet с описанием метрики (как у рейтинга адекватности).

---

### Поиск ленты (свайп) — `search_service` · `POST /users/search`

Основная лента на **дашборде** (`?mode=swipe` по умолчанию).

**Тело `SearchRequest`:** пол, возраст, цель, город, сферы работы, образование, **filters** (nested `category_slug → sub_slug → option_slug[]`), **`search_text`** (семантический поиск по bio/имени/работе), веса appearance/social/personality, `only_online`, `show_seen` (поле `only_premium` в API есть, в UI фильтра ленты **нет**).

**Логика (`SearchService`):**

- ES-запрос: **все фильтры** (пол, возраст, город, цель, работа, образование, trait-boosts) всегда в запросе; `search_text` меняет только эмбеддинг для cosine по `personality_vector` (bio в индексе), без отключения фильтров.
- Без `search_text` — эмбеддинг bio текущего пользователя, сила cosine × `weight_personality` (слайдер приоритетов).
- С `search_text` — эмбеддинг текста запроса, cosine на полную (слайдер личности на вектор не влияет); фильтры и trait-boosts как обычно.
- Исключения: уже seen (Redis), лайки/дизлайки, матчи; слоты для **boosted** анкет.
- `match_percentage` в ответе; лимит выдачи ~30 карточек.
- Fallback по городу, если мало результатов.

**Фронт:** `useUsersSearch`, `SwipeFeed`, фильтры в оверлее (`features/matches-filter`), `Header` — кнопка фильтров и переключение swipe/rate по клику на лого.

#### Фильтры ленты (фронт) — `features/matches-filter`

| Поведение | Детали |
|-----------|--------|
| Черновик vs applied | В оверлее правится `state`; лента и API — только `appliedState` после **«Применить»** |
| Сохранение | `localStorage` ключ `yammy_feed_filters_v1`: пол, `ageRange`, город, **`searchText`**, цель, работа, образование, вуз, приоритеты (веса), dynamic `filters` |
| Загрузка | При старте `FiltersProvider` → `loadAppliedFiltersState()`; парсинг по полям (битый `priorities` не сбрасывает весь объект) |
| Каталог с бэка | После `GET /filters/` (или onboarding) — `reconcileFeedFiltersWithMetadata`: убрать slug категорий/опций, которых нет в актуальном каталоге (админка) |
| Закрытие оверлея | **×** и свайп вниз — откат черновика к `appliedState` (**не** `reset`, storage не трогается) |
| Сброс | Только явный сброс в UI → дефолты + `clearPersistedFeedFilters()` |

Код: `FiltersContext.tsx`, `persistedFeedFilters.ts`, `reconcileFeedFiltersWithMetadata.ts`, `filtersOverlayContent.tsx`, `useFiltersSearchParams` → `mapFiltersToSearchRequest`.

---

### Входящие лайки — `search_service` · `GET /users/likes`

Пагинация `PaginationRequestModel` → список **`UserSearchResponseSchema`** (кто лайкнул, с match %).

Исключаются пары, уже ставшие **Match** — только **неотвеченные** входящие (в отличие от `received_likes_count` в профиле, который считает все лайки за всё время).

**Фронт:** `pages/(main)/likesPage/` — переключатель **«Лайки» / «Оценки»**; lazy-загрузка активной вкладки (`enabled` в react-query). Лайки: сетка `LikesCard` + секция «Огоньки» для суперлайков. Оценки: `GET /appearance-ratings/received`, бейдж `score/10`, оверлей `fromRatings` с `RateCardActions`. Ответ взаимным like/dislike или оценкой из оверлея.

**Суперлайк в API списка:** есть `like_type` и `like_message` (оба optional в `UserSearchResponseSchema` / `UserSearchApiUser`).

**UX страницы лайков:** суперлайки (`like_type=superlike`) показываются отдельной секцией **«Огоньки»** полноширинными карточками с видимым `like_message`; обычные лайки — отдельной сеткой 2 колонки.

---

### Лайки и дизлайки — `like_service` · `/likes`

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/` | Лайк `user_to_id`; при взаимном — матч + JSON `{message: "У вас новый метч!"}` иначе 204 + Telegram «X лайкнул вас» |
| POST | `/superlike` | Суперлайк `user_to_id` + body `{message}`; сохраняет `like_type=superlike` и `likes.message` |
| POST | `/dislike` | Дизлайк в Redis-буфер (`LikeCacheKeys.DISLIKE_BUFFER`), flush таской в БД |
| POST | `/match` | Служебный like+match (rate limit) |

**Seen:** после like/dislike user_to попадает в Redis seen (`LikeService`).

**Enum `LikeTypeEnum`:** `like`, `dislike`, `superlike` — в БД; суперлайк имеет отдельный endpoint `POST /likes/superlike`.

**Фронт:** `entities/like/api/likeService.ts` — `sendUserLike`, `sendUserSuperLike`, `sendUserDislike`; суперлайк отправляется с текстом из `SuperLikeOverlay`.

**Счётчики:** `LikeRepository.count_received_likes` считает входящие лайки для профиля; `LikeRepository.count_matches` считает матчи. `UserRepository` не дублирует SQL лайков/матчей.

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
| GET `/appearance-ratings` | Кандидаты для оценки в ленте (`search_service.get_users_for_appearance_rating`, limit 20); exclude уже оцененных (Redis `appearance_rated_users` + fallback в PG) |
| GET `/appearance-ratings/received` | Входящие оценки **без ответа** (как `GET /users/likes`): пагинация, профиль из Postgres + `score` / `my_score` / `is_mutual` |
| POST `/appearance-ratings` | Оценка 1–10 → **сразу** `upsert` в `appearance_rating_pairs`; при взаимной оценке — Taskiq `send_mutual_appearance_rating_notification` (Telegram deep link) |

**Модель:** одна строка `appearance_rating_pairs` на пару пользователей (`user_a_id < user_b_id`), поля `score_by_a` / `score_by_b` и timestamps. Повторная оценка перезаписывает свой столбец.

**Сервисы:** `AppearanceRatingService` — POST, GET `/received`, mutual notify; `SearchService` — только выдача кандидатов для rate-ленты.

**Фронт:** дашборд `?mode=rate`, `RateFeed` / `RateCard` (фото отдельно, кнопки 1–10 снизу; fade-переход между карточками после оценки), `appearanceRatingService`, app-guide шаги `mode-toggle` и `mutual-rating`.

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

### Admin panel

Отдельное приложение **`yammy-admin/`** + API **`/admin`** (Bearer JWT, roles `admin` / `support`).

| Роль | Доступ |
|------|--------|
| **admin** | Dashboard stats, users search/actions, moderation, reports |
| **support** | Profile moderation + reported users + **support inbox** (без stats и ban) |

Dev: `admin/admin`, `support/support` · миграция `20260619_admin_panel`.

**Подробно:** [docs/ADMIN.md](./ADMIN.md)

---

## Фоновые задачи (Taskiq)

| Task | Назначение |
|------|------------|
| `flush_dislikes_to_database` | Redis dislike buffer → `likes` с `DISLIKE` |
| `flush_presence_last_seen_to_es` | Redis presence buffer → `last_seen` в ES |
| `reconcile_users_index_daily` | Nightly backstop синхронизации users → ES |
| `process_ai_search_history` | Pipeline OpenRouter в `AiSearchService.process_history_item` |
| `send_like_notification` | Telegram: входящий лайк/суперлайк |
| `send_match_notification` | Telegram: новый матч |
| `send_mutual_appearance_rating_notification` | Telegram: взаимная оценка внешности (`tg://user?id=`) |
| `reindex_user_in_es`, `sync_user_ban_status_to_es` | Event-driven синхронизация ES |

Оценки внешности **не** буферизуются в Redis — POST пишет в Postgres синхронно.

Регистрация: импорт `app.core.tasks` в `taskiq_client.py`. Подробнее: [TASKIQ_TASKS_EXPLANATION.md](./TASKIQ_TASKS_EXPLANATION.md).

---

## Модели данных (Postgres) — кратко

| Таблица / сущность | Назначение |
|--------------------|------------|
| `users`, `photos` | Анкета; `users.profile_views_count` — простой счетчик открытий детальной анкеты |
| `likes` | like / dislike / superlike (пара user_from → user_to); `message` — для суперлайка (колонка может быть локально) |
| `matches` | Взаимный интерес |
| `chats`, `messages` | Переписка после матча |
| `filter_*`, `user_filter_association` | Характеристики анкеты |
| `appearance_rating_pairs` | Оценки внешности (пара пользователей, два направленных score) |
| `reports` | Жалобы |
| `ai_search_history` | Jobs AI поиска |
| `blocks` | Модель есть, **публичного API нет** |
| `payments`, `subscription_history` | Модели + `yandex_pay_client`, **публичного API оплаты нет** |

---

## Фронтенд: экраны и навигация

**Navbar:** Метчи (chats) · Лайки · **Главная** (dashboard) · Профиль.

| Маршрут | Страница | Функционал |
|---------|----------|------------|
| `/dashboard` | `dashboardPage` | Свайп-лента (`SwipeFeed`) или рейтинг (`RateFeed`, `?mode=rate`); like/dislike; оверлей профиля; суперлайк UI; app-guide |
| `/likes` | `likesPage` | Вкладки **Лайки** / **Оценки**; входящие лайки и неотвеченные оценки; lazy API |
| `/chats` | `chatsPage` | Список матчей/чатов |
| `/chats/:id` | `chatDetailPage` | WS-чат, сообщения, typing, presence |
| `/profile` | `profilePage` | Просмотр/редактирование анкеты и фото |
| `/ai-search` | `aiSearchPage` | История AI jobs, запуск нового поиска |
| `/ai-search/:jobId/results` | `aiSearchResultsPage` | Лента результатов + highlight |
| `/onboarding` | `onboardingPage` | Регистрация: 4 шага, без navbar; черновик в `sessionStorage` (`yammy_onboarding_*`) |

**Онбординг (фронт):**

| Шаг | Содержание |
|-----|------------|
| 1 | Имя, возраст, пол |
| 2 | Фото (`ProfilePhotosEditor`, `storage=local`, файлы в `photoFilesRef`; модерация через `POST /auth/moderate/*`) |
| 3 | Город, образование, цель; при «Высшее» — поле ВУЗ |
| 4 | Характеристики (чипы из `GET /auth/onboarding/filters`), bio |

Финиш: `completeOnboarding` → `POST /auth/onboarding/finish` → очистка session storage → **`replace` на `/dashboard`** (экрана «Готово» нет). `notifications_enabled: true` по умолчанию.

**Профиль (`profilePage`):** просмотр / редактирование; две строки stat-чипов с sheet-описаниями; `ProfileMainRow` без розового кольца вокруг аватарки; `ProfilePhotosEditor` на сервере (upload с rollback при ошибке модерации/API); меню главного фото как в чате (portal, blur). После успешного `PUT /users/` — `filters.persist(draft)` синхронизирует пересекающиеся поля ленты в `yammy_feed_filters_v1`.

**Просмотр детальной анкеты:** `matchesOverlay.tsx` вызывает `recordProfileView(user_id)` при монтировании `OverlayContent`; карточка в ленте сама по себе просмотр не пишет. Backend endpoint — `POST /users/{user_id}/view`.

**Подсказка заполнить профиль (`features/profile-fill-prompt`):** на дашборде (swipe), если `filter_option_ids.length < 3`; модалка по центру ленты, blur как у оверлея профиля; «Заполнить» → `/profile` с `state.openEdit`; закрытие — до следующего свайпа (временно; задел под «раз в день» — `profileFillPromptStorage.ts`).

**Общие UI:** `widgets/header` (фильтры, AI, swipe↔rate), `features/matches-feed`, `features/matches-filter`, `features/likes-feed`, `features/ai-search`, `features/profile-fill-prompt`.

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
| Appearance rating | `appearance_rating_service` (POST, GET `/received`, mutual notify); кандидаты rate-ленты — `search_service` |
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
| **Суперлайк end-to-end** | **Есть**: `POST /likes/superlike`, сохранение `likes.message`, выдача `like_type`/`like_message` в `GET /users/likes`, отдельный UI на `/likes` |
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

Секреты — в `yammy-backend/backend/.env` (prod / docker) или `.env.dev` (локальная разработка). Локально для dev-заглушки Telegram: **`APP_CONFIG__ENVIRONMENT=development`** в `.env.dev` (при `production` stub `initData` даёт 400).

SQL для `likes.message` при старой БД: добавить колонку вручную, если модель уже с `message`.
SQL/миграция для статистики профиля: `migrations/versions/20260619_add_profile_views_count.py` добавляет `users.profile_views_count`; локально после обновления кода применить миграцию или вручную добавить колонку.

---

*Последнее (2026-06-25):*

- *Support-бот:* отдельный Telegram-бот на aiogram 3.x (`support-bot` container), тикеты в Postgres, админка `/support`.
- *Типы обращения:* предложение, проблема, баг.

*Ранее (2026-06-23):*

- *Оценки внешности:* таблица `appearance_rating_pairs` (взаимные пары); POST сразу в PG (Redis-буфер и `flush_appearance_ratings_to_database` **удалены**); GET `/appearance-ratings/received` — только неотвеченные входящие; взаимная оценка → Taskiq + Telegram.
- *Страница лайков:* вкладки «Лайки» / «Оценки», lazy queries, оверлей оценок с `RateCardActions`.
- *Профиль:* две строки stat-чипов (лайки/мэтчи/просмотры + оценки); `received_likes_count` и `received_appearance_ratings_count` — за всё время; sheet с описанием по клику на чип.
- *Rate-лента:* кнопки 1–10 под фото; fade-анимация смены карточки после оценки (без свайпа).
- *App guide:* круглый spotlight для % метча; `mutual-rating` фокусирует `mode-toggle`.

*Ранее (2026-06-19):*

- *Семантический поиск в фильтрах ленты:* `search_text` в `POST /users/search` — эмбеддинг запроса vs `personality_vector` (bio); UI — поле «Поиск по описанию» в оверлее фильтров, `searchText` в `yammy_feed_filters_v1`.
- *Profile stats (backend):* `GET /users/` возвращает `received_likes_count`, `matches_count`, `profile_views_count`; лайки/матчи считаются в `LikeRepository`; просмотры инкрементятся через `POST /users/{user_id}/view`.
- *Profile stats (frontend):* под верхним блоком профиля добавлены 3 чипа в одну строку: «Лайкнули», «Матчи», «Просмотры».
- *Profile views:* хранится только агрегированный `users.profile_views_count`; истории просмотров и списка “кто смотрел” пока нет.

*В конце файла при крупных изменениях: строка «Последнее (дата): …».*
