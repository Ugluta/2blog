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

## PHASE 3 — Auth + Users + Roles + Permissions (tamamlandı)

**Yeni paketler:**
- `packages/core-auth` — Argon2id hash/verify, JWT access token sign/verify,
  refresh token üretimi + SHA-256 hash'leme, `"15m"/"30d"` TTL parser
- `packages/core-rbac` — saf `hasPermission()`/`hasAnyPermission()`/`hasAllPermissions()`
  fonksiyonları + Core'un kendi izin registry'si (`USER_VIEW`, `USER_MANAGE`,
  `ROLE_VIEW`, `ROLE_MANAGE`)

**apps/api'ye eklenenler (`src/core/`):**
- `database/` — Drizzle bağlantısını `DATABASE_CONNECTION` token'ı ile global DI'a sokan modül
- `common/zod-validation.pipe.ts` — class-validator yerine zod şemalarını (packages/validation) doğrudan Nest pipe olarak kullanan wrapper
- `auth/` — `AuthService` (login/refresh/logout, refresh token rotation + reuse
  detection tam implementasyon), `AuthController`, `JwtAuthGuard`, `@CurrentUser()`
- `rbac/` — `PermissionsGuard`, `@RequirePermission()`, `RolesController`
  (`GET/POST /roles`, `POST /roles/:id/permissions`, `GET /permissions`)
- `users/` — `UsersService` (keyset/cursor pagination), `UsersController`
  (`GET /users/me`, `GET /users`, `POST /users/:id/roles`)
- `packages/core-database/src/seed.ts` — idempotent: Core izinlerini + `SUPER_ADMIN`
  rolünü upsert eder, `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` set edilmişse ilk
  admin kullanıcısını oluşturur (public `/auth/register` endpoint'i kasıtlı olarak yok)

**Doğrulama (bu ortamda, gerçek PostgreSQL 16 + Redis 7'ye karşı, Docker olmadan
yerel servislerle çalıştırıldı):**
- `pnpm db:migrate` → gerçek DB'ye migration uygulandı, `pnpm db:seed` → SUPER_ADMIN
  rolü + 4 Core izni + admin kullanıcı oluşturuldu
- `POST /auth/login` → doğru access+refresh token + roller/izinler döndü
- `GET /users/me` (Bearer token'sız) → 401; (geçerli token) → 200
- `GET /roles` (ROLE_VIEW izni olmayan MEMBER rolüyle) → 403 Forbidden
- **Refresh rotation:** REFRESH1 ile refresh → yeni REFRESH2 üretildi (200)
- **Reuse detection:** REFRESH1'i tekrar kullanmayı denedim → 401 + tüm session
  family'si revoke edildi; ardından REFRESH2 (rotasyonun geçerli çocuğu) da
  denendi → o da 401 (zincirin tamamen iptal edildiği doğrulandı)
- `POST /roles` ile duplicate key → 409, geçersiz key formatı (`member` küçük harf) → 400 zod validation
- Yanlış şifre → 401; `POST /auth/logout` → session revoke edildi, revoke edilmiş
  token'la tekrar refresh denemesi → 401

**Kapsam dışı bırakılanlar (sonraki fazlar):** Web/Admin login UI'ı (web'in
Next.js route handler üzerinden refresh token'ı httpOnly cookie'ye koyan BFF
katmanı — ARCHITECTURE.md madde 2), domain'lere özel izinler (`BLOG_PUBLISH` vb.,
PHASE 7-8), users listesinde createdAt bazlı kronolojik cursor (şu an id bazlı,
kararlı ama kronolojik değil).

## PHASE 6/7 — Content Engine + Blog "post" tipi (tamamlandı)

**Yeni paket:** `packages/core-content-engine` — framework-agnostic:
`ContentTypeRegistry` (Core, domain tiplerini bilmez; `register()`/`get()`/`has()`),
durum geçiş grafiği (`DRAFT → REVIEW → APPROVED → SCHEDULED → PUBLISHED → ARCHIVED`,
`DRAFT → PUBLISHED` doğrudan da mümkün — zorunlu review gate yok ama REVIEW/APPROVED
kullanmak isteyen ekipler için yol açık).

