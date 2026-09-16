# syntax=docker/dockerfile:1
# Build context: repository root (see infrastructure/docker-compose.yml)

FROM node:22-alpine AS base
RUN corepack enable

FROM base AS pruner
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY . .
RUN npx turbo prune @2blog/worker --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@2blog/worker

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 worker
COPY --from=installer --chown=worker:nodejs /app .
USER worker
CMD ["node", "apps/worker/dist/index.js"]
