FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Nur package.json zuerst (besseres Caching)
COPY package*.json ./
COPY tsconfig.base.json ./
COPY backend/package*.json ./backend/
COPY packages/ ./packages/

RUN npm ci --workspace=backend --include-workspace-root

COPY backend/ ./backend/

WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

# ── Production Image ──────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY backend/package*.json ./backend/
COPY packages/ ./packages/

RUN npm ci --workspace=backend --include-workspace-root --omit=dev

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY backend/prisma ./backend/prisma

WORKDIR /app/backend

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