**core-database'e eklenenler:** `categories`, `tags`, `contents` (generic —
`typeKey` düz varchar, DB enum değil, çünkü domain modülleri bootstrap'ta
kendi tiplerini kaydediyor), `content_revisions` (her create/update/transition'da
snapshot), `content_categories`/`content_tags` (many-to-many join tabloları).

**apps/api'ye eklenenler:**
- `core/content/` — `ContentTypeRegistryModule` (Global, tek registry instance'ı,
  domain modülleri `OnModuleInit`'te buraya kayıt olur), `ContentService`
  (create/update/transition/soft-delete, taxonomy senkronizasyonu transaction
  içinde, cursor pagination + kategori filtresi), `ContentController` (admin,
  `CONTENT_VIEW/CREATE/EDIT/DELETE` + `PUBLISHED`'a özel `CONTENT_PUBLISH`),
  `PublicContentController` (**guard'sız**, yalnızca `PUBLISHED`, `apps/web`'in
  SSR'da çağıracağı yüzey), `TaxonomyController`/`TaxonomyService` (kategori/etiket)
- `src/blog/blog.module.ts` — Core'un ilk domain tüketicisi: bootstrap'ta
  registry'ye `"post"` tipini kaydeder (boş `extraFieldsSchema` — henüz ek alan
  yok). Core hiçbir yerde bu modülü import etmiyor; ilişki tek yönlü.
- Yeni Core izinleri: `CONTENT_VIEW`, `CONTENT_CREATE`, `CONTENT_EDIT`,
  `CONTENT_DELETE`, `CONTENT_PUBLISH`

**Doğrulama (gerçek PostgreSQL + Redis'e karşı, Docker olmadan):**
- Migration uygulandı (6 yeni tablo + `content_status` enum), seed yeniden
  çalıştırıldı (idempotent — yeni CONTENT_* izinlerini mevcut SUPER_ADMIN'e ekledi)
- Kayıtsız `typeKey` ile içerik oluşturma → 400
- Kategori + etiket oluşturup gerçek bir `"post"` içeriği oluşturdum (DRAFT,
  kategoriler/etiketler doğru döndü)
- Public endpoint DRAFT içeriği göstermedi (boş liste + `/public/:slug` 404)
- `CONTENT_EDIT`/`CONTENT_PUBLISH` izni olmayan MEMBER rolüyle transition denemesi
  → 403
- Admin `DRAFT → PUBLISHED` transition yaptı → `publishedAt` set edildi, public
  liste ve `/public/:slug` artık içeriği gösterdi
- Geçersiz geçiş denemesi (`PUBLISHED → APPROVED`, geçiş grafiğinde yok) → 400
  ("Cannot transition content from PUBLISHED to APPROVED")
- **Bulunan ve düzeltilen bug:** duplicate slug ile içerik oluşturma başta
  ham Postgres unique-constraint hatasından 500 dönüyordu — `ContentService.create`'e
  slug ön-kontrolü eklenip 409'a çevrildi, ayrıca `updateContentSchema`'dan
  `slug` tamamen çıkarıldı (PATCH'te sessizce yok sayılıyordu; artık şemada
  hiç kabul edilmiyor — slug değişikliği SEO redirect'siz güvenli değil)
- Revision snapshot'ları her create/update/transition'da `content_revisions`'a
  gerçekten yazıldığını SQL ile doğruladım; soft-delete sonrası hem admin
  `GET /:id` hem public liste/slug 404/boş döndü

**Kapsam dışı bırakılanlar (sonraki fazlar):** Project/Service/Work extension
tabloları ve bunların `extraFieldsSchema`'ları (PHASE 8), `ContentMedia`
join tablosu (Media modülü kurulana kadar `coverImage` düz URL string,
PHASE 9), arama/SEO sitemap entegrasyonu (PHASE 10-11), apps/web'in gerçek
bir Blog sayfası render etmesi (bu faz yalnızca API'yi kapsıyor).
