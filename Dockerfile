# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY server/package*.json server/
COPY client/package*.json client/
RUN apk add --no-cache python3 make g++
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S app && adduser -S app -G app

COPY package*.json ./
COPY server/package*.json server/
COPY client/package*.json client/
RUN npm ci --omit=dev --workspaces --include-workspace-root

COPY --from=builder /app/server/dist ./server/dist
RUN mkdir -p /app/data

RUN chown -R app:app /app
USER app

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=120s --retries=3 CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1

CMD ["node", "server/dist/index.js"]
