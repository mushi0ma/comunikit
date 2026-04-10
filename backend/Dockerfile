FROM node:20-alpine

RUN npm install -g pnpm @nestjs/cli

WORKDIR /app

# Копируем папки с сохранением оригинальной структуры монорепозитория
COPY shared/ ./shared/
COPY backend/ ./backend/

# Переходим в бэкенд для установки зависимостей и сборки
WORKDIR /app/backend

# Очищаем мусор, если он скопировался с локальной машины
RUN rm -rf node_modules dist

# Устанавливаем зависимости
RUN pnpm install

# Генерируем Prisma
RUN pnpm prisma generate

# Собираем NestJS
RUN pnpm build

# Проверка
RUN ls dist/main.js || (echo "BUILD FAILED: dist/main.js not found" && exit 1)

EXPOSE 3001

CMD ["pnpm", "start:prod"]