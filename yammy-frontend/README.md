# Yammy — фронтенд приложения для знакомств

Клиентская часть Yammy: веб-приложение для знакомств на React.

## Стек

- **React 19** + **TypeScript**
- **Vite** (rolldown)
- **React Router** · **TanStack Query** · **Framer Motion** · **ky**
- **Tailwind CSS v4**

## Требования

- **Node.js** 20+
- **pnpm** 10+

## Запуск проекта

```bash
# Установка зависимостей
pnpm install

# Режим разработки (с hot reload)
pnpm dev

# Сборка для продакшена
pnpm build

# Просмотр собранного приложения
pnpm preview
```

## Линтинг и форматирование

```bash
# Проверка ESLint
pnpm run lint:check

# Автоисправление по правилам ESLint
pnpm run lint:fix

# Форматирование кода (Prettier)
pnpm run format
```

## Docker

```bash
# Сборка и запуск в контейнере
docker compose up --build

# Приложение доступно по адресу: http://localhost:3000
```

Остановка:

```bash
docker compose down
```

## Скрипты

| Команда           | Описание                   |
| ----------------- | -------------------------- |
| `pnpm dev`        | Запуск dev-сервера         |
| `pnpm build`      | Сборка (tsc + vite build)  |
| `pnpm preview`    | Просмотр production-сборки |
| `pnpm lint:check` | Проверка ESLint            |
| `pnpm lint:fix`   | Исправление по ESLint      |
| `pnpm format`     | Форматирование Prettier    |
