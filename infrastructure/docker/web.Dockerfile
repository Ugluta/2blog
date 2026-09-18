# syntax=docker/dockerfile:1
# Build context: repository root (see infrastructure/docker-compose.yml)

FROM node:22-alpine AS base
RUN corepack enable

FROM base AS pruner
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY . .
RUN npx turbo prune @2blog/web --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
# turbo prune --docker doesn't include loose root files outside any
# workspace package — every package's tsconfig.json extends this one
# via a relative "../../tsconfig.base.json", so without it tsc fails
# with TS5083 "Cannot read file '/app/tsconfig.base.json'" (hit on a
# real deploy attempt, reproduced by inspecting out/full/ directly).
COPY --from=pruner /app/tsconfig.base.json .
# NEXT_PUBLIC_* vars are inlined into the bundle by `next build` itself (server
# code included — sitemap.ts/robots.ts/generateMetadata read it), so it must
# be present as a build arg, not just a runtime env_file entry.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN pnpm turbo run build --filter=@2blog/web

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=installer /app/apps/web/.next/standalone ./
COPY --from=installer /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/web/server.js"]
