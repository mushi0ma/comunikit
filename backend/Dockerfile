FROM node:20-alpine

RUN npm install -g @nestjs/cli

WORKDIR /app

COPY backend/package.json ./

RUN npm install --include=dev --legacy-peer-deps

COPY backend/ .

# Generate Prisma client before compiling TypeScript
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build NestJS (output: dist/main.js per tsconfig rootDir=src outDir=dist)
RUN npm run build

# Fail the build immediately if main.js wasn't produced
RUN ls dist/main.js || (echo "BUILD FAILED: dist/main.js not found" && find dist -name "*.js" 2>/dev/null | head -10 && exit 1)

EXPOSE 3001

CMD ["node", "dist/main.js"]
