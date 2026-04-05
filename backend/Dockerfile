FROM node:20-alpine

RUN npm install -g @nestjs/cli

WORKDIR /app

COPY backend/package.json ./

RUN npm install --include=dev --legacy-peer-deps

COPY backend/ .

RUN npm run build

EXPOSE 3001

CMD ["node", "dist/src/main.js"]
