FROM node:20-alpine

RUN npm install -g pnpm @nestjs/cli

WORKDIR /app

COPY package.json ./

RUN pnpm install --no-frozen-lockfile

COPY . .

RUN pnpm build && echo "=== BUILD OUTPUT ===" && find dist -name "*.js" | head -20

EXPOSE 3001

CMD ["node", "dist/src/main.js"]
