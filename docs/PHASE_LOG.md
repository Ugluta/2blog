# Phase Log

## PHASE 0 — Mimari Analiz
- İlk analiz + revizyon: `docs/ARCHITECTURE.md`.
- Kesinleşen kararlar: NestJS (API), Drizzle ORM, VPS+Docker+Caddy (deployment),
  MinIO (medya), Core/Domain ayrımı (Content Engine, Scraper, Social).

## PHASE 1 — Project Bootstrap (tamamlandı)

**Kurulan yapı:**
- Monorepo: pnpm workspaces + Turborepo (`turbo.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`)
- `packages/config` — env şeması (zod, servis bazlı: `apiEnvSchema`, `workerEnvSchema`, `webEnvSchema`, `adminEnvSchema`) + design token'lar
- `packages/types` — `ApiResponse`/`ApiSuccess`/`CursorPage` zarfı, Core identity tipleri (`User`, `Role`, `Permission`)
- `packages/validation` — ortak zod şemaları (uuid/slug/cursor pagination/email) + auth login/refresh şemaları
- `packages/core-database` — Drizzle ORM, PostgreSQL. Şema: `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `sessions` (refresh-token rotation için `family`/`refreshTokenHash`). İlk migration üretildi: `packages/core-database/drizzle/0000_amusing_sleeper.sql`
- `apps/api` — NestJS (Fastify adapter), `AppModule → CoreModule → HealthModule`, `GET /api/v1/health`
- `apps/worker` — BullMQ/Redis bağlantı iskeleti (henüz queue/processor yok — her job tipi kendi fazında eklenecek)
- `apps/web`, `apps/admin` — Next.js App Router iskeleti; `apps/web` ana sayfası NestJS API'nin health endpoint'ini SSR sırasında çağırıyor (Core/Domain veri akışı deseninin kanıtı — web asla DB'ye doğrudan bağlanmıyor)
- `infrastructure/` — `docker-compose.yml` (postgres, redis, minio, api, worker, web, admin, caddy), `caddy/Caddyfile`, her app için multi-stage Dockerfile (turbo prune + pnpm install + build)

**Doğrulama (bu ortamda çalıştırıldı):**
- `pnpm install` → temiz
- `pnpm build` → 8/8 paket başarılı (packages + apps)
- `pnpm typecheck` → 12/12 görev başarılı
- `apps/api` gerçekten başlatıldı, `curl localhost:4000/api/v1/health` → `{"data":{"status":"ok",...}}`
- `apps/web` standalone build başlatıldı, ana sayfa API'ye fetch atıyor (build-time ISR nedeniyle sayfa statik önbelleğe alınıyor — production'da publish sonrası `revalidatePath` ile invalide edilecek, madde 17)
- `pnpm db:generate` → `drizzle-kit`, canlı DB bağlantısı olmadan ilk migration SQL'ini üretti

**Kapsam dışı bırakılanlar (sonraki fazlar):** Auth/RBAC iş mantığı (PHASE 3), gerçek queue processor'ları (PHASE 12-14), packages/ui + Tailwind (PHASE 5+), ESLint/CI pipeline (PHASE 18-19'da resmileştirilecek — bu fazda kasıtlı olarak eklenmedi, çalışmayan bir `lint` script'i bırakmamak için).
