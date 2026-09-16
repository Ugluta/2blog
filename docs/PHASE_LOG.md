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

## PHASE 9 — Media (tamamlandı)

**Yeni paket:** `packages/core-media` — framework-agnostic: `StorageProvider`
arayüzü + `S3StorageProvider` (`@aws-sdk/client-s3`, `forcePathStyle: true` —
MinIO bugün, R2/AWS S3 ileride sadece config değişikliğiyle), magic-byte
sniffing (`sniffMimeType` — küçük/sabit allowlist için elle yazıldı; güncel
"detect file type" npm paketlerinin hepsi ESM-only olup bu paketin CJS
build'iyle çakıştığından bir kütüphane yerine tercih edildi), mime↔kind/uzantı
haritası (SVG kasıtlı olarak IMAGE'a dahil edilmedi — script gömülebilir,
XSS vektörü), `sanitizeDisplayFilename` (yalnızca görüntüleme amaçlı; storage
key'i asla kullanıcı dosya adından türetilmiyor).

**core-database'e eklenen:** `media` tablosu — `hash` alanı **unique**
(aynı bytes'ı tekrar yüklemek yeni satır/nesne oluşturmaz, master prompt
madde 8: "aynı veriyi tekrar tekrar kaydetme").

**apps/api'ye eklenenler:**
- `core/media/storage.module.ts` — `Global`, boot'ta `StorageProvider`
  oluşturup `ensureBucket()` çağırır (bucket yoksa oluşturur + public-read
  policy uygular); storage erişilemezse API fail-fast başlamaz (DatabaseModule
  ile aynı duruş).
- `core/media/media.service.ts` — upload (boyut limiti `MEDIA_MAX_UPLOAD_MB`,
  magic-byte doğrulama, sha256 hash ile dedupe + eşzamanlı upload yarışına
  karşı unique-constraint fallback'i), update (altText/caption), remove
  (hem storage nesnesini hem DB satırını siler), list (cursor + kind filtresi).
- `core/media/media.controller.ts` — `@fastify/multipart` ile gerçek dosya
  upload'ı (`POST /media/upload`), `MEDIA_VIEW/UPLOAD/EDIT/DELETE` izinleri.
- Yeni Core izinleri: `MEDIA_VIEW`, `MEDIA_UPLOAD`, `MEDIA_EDIT`, `MEDIA_DELETE`
- `main.ts`'e `@fastify/multipart` kaydı (`MEDIA_MAX_UPLOAD_MB` limitiyle)

**Doğrulama:** Bu ortamda gerçek MinIO/Docker yok; bunun yerine **s3rver**
(gerçek bir S3-compatible HTTP sunucusu, npm'den — mock değil, gerçek
protokolü konuşan bir test double) yerel olarak ayağa kaldırıldı ve API
gerçekten ona karşı çalıştırıldı:
- Gerçek bir PNG dosyasını `multipart/form-data` ile HTTP üzerinden yükledim;
  API doğru şekilde `image/png` tespit etti, storage'a yazdı, DB satırı oluştu
- Döndürülen public URL'den dosyayı indirdim → orijinal dosyayla **byte-byte
  aynı** olduğunu doğruladım (gerçek upload/serve round-trip)
- Sahte dosya (düz metin, `.png` uzantılı, `Content-Type: image/png` iddiasıyla)
  → 400 (magic-byte kontrolü client'ın beyanını değil gerçek bytes'ı esas aldı)
- Aynı PNG'yi tekrar yükledim → aynı media id döndü (dedupe çalıştı, ikinci bir
  storage nesnesi oluşmadı)
- `MEDIA_UPLOAD` izni olmayan MEMBER rolüyle upload denemesi → 403
- Silme sonrası hem DB satırı (`GET /:id` → 404) hem storage nesnesi
  (public URL → 404) gerçekten kayboldu
- **Not:** s3rver `PutBucketPolicy` API'sini implemente etmiyor (gerçek
  MinIO/S3 eder) — bu tek adımı geçici bir env flag'iyle atlayıp test ettim,
  sonrasında flag'i koddan tamamen geri aldım (commit'te yok). Bucket policy
  çağrısının kendisi standart, iyi belgelenmiş bir S3 API'si; gerçek MinIO'ya
  karşı ayrı bir doğrulama gerektirir (ilk gerçek deployment'ta doğrulanmalı).

**Kapsam dışı bırakılanlar (sonraki fazlar):** Otomatik thumbnail/varyant
üretimi (`media_variants` tablosu — henüz üreticisi olmadığı için hiç
oluşturulmadı; image/video processing BullMQ job'ı PHASE 12-14'te), width/
height/duration alanları hâlâ `null` (ffprobe/sharp entegrasyonu yok),
büyük dosyalar için chunked/resumable upload, `ContentMedia` join tablosu
(content'lerin galeri/çoklu medya ilişkisi — `coverImage` hâlâ düz URL string).

## PHASE 8 — Projects / Services / Works (tamamlandı)

**Content Engine'e eklenen mekanizma:** `ContentService.create`/`update`
artık opsiyonel bir `onCreated`/`onUpdated` callback kabul ediyor —
`(tx, contentId) => Promise<void>`, aynı transaction içinde çağrılıyor.
Bu, PHASE 6/7'de kasıtlı olarak eksik bırakılan "extension table" bağlama
noktasını tamamlıyor: domain modülü kendi tablosuna atomically yazabiliyor,
Core ise hangi tabloya yazıldığını hiç bilmiyor. `Transaction` tipi
(`packages/core-database`) Drizzle'ın `db.transaction()` callback imzasından
çıkarıldı (elle yazılmadı) ki asla gerçek tipten sapmasın. Ayrıca
`ContentService.list/listPublic` domain servislerinin kendi taksonomisiyle
(Core'un bilmediği bir tabloyla, örn. `service_categories`) filtreleyebilmesi
için opsiyonel bir `restrictToIds: string[]` parametresi kazandı.

**Yeni core-database tabloları:** `project_details` (+ `project_status` enum:
CONCEPT/PLANNING/DEVELOPMENT/COMPLETED/MAINTENANCE/ARCHIVED — kasıtlı olarak
`contents.status` editoryal workflow'undan ayrı), `service_categories`
(Core'un genel `categories`'inden ayrı, Services'e özel hiyerarşi),
`service_details` (`features`/`process` text[], `faq` jsonb), `work_details`
(kasıtlı daha gevşek — `category` düz string, ayrı tablo yok).

**apps/api'ye eklenenler (`src/blog/`):** `projects/`, `services/`, `works/`
— her biri: Service (generic content alanlarını extension alanlarından ayırıp
`ContentService`'e delege eden, sonucu extension satırıyla birleştiren),
admin Controller (`CONTENT_VIEW/CREATE/EDIT/DELETE` + transition'da
`PUBLISHED` için ekstra `CONTENT_PUBLISH`), guard'sız Public Controller
(`/projects/public`, `/services/public`, `/works/public` — sadece
`PUBLISHED`), Module. `blog.module.ts` artık "post"a ek olarak "project",
"service", "work" tiplerini de registry'ye kaydediyor (extraFieldsSchema
boş — gerçek alanlar generic `/content` extraFields yolundan değil, doğrudan
extension tablosundan geçiyor).

**Bilinçli tasarım kararı — domain-özel izin yok:** Master prompt örnek olarak
`PROJECT_CREATE`, `PROJECT_EDIT` gibi ince taneli izinler gösteriyor, ama bu
faz Core'un genel `CONTENT_VIEW/CREATE/EDIT/DELETE/PUBLISH` izinlerini
Projects/Services/Works için de kullanıyor — domain-özel izin anahtarlarının
nereden seed edileceği (seed script Core paketinde, apps/api'den import
edemez) ayrı bir alt-sistem gerektirir; bu, extension-table mekanizmasını
kanıtlamak olan bu fazın kapsamı dışında bırakıldı.

**Doğrulama (gerçek PostgreSQL + Redis'e karşı, Docker olmadan):**
- Migration uygulandı (4 yeni tablo + `project_status` enum), seed yeniden
  çalıştı (idempotent)
- Gerçek bir Project oluşturdum (technologies text[], demoUrl, startDate
  dahil) — tek istekte hem `contents` hem `project_details` satırı atomically
  yazıldığını doğruladım
- `content.status` (DRAFT) ile `projectStatus` (DEVELOPMENT) bağımsız
  olduğunu doğruladım; publish sonrası `content.status=PUBLISHED` ama
  `projectStatus` değişmedi
- Kısmi PATCH (`sadece endDate+projectStatus`) → `problem`/`technologies`
  gibi dokunulmayan alanlar korundu
- **Cross-type guard:** bir project id'sini `/services/:id`'den çekmeye
  çalıştım → 404 ("Service not found") — content id'leri type-scoped değil,
  `assertIsService`/`assertIsProject` bunu engelliyor
- Service kategorisi oluşturup bir Service'e bağladım, `?categoryId=`
  filtresinin gerçekten `service_categories`'i kullandığını (Core'un genel
  `categories`'ini değil) doğruladım — yanlış/var olmayan bir kategori id'si
  boş liste döndürdü, doğru id 1 sonuç döndürdü
- Work oluşturdum (jsonb `links` array dahil)
- Domain tipleri arasında **tek slug namespace'i** doğrulandı: bir work'ü,
  var olan bir project'le aynı slug'la oluşturmaya çalışınca → 409
- `CONTENT_CREATE` izni olmayan MEMBER rolüyle `POST /works` → 403
- Geçersiz `projectStatus` enum değeri → 400 (zod); geçersiz content-status
  geçişi (`DRAFT → ARCHIVED`, workflow grafiğinde yok) → 400
- Soft-delete sonrası `project_details` satırının DB'de hâlâ var olduğunu
  doğruladım (CASCADE gerçek `DELETE`'te tetiklenir, soft-delete sadece
  `deletedAt` set eder — kasıtlı, geri alınabilirlik için)

**Kapsam dışı bırakılanlar (sonraki fazlar):** Domain-özel ince taneli izinler
(`PROJECT_CREATE` vb. — yukarıda açıklandı), Project/Work galeri desteği
(`ContentMedia` join tablosu, Media modülü artık hazır ama bu faz kapsamında
değildi), Services'in `process` alanının yapılandırılmış adım listesi yerine
düz string[] olması, apps/web'in bu endpoint'leri gerçekten render etmesi.
