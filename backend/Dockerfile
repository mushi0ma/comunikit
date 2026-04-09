FROM node:20-alpine

RUN npm install -g pnpm @nestjs/cli

WORKDIR /app

# Копируем весь исходный код
COPY backend/ .
COPY shared/ ./shared/

# КРИТИЧЕСКИ ВАЖНО: Удаляем локальные node_modules и dist, если они скопировались с хоста (защита от отсутствующего .dockerignore)
RUN rm -rf node_modules dist

# Устанавливаем зависимости через pnpm (соответствует локальному pnpm-lock.yaml)
RUN pnpm install

# Генерируем Prisma Client строго в чистой среде
RUN pnpm prisma generate

# Собираем NestJS
RUN pnpm run build

# Проверка успешной сборки
RUN ls dist/main.js || (echo "BUILD FAILED: dist/main.js not found" && exit 1)

EXPOSE 3001

CMD ["node", "dist/main.js"]
