# Yammy — справочник проекта для следующего диалога с агентом

## Назначение этого файла

**Только справочная информация о проекте** — контекст для нового чата, без обязательства «доделать всё перечисленное».

| Это | Не это |
|-----|--------|
| Весь функционал, API, экраны, модели данных | Backlog на реализацию без запроса пользователя |
| Правила слоёв бэкенда | Рефакторинг «ради чистоты», новые абстракции |

**Подключение:** `@docs/GLOBAL.md`  
**Репозиторий:** `/Users/mago/yammy` · **Обновлено:** 2026-06-11

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
| POST | `/image` | Загрузка фото (+ `moderation_service` до сохранения) |
| DELETE | `/image?image_id=` | Удаление фото |
| PATCH | `/image/{id}/order` | Порядок фото в галерее |
| PATCH | `/image/main` | Главное фото: upload или `existing_image_id` |

**Поля пользователя (важное):** `telegram_id`, `gender`, `relationship_goal`, `subscription_tier` (free/vip/premium), `subscription_expires_at`, `superlikes_balance`, `boosts_balance`, `boost_expires_at`, `profile_moderation_approved`, `is_banned`, `adequacy_score`, `activity_score`, `last_seen`, `notifications_enabled`, `language` (ru/en).

**Фронт:** `pages/(main)/profilePage/` — просмотр/редактирование, фото, характеристики из каталога фильтров; отображение баланса суперлайков/бустов.

---

### Поиск ленты (свайп) — `search_service` · `POST /users/search`

Основная лента на **дашборде** (`?mode=swipe` по умолчанию).

**Тело `SearchRequest`:** пол, возраст, цель, город, сферы работы, образование, **filters** (nested `category_slug → sub_slug → option_slug[]`), веса appearance/social/personality, `only_online`, `show_seen` (поле `only_premium` в API есть, в UI фильтра ленты **нет**).

**Логика (`SearchService`):**

- ES-запрос через `UserSearchQueryBuilder` + вектор личности из bio (`MLService` / Redis cache).
- Исключения: уже seen (Redis), лайки/дизлайки, матчи; слоты для **boosted** анкет.
- `match_percentage` в ответе; лимит выдачи ~30 карточек.
- Fallback по городу, если мало результатов.

**Фронт:** `useUsersSearch`, `SwipeFeed`, фильтры в оверлее (`features/matches-filter`), `Header` — кнопка фильтров и переключение swipe/rate по клику на лого.

#### Фильтры ленты (фронт) — `features/matches-filter`

| Поведение | Детали |
|-----------|--------|
| Черновик vs applied | В оверлее правится `state`; лента и API — только `appliedState` после **«Применить»** |
| Сохранение | `localStorage` ключ `yammy_feed_filters_v1`: пол, `ageRange`, город, цель, работа, образование, вуз, приоритеты (веса), dynamic `filters` |
| Загрузка | При старте `FiltersProvider` → `loadAppliedFiltersState()`; парсинг по полям (битый `priorities` не сбрасывает весь объект) |
| Каталог с бэка | После `GET /filters/` (или onboarding) — `reconcileFeedFiltersWithMetadata`: убрать slug категорий/опций, которых нет в актуальном каталоге (админка) |
| Закрытие оверлея | **×** и свайп вниз — откат черновика к `appliedState` (**не** `reset`, storage не трогается) |
| Сброс | Только явный сброс в UI → дефолты + `clearPersistedFeedFilters()` |

Код: `FiltersContext.tsx`, `persistedFeedFilters.ts`, `reconcileFeedFiltersWithMetadata.ts`, `filtersOverlayContent.tsx`, `useFiltersSearchParams` → `mapFiltersToSearchRequest`.

---

### Входящие лайки — `search_service` · `GET /users/likes`

Пагинация `PaginationRequestModel` → список **`UserSearchResponseSchema`** (кто лайкнул, с match %).

Исключаются пары, уже ставшие **Match**.

**Фронт:** `pages/(main)/likesPage/`, сетка `LikesCard`, ответ взаимным like/dislike из оверлея профиля.

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
| `/likes` | `likesPage` | Входящие лайки: секция полноширинных суперлайков + отдельная сетка обычных лайков |
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

**Профиль (`profilePage`):** просмотр / редактирование; `ProfilePhotosEditor` на сервере (upload с rollback при ошибке модерации/API); меню главного фото как в чате (portal, blur). После успешного `PUT /users/` — `filters.persist(draft)` синхронизирует пересекающиеся поля ленты в `yammy_feed_filters_v1`.

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

Секреты — только `.env`. Локально для dev-заглушки Telegram: **`APP_CONFIG__ENVIRONMENT=development`** (при `production` stub `initData` даёт 400).

SQL для `likes.message` при старой БД: добавить колонку вручную, если модель уже с `message`.

---

*Последнее (2026-06-11):*

- *Суперлайки (backend):* добавлен `POST /likes/superlike`; `LikeService.add_superlike` валидирует message (trim, <=200), пишет `like_type=superlike`, ведет стандартный match flow; входящие лайки обогащаются `like_type` + `like_message`.
- *Суперлайки (frontend):* добавлен `sendUserSuperLike`; message из `SuperLikeOverlay` прокинут через `SwipeFeed`/`useSwipeFeed` в dashboard и AI search; после суперлайка инвалидация `usersQueryKeys.profile()`.
- *Likes page UX:* суперлайки вынесены в отдельную секцию «Огоньки» полноширинными карточками (`SuperLikeCard`) с текстом сразу на карточке; обычные лайки остаются сеткой.
- *Test DB seed:* в `seed_test_received_likes` добавлены 2 суперлайка с сообщениями, не подряд в последовательности сидинга.

*В конце файла при крупных изменениях: строка «Последнее (дата): …».*
