# Comunikit Backend (NestJS)

This is the backend API for **Comunikit**, the private student ecosystem for AITUC.

## Architecture & Stack

- **Framework**: [NestJS](https://nestjs.com/) v11
- **Database**: PostgreSQL (via Supabase) with [Prisma ORM](https://www.prisma.io/)
- **Background Tasks / Queueing**: [BullMQ](https://docs.bullmq.io/) backed by [Redis](https://redis.io/)
- **Email Delivery**: [Nodemailer](https://nodemailer.com/) (SMTP)
- **Deployment & Hosting**: [Railway](https://railway.app/) via Docker containerization
- **Typing**: Strict TypeScript (`class-validator` + `zod`)

## Prerequisites

Before running the application locally, ensure you have:
1. Node.js (v20 LTS recommended)
2. pnpm
3. Docker (for running local Redis)
4. A Supabase project with PostgreSQL

## Setup & Environment

Create a `.env` file in the `backend/` directory by copying `.env.example` and filling in the values:

```env
# Database Connections
DATABASE_URL="postgresql://user:password@aws.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@aws.supabase.com:5432/postgres"

# Supabase Auth configuration
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Security
JWT_SECRET="your-jwt-secret"

# Third-party Integrations
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
OPENROUTER_API_KEY="your-openrouter-api-key"

# SMTP Configuration (Nodemailer)
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="user@example.com"
SMTP_PASS="your-password"

# Redis Configuration (BullMQ)
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
```

> **Note**: `DATABASE_URL` is used by the application at runtime (pooled connection via Supabase). `DIRECT_URL` is specifically for running Prisma migrations (`npx prisma migrate dev`).

## Local Development

### 1. Start Redis
The easiest way to get Redis running for BullMQ queues is via Docker from the root:
```bash
docker compose up -d redis
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Prisma Migrations
Generate the Prisma client and apply any pending migrations to your database:
```bash
pnpm prisma migrate dev
pnpm prisma generate
```

### 4. Run the Dev Server
```bash
# Watch mode
pnpm run start:dev
```
The API server will typically listen on `http://localhost:3001/api`.

## Testing

```bash
# Unit tests
pnpm run test

# Unit tests with coverage report
pnpm run test:cov

# E2E / Integration tests
pnpm run test:e2e
```

## Deployment

This application is deployed as a Docker container on **Railway**. Commits pushed to the main branch automatically deploy. Railway naturally manages the `REDIS_HOST` and `REDIS_PORT` when linked to the internal Redis service.
