# Comunikit

> Closed ecosystem marketplace for AITUC students.
> Buy/sell, lost & found, forum — all in one place.

## Live
- **Frontend:** https://comunikit.vercel.app
- **Backend API:** https://comunikit-production.up.railway.app/api

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Shadcn UI |
| Backend | NestJS, Prisma ORM |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (email + GitHub OAuth + Telegram) |
| Deployment | Vercel (frontend) + Railway (backend) |

## Project Structure
```
comunikit/
├── frontend/          # React SPA
│   └── src/
│       ├── pages/     # Route pages
│       ├── components/# UI components
│       ├── features/  # Feature modules (map, etc.)
│       ├── hooks/     # TanStack Query hooks
│       └── lib/       # Utils, API, Supabase client
├── backend/           # NestJS API
│   └── src/
│       └── modules/   # Feature modules
├── shared/            # Shared TypeScript types
└── scripts/           # Dev tooling
```

## Quick Start

```bash
# Clone
git clone https://github.com/mushi0ma/comunikit.git
cd comunikit

# Install
pnpm install

# Frontend dev (port 3000)
pnpm dev

# Backend dev (port 3001)
cd backend && pnpm dev
```

## Environment Variables

**Frontend** (`frontend/.env`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:3001
VITE_TELEGRAM_BOT_USERNAME=
```

**Backend** (`backend/.env`):
```
DATABASE_URL=
DIRECT_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
TELEGRAM_BOT_TOKEN=
OPENROUTER_API_KEY=
```

## Testing

```bash
# E2E tests (Playwright)
cd frontend && npx playwright test

# API tests — import postman/comunikit-api.json into Postman
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/health | Health check | No |
| GET | /api/health/db | DB health check | No |
| GET | /api/listings | List listings (filter: type, category, limit, offset) | No |
| GET | /api/listings/:id | Get listing by ID | No |
| POST | /api/listings | Create listing | Yes |
| DELETE | /api/listings/:id | Delete listing (owner only) | Yes |
| GET | /api/forum | List threads (filter: category) | No |
| GET | /api/forum/:id | Get thread with comments | No |
| POST | /api/forum | Create thread | Yes |
| POST | /api/forum/:id/vote | Upvote/downvote thread | Yes |
| GET | /api/comments | Get comments (query: listingId or threadId) | No |
| POST | /api/comments | Add comment | Yes |
| POST | /api/comments/:id/vote | Vote on comment | Yes |
| GET | /api/notifications | My notifications | Yes |
| PATCH | /api/notifications/read | Mark all notifications read | Yes |
| PATCH | /api/notifications/:id/read | Mark one notification read | Yes |
| GET | /api/whitelist/check | Check student ID whitelist | No |
| POST | /api/auth/telegram | Telegram login | No |
| POST | /api/auth/verify-id-card | ID card OCR verification | No |

## Features
- **Marketplace** — buy, sell, services
- **Lost & Found** — with AITU campus map
- **Forum** — threads, comments, karma voting
- **Auth** — email, GitHub OAuth, Telegram, ID card OCR
- **Mobile-first** — PWA-ready responsive design
- **Interactive Map** — AITU C1 building, all 3 blocks, zoom/pan

## Credits
- Campus map: [github.com/Yuujiso/aitumap](https://github.com/Yuujiso/aitumap)
