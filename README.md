# 2blog — Core Platform

Modüler monolith mimarisiyle geliştirilen içerik/dijital hizmet platformu.
Mimari kararlar ve gerekçeleri için bkz. [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Yapı

```
apps/
  web/      Next.js — public site (UI/SSR/SEO, business logic yok)
  admin/    Next.js — admin panel (UI, business logic yok)
  api/      NestJS — tüm business logic, RBAC, validation, audit
  worker/   BullMQ worker — scraper/AI/media/social/email job'ları

packages/
  config/          env şeması + design tokens
  types/            paylaşılan TS tipleri
  validation/         zod şemaları
  core-database/        Drizzle schema + client (PostgreSQL)
```

## Gereksinimler

- Node.js ≥ 20
- pnpm (`corepack enable` ile otomatik doğru sürüm)
- Docker + Docker Compose (yerel Postgres/Redis/MinIO için)

## Kurulum

```bash
cp .env.example .env
# .env içindeki secret'ları (JWT_ACCESS_SECRET, JWT_REFRESH_SECRET) değiştirin

pnpm install

# Postgres / Redis / MinIO'yu ayağa kaldır
docker compose -f infrastructure/docker-compose.yml up -d postgres redis minio

pnpm dev
```

- Web: http://localhost:3000
- Admin: http://localhost:3001
- API: http://localhost:4000/api/v1/health

## Komutlar

```bash
pnpm dev         # tüm apps (turbo)
pnpm build       # tüm apps + packages
pnpm typecheck   # tüm workspace
pnpm lint        # tüm workspace
pnpm db:generate # Drizzle migration dosyası üret (packages/core-database)
pnpm db:migrate  # migration'ları uygula
```

## Production Deployment

VPS üzerinde Docker Compose + Caddy (bkz. `infrastructure/docker-compose.yml`,
`infrastructure/caddy/Caddyfile`). Next.js uygulamaları production mimarisinde
Vercel'e değil, aynı Compose ağındaki container'lara alınır — gerekçe
`docs/ARCHITECTURE.md` madde 19'da.

```bash
docker compose -f infrastructure/docker-compose.yml up -d --build
```
