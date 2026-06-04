# Объяснимый match % — спецификация

Справочник для реализации и для чата с агентом. **Не** дублирует весь [GLOBAL.md](./GLOBAL.md).

**Подключение:** `@docs/MATCH_EXPLANATION.md`  
**Статус:** запланировано, в коде пока только `match_percentage`  
**Обновлено:** 2026-06-04

---

## Зачем

Сейчас в ленте и лайках пользователь видит только **число** (`match_percentage`). Процент уже считается в [`SearchService`](../yammy-backend/backend/app/core/services/search_service.py) из bio-вектора, общих тегов и демографии, но **причины не отдаются в API**.

Цель: при первой выкладке Mini App показать **«почему в ленте»** готовыми фразами с бэка (шаблоны, не LLM). AI Search по-прежнему использует свой `highlights` от OpenRouter.

**Не в scope:** GPS / поиск «поблизости» / радиус на карте.

---

## Контракт API

Расширить [`UserSearchResponseSchema`](../yammy-backend/backend/app/core/dto/user.py):

| Поле | Тип | Назначение |
|------|-----|------------|
| `match_percentage` | `int \| null` | как сейчас |
| `match_summary` | `str \| null` | одна короткая строка для карточки свайпа / превью (≤ ~80 символов) |
| `match_reasons` | `list[str]` | 1–3 полные фразы для оверлея и детального просмотра |

Фронт **не** собирает текст причин — только отображает поля.

**Эндпоинты:**

- `POST /api/v1/users/search`
- `GET /api/v1/users/likes`

**AI Search** (`GET .../ai/history/{id}/feed`): без изменений контракта; там остаётся `highlights` от LLM.

Пример:

```json
{
  "match_percentage": 82,
  "match_summary": "Совпадают характеристики: бег, настолки",
  "match_reasons": [
    "Совпадают характеристики: бег, настолки",
    "Одна цель знакомства",
    "Похожие интересы в описании"
  ]
}
```

---

## Логика на бэкенде

Место: [`SearchService`](../yammy-backend/backend/app/core/services/search_service.py).

### Откуда берётся процент (уже есть)

В `_match_percentage_for_candidate`:

1. **Bio** — косинус `personality_vector` → `forward_match`
2. **Теги** — пересечение `my_specs` (зритель) и `specs` (кандидат в ES) → `backward_match`
3. **Демография** — `_demographic_bonus`: город (+3), цель (+4), уровень образования (+2), один вуз (+3)
4. Смешивание + `_spread_from_midpoint` + cap 94

### Новый метод

`_build_match_explanation(viewer, source, user_embedding, my_specs, forward_match, ...) -> tuple[str | None, list[str]]`

Возвращает `(match_summary, match_reasons)`.

**Порядок приоритета причин** (макс. 3 в `match_reasons`, первая же → `match_summary`):

1. Общие теги (если есть пересечение specs)
2. Одна цель знакомства
3. Один город
4. Похожие интересы в описании — только если `forward_match >= 70` и у обоих есть bio
5. Похожий уровень образования
6. Один вуз (soft match `education_details`)

**Честность:**

- Не добавлять фразу, если условие не выполнено.
- Не писать в UI, что % = «процент совпавших полей».
- Пустой bio и нет тегов → `match_summary` может быть `null` или только демография.

### Подписи тегов

Slug в ES (`appearance:hair:long`) в UI не показывать. При сборке reasons — lookup **имён** опций из каталога фильтров (`FilterOption.name`, ru), batch по id из hits где возможно.

### Шаблоны фраз (RU)

Вынести в `app/utils/constants/match_explanation_templates.py` (или словарь в сервисе). Позже — `viewer.language` → EN.

| Код (внутри бэка) | Условие | Шаблон |
|-------------------|---------|--------|
| `traits` | пересечение specs | `Совпадают характеристики: {names}` |
| `goal` | та же `relationship_goal` | `Одна цель знакомства` |
| `city` | тот же `city` | `Вы из одного города — {city}` |
| `bio` | `forward_match >= 70` | `Похожие интересы в описании` |
| `education` | тот же `education_level` | `Похожий уровень образования` |
| `university` | совпал `education_details` | `Учились в одном вузе` |

### Вызов

- `_search_results_from_hits` — после `_match_percentage_for_candidate`
- `get_received_likes` — тот же расчёт для входящих лайков

---

## UI (фронт)

Не копировать раскладку AI results на дашборде: там **есть navbar**, блок под лентой не помещается (на AI results navbar скрыт — см. [`rootPage`](../yammy-frontend/src/pages/(main)/rootPage/ui/rootPage.tsx)).

| Место | Поле | Файл |
|-------|------|------|
| Свайп-карточка | `match_summary` одна строка под именем/городом, `truncate` | [`swipeCard.tsx`](../yammy-frontend/src/features/matches-feed/ui/swipe-card/swipeCard.tsx) |
| Оверлей профиля | pill: % + `match_summary`; список `match_reasons` вместо «Вы на одной волне» | [`matchesOverlay.tsx`](../yammy-frontend/src/features/matches-feed/ui/matches-card/matchesOverlay.tsx) |
| Входящие лайки | `match_summary` под % | [`likesCard.tsx`](../yammy-frontend/src/features/likes-feed/ui/likes-card/likesCard.tsx) |
| AI results | без изменений | `highlights` + [`AiSearchHighlightBlock`](../yammy-frontend/src/features/ai-search/ui/aiSearchHighlightBlock.tsx) |

Опционально позже: общий визуальный компонент `MatchExplanationBlock` (стили как AI highlight), разные источники текста.

Типы: расширить `UserSearchApiUser` в [`entities/user/types`](../yammy-frontend/src/entities/user/types/types.ts).

---

## Чеклист реализации

- [ ] `SearchService._build_match_explanation` + шаблоны
- [ ] DTO: `match_summary`, `match_reasons`
- [ ] Поиск + входящие лайки отдают поля
- [ ] Фронт: swipeCard, matchesOverlay, likesCard
- [ ] Проверка на калибровочных анкетах (`seed_match_calibration_users` в test_db)

---

## Очередь до первой выкладки (продукт)

1. **Объяснимый match** (этот документ)
2. **Суперлайк e2e** — `POST /likes/superlike`, баланс, `message` во входящих ([GLOBAL.md § Незавершённое](./GLOBAL.md))
3. **AI Search** — стабильность pipeline + пробный запрос
4. Первая публикация Mini App

Маркетинг / ниша / позиционирование — после того, как в UI видно % и текст «почему».

---

## Связанные файлы

| Слой | Путь |
|------|------|
| Расчёт % | `yammy-backend/backend/app/core/services/search_service.py` |
| ES / фильтры | `yammy-backend/backend/app/core/builders/user_query_builder.py` |
| DTO | `yammy-backend/backend/app/core/dto/user.py` |
| AI highlight (образец UX) | `yammy-frontend/src/features/ai-search/ui/aiSearchHighlightBlock.tsx` |

---

*При реализации обновить статус в шапке и кратко § в GLOBAL.md (опционально).*
