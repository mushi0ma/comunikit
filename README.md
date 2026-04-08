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
| Backend | NestJS 11, Prisma 7 (ORM) |
| База данных | PostgreSQL — Supabase |
| Авторизация | Supabase Auth (email + GitHub OAuth + Telegram) |
| Деплой | Vercel (frontend) + Railway (backend) |
| Тестирование | Playwright 1.59, Postman |

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
```

```bash
# Запустить frontend (порт 3000)
pnpm dev --port 3000

# Запустить backend (порт 3001)
cd backend && pnpm start:dev
```

## Деплой

- **Frontend:** Vercel — [comunikit.vercel.app](https://comunikit.vercel.app)
- **Backend:** Railway — [comunikit-production.up.railway.app/api](https://comunikit-production.up.railway.app/api)
- **Database:** Supabase PostgreSQL

## Тестирование

```bash
# E2E тесты (Playwright) — 8/8 pass
pnpm exec playwright test

# API тесты — импортировать postman/comunikit-api.json в Postman
```

## Credits

Карта кампуса: [github.com/Yuujiso/aitumap](https://github.com/Yuujiso/aitumap)
