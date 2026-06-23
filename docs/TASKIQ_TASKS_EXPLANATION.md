# Taskiq Tasks: Подробный разбор

Этот файл описывает текущий принцип работы всех задач в `yammy-backend/backend/app/core/tasks/`.
Нужен как опорный документ для будущих чатов и изменений.

## 1) Общая архитектура Taskiq в проекте

- Брокер и планировщик создаются в `app/core/clients/taskiq_client.py`.
- Используется Redis:
  - DB `0` — очередь брокера (`ListQueueBroker`).
  - DB `1` — backend результатов (`RedisAsyncResultBackend`).
- На broker подключен `SmartRetryMiddleware`:
  - retries на стороне worker для ошибок выполнения задач,
  - delay + exponential backoff + jitter.
- На broker подключен `PrometheusMiddleware`:
  - метрики worker доступны на `0.0.0.0:9000`.
- Для трейсинга подключен `TaskiqInstrumentor` (OpenTelemetry), если установлен пакет `taskiq[opentelemetry]`.
- `@broker.task(...)` регистрирует задачу.
- `schedule=[{"cron": "..."}]` включает periodic запуск через scheduler.
- `Dishka` подключается в `_setup_dishka()`, поэтому в задачах можно использовать DI через `FromDishka[...]`.
- Импорт `import app.core.tasks` в `_register_tasks()` нужен, чтобы все декораторы `@broker.task` отработали при старте worker/scheduler.

## 2) Карта задач (что есть сейчас)

### Periodic (cron) задачи

1. `flush_dislikes_to_database` (каждые 15 минут)
2. `flush_presence_last_seen_to_es` (каждые 5 минут)
3. `reconcile_users_index_daily` (ежедневно в 04:00)

### Event-driven (по enqueue из кода)

4. `process_ai_search_history`
5. `send_like_notification`
6. `send_match_notification`
7. `send_mutual_appearance_rating_notification`
8. `reindex_user_in_es`
9. `sync_user_ban_status_to_es`

---

## 3) Подробно по каждой задаче

## `flush_dislikes_to_database`

**Файл:** `app/core/tasks/flush_dislikes_task.py`  
**Сервис:** `LikeService.flush_dislikes_to_db()`

### Что делает

- Берет накопленные дизлайки из Redis-буфера и пакетно записывает в БД.
- Логирует количество обработанных записей.

### Зачем нужен `processing` ключ

Используется схема безопасного flush без потерь на гонках:

1. Worker сначала пытается дочистить старый `processing` ключ (если есть хвост после падения).
2. Если хвоста нет — делает атомарный `RENAME` основного буфера в `processing`.
3. Новые события начинают писаться в новый основной буфер, не смешиваясь с текущим батчем.
4. После успешной записи в БД удаляется только `processing`.

Итог: новые записи не удаляются случайно во время flush.

---

## `send_mutual_appearance_rating_notification`

**Файл:** `app/core/tasks/notifications_task.py`  
**Точка enqueue:** `AppearanceRatingService._maybe_notify_mutual(...)` после `upsert_score`, когда оба `score_by_a` и `score_by_b` заполнены

### Что делает

- Отправляет обоим пользователям Telegram-сообщение о взаимной оценке внешности.
- В тексте — ссылка `tg://user?id=` на собеседника (`NotificationService.notify_mutual_appearance_rating`).

### Idempotency

- Перед enqueue вызывается `mark_mutual_notified` в PG (`mutual_notified_at`).
- В задаче дополнительная проверка Redis-ключа `notify:mutual_rating:{pair_id}` (`SET NX EX`, TTL 1 час).

### Почему не flush в Redis

- Оценки пишутся **сразу** в `appearance_rating_pairs` при `POST /appearance-ratings`.
- Буфер `appearance_rating:buffer` и cron `flush_appearance_ratings_to_database` **удалены** (2026-06-23).

---

## `process_ai_search_history`

**Файл:** `app/core/tasks/process_ai_search_history_task.py`  
**Точка enqueue:** `app/api/v1/routers/client/users.py` (`POST /users/search/ai/history`)

### Что делает

- Берет `history_id`, запускает `AiSearchService.process_history_item(...)`.
- Это тяжелая/внешняя работа, поэтому вынесена из HTTP hot-path.

### Fallback поведение

- Если enqueue не удался, router сразу делает синхронный fallback:
  `await ai_search_service.process_history_item(item.id)`.
- Пользователь не остается с "зависшей" записью истории только из-за сбоя очереди.

---

## `send_like_notification`

**Файл:** `app/core/tasks/notifications_task.py`  
**Точка enqueue:** `LikeService._notify_like_async(...)`

### Что делает

- Отправляет уведомление о лайке/суперлайке через `NotificationService`.
- Перед отправкой проверяет idempotency ключ в Redis (`SET NX EX`).

### Idempotency

- Ключ формата: `notify:like:{user_to_id}:{liker_name}:{like_type}`.
- Если ключ уже есть — задача логирует skip duplicate и завершает работу.
- TTL дедупликации: 1 час.

