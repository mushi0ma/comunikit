FROM node:20-alpine

RUN npm install -g @nestjs/cli

WORKDIR /app

COPY package.json ./

RUN npm install --include=dev

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["node", "dist/src/main.js"]
