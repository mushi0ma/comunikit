# Comunikit

Закрытая студенческая платформа для AITU — форум, маркетплейс и Lost & Found.

## О проекте

Comunikit — внутренняя платформа Astana IT University, доступная только студентам.
Объединяет форум для общения, торговую площадку и систему поиска потерянных вещей
с интерактивной картой кампуса. Мобильный интерфейс с тёмной темой по умолчанию.

## Функциональность

- **Форум** — темы, категории, голосование (upvote/downvote), вложенные комментарии, карма
- **Маркетплейс** — объявления типов: продажа, покупка, услуги, lost & found
- **Карта кампуса** — интерактивная SVG-карта AITU C1 (3 этажа), метки и фильтрация
- **Уведомления** — центр уведомлений с отметкой прочитанных
- **Поиск** — поиск по объявлениям и форуму
- **Авторизация** — email, GitHub OAuth, Telegram; восстановление пароля
- **Избранное** — сохранение объявлений с мгновенным обновлением

## Стек

| Слой | Технология |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS 4, shadcn/ui, TanStack Query 5, Wouter 3, Zustand 5 |
| Backend | NestJS 11, Prisma 7 (ORM), BullMQ (фоновые задачи), Nodemailer (SMTP) |
| База данных | PostgreSQL — Supabase, Redis (очереди) |
| Авторизация | Supabase Auth (Telegram + email + GitHub OAuth), HTTP-only Cookies |
| Деплой | Vercel (frontend) + Railway (backend) |
| Тестирование | Jest, Playwright 1.59, Postman |

## Локальный запуск

```bash
git clone https://github.com/mushi0ma/comunikit.git
cd comunikit
pnpm install
```

**Frontend** — создать `frontend/.env`:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_API_URL=http://localhost:3001
VITE_TELEGRAM_BOT_USERNAME=
```

**Backend** — создать `backend/.env`:
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
TELEGRAM_BOT_TOKEN=
OPENROUTER_API_KEY=
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
SMTP_HOST=smtp.yourmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

**Redis** (нужен для BullMQ-очередей):
```bash
# Вариант 1: Docker (рекомендуется)
docker compose up -d redis

# Вариант 2: локальная установка
# macOS:  brew install redis && brew services start redis
# Ubuntu: sudo apt install redis-server && sudo systemctl start redis
```

```bash
# Запустить frontend (порт 3000)
pnpm dev --port 3000

# Запустить backend (порт 3001)
cd backend && pnpm start:dev
```

### Telegram Login Widget (локальная отладка)

Виджет Telegram работает только на HTTPS-доменах или `localhost`. Для локальной
разработки в `@BotFather` укажите домен `localhost` в настройках Login Widget
(`/setdomain`). Бот, указанный в `VITE_TELEGRAM_BOT_USERNAME`, должен совпадать
с `TELEGRAM_BOT_TOKEN` в backend.

## Деплой

- **Frontend:** Vercel — [comunikit.vercel.app](https://comunikit.vercel.app)
- **Backend:** Railway — [comunikit-production.up.railway.app/api](https://comunikit-production.up.railway.app/api)
- **Database:** Supabase PostgreSQL

## Тестирование

```bash
# Unit-тесты backend (Jest)
cd backend && pnpm test

# Unit-тесты с покрытием
cd backend && pnpm test:cov

# E2E тесты (Playwright)
pnpm exec playwright test

# API тесты — импортировать postman/comunikit-api.json в Postman
```

## Credits

Карта кампуса: [github.com/Yuujiso/aitumap](https://github.com/Yuujiso/aitumap)