### Почему это важно

- Taskiq и сеть допускают retry/дубликаты доставки.
- Idempotency защищает пользователя от повторных пушей на одно событие.

---

## `send_match_notification`

**Файл:** `app/core/tasks/notifications_task.py`  
**Точка enqueue:** `LikeService._notify_match_async(...)`

### Что делает

- Отправляет уведомление о новом матче.

### Idempotency

- Ключ формата: `notify:match:{recipient_id}:{pair_key}`.
- `pair_key` — сортированная пара `user_from_id/user_to_id`, поэтому порядок не влияет.
- TTL дедупликации: 1 час.

---

## `reindex_user_in_es`

**Файл:** `app/core/tasks/user_index_tasks.py`  
**Точки enqueue:** `UserService` (update profile, операции с фото)

### Что делает

- Пересобирает документ пользователя и делает upsert в индекс `users`.
- Параметр `include_personality_vector` управляет тем, считать ли embedding в этой же задаче.

### Почему так

- Можно быстро делать "легкий" reindex без пересчета вектора.
- Когда меняется `bio`, тот же task запускается с `include_personality_vector=True` и обновляет вектор без отдельной task.

---

## `sync_user_ban_status_to_es`

**Файл:** `app/core/tasks/user_index_tasks.py`  
**Точка enqueue:** `UserService.set_ban_status(...)`

### Что делает

- Сразу синхронизирует `is_banned` в ES.

### Бизнес-смысл

- Бан/разбан критичен для выдачи — не ждем nightly reconcile.
- При проблеме partial update сервис делает fallback на full upsert документа.

---

## `flush_presence_last_seen_to_es`

**Файл:** `app/core/tasks/user_index_tasks.py`  
**Источник данных:** `PresenceService._persist_last_seen(...)` пишет в Redis hash буфер

### Что делает

- Раз в 5 минут берет `last_seen` из Redis-буфера и batch-обновляет ES.
- Использует ту же двухключевую схему (`presence:last_seen:buffer` и `...:processing`) для безопасного flush.

### Зачем debounce

- `last_seen` меняется часто.
- Синхронное обновление ES на каждый disconnect создавало бы лишнюю нагрузку.
- Буфер + периодический flush снижает нагрузку и сохраняет актуальность в приемлемом SLA.

---

## `reconcile_users_index_daily`

**Файл:** `app/core/tasks/user_index_tasks.py`

### Что делает

- Ежедневно запускает reconcile:
  - берет пользователей по `updated_at` за окно (сейчас 48 часов),
  - делает upsert в ES,
  - возвращает число синхронизированных записей.

### Роль в архитектуре

- Это страховка от пропусков runtime-синхронизации.
- Не заменяет event-driven sync, а дополняет его.

---

## 4) Где именно задачи enqueue-ятся

- `process_ai_search_history` — из `client/users` router после создания AI history item.
- `send_like_notification`, `send_match_notification` — из `LikeService` после записи лайка/матча.
- `send_mutual_appearance_rating_notification` — из `AppearanceRatingService` при взаимной оценке внешности.
- `reindex_user_in_es` — из `UserService`.
- `flush_dislikes_to_database`, `flush_presence_last_seen_to_es`, `reconcile_users_index_daily` — scheduler по cron.

---

## 5) Гарантии и ограничения

## Что уже гарантируется

- Flush буферов без потерь на read/delete гонке.
- Дедупликация уведомлений при retry (лайк, матч, взаимная оценка).
- Один reindex task покрывает и обычный upsert, и пересчет vector (через флаг).
- Nightly reconcile как backstop.
- Retry задач на worker через встроенный middleware Taskiq.

## Что важно помнить

- Idempotency по уведомлениям сейчас завязана на `liker_name` для лайков; если имя изменится, ключ будет другим.
- Для flush-механики критично, чтобы producers писали только в основной буферный ключ.
- Reconcile корректен настолько, насколько надежно двигается `users.updated_at` при всех изменениях, влияющих на поиск.

---

## 6) Краткий runbook (диагностика)

Если "таски не работают":

1. Проверить, что worker поднят и импортирует `app.core.tasks`.
2. Проверить, что scheduler поднят для cron-задач.
3. Проверить Redis DB `0/1` доступность.
4. Посмотреть логи по именам задач:
   - `process_ai_search_history_started/finished`
   - `like_notification_skipped_duplicate`
   - `match_notification_skipped_duplicate`
   - `mutual_appearance_rating_notification_skipped_duplicate`
   - `presence_last_seen_sync_failed`
5. Если очередь недоступна, смотреть fallback ветки:
   - AI search: синхронная обработка в router.
   - Notifications/ES hooks: fallback внутри сервисов.

---

## 7) Правило для будущих задач

При добавлении новой Taskiq-задачи желательно сразу зафиксировать:

- источник enqueue (кто вызывает),
- требуется ли idempotency (и ключ),
- retry-safe ли handler,
- нужен ли fallback в HTTP-path,
- нужна ли periodic reconcile-задача как страховка.
