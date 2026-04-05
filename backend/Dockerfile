FROM node:20-alpine

RUN npm install -g pnpm @nestjs/cli

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install ALL deps including devDependencies (needed for nest build)
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Debug: show source files
RUN ls -la src/

# Build
RUN pnpm build

# Debug: verify build output exists
RUN ls -la dist/ && ls -la dist/src/ || echo "ERROR: dist/src not found"

EXPOSE 3001

CMD ["node", "dist/src/main.js"]
