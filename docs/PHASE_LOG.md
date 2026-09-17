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

## PHASE 4 — System Settings & Menü (tamamlandı)

**Yeni core-database tabloları:** `settings` (`category` PK — general/seo/social,
`values` jsonb, `updatedBy` FK users SET NULL), `menu_items` (düz liste,
kasıtlı olarak parent/child nesting yok — public site nav'ı için gerekli
değil, admin sidebar'ın kendi accordion mantığı ayrı bir konu).

**apps/api'ye eklenen (`core/settings/`):** `SettingsService`/`SettingsController`
(`GET /settings`, `GET /settings/:category` **guard'sız** — burada tutulan
hiçbir şey hassas değil; `PATCH /settings/:category` `SETTINGS_MANAGE` ister
ve stored değerin üstüne **merge** eder, replace etmez). Kategoriye özel zod
şemaları (`SETTINGS_SCHEMAS`/`UPDATE_SETTINGS_SCHEMAS`) `:category` param'ına
göre elle seçiliyor çünkü Nest'in `@Body()` pipe'ı decore-time'da sabit,
route çalışırken dinamik şema seçemiyor. `MenuService`/`MenuController`
(admin, `SETTINGS_MANAGE`) + `MenuPublicController` (guard'sız, yalnızca
`isVisible` öğeler) — `/content/public` ile aynı ayrık-controller deseni.

**Bulunan ve düzeltilen gerçek bug (kod üretimi sırasında, teste bile
girmeden yakalandı):** `MenuController`'ı ilk yazışta `@RequirePermission`'ı
controller sınıfının üstüne koymuştum. `PermissionsGuard` yalnızca
`context.getHandler()`'dan (metod seviyesi) metadata okuyor —
`context.getClass()` değil — yani class-level `@RequirePermission` **sessizce
hiç okunmuyor** ve `required` her zaman `undefined` kalıyor, bu da guard'ın
`if (!required) return true` yoluyla **tüm route'ları izin kontrolsüz
bırakması** demek. Codebase'deki her diğer controller (`RolesController`,
`ContentController`, `MediaController`...) zaten doğru şekilde metod
seviyesinde kullanıyordu; sadece bu yeni dosyada atladım. Test etmeden önce
fark edip metod seviyesine taşıdım, sonra testte MEMBER rolüyle `GET /menu`
denemesi gerçekten 403 döndürerek düzeltmeyi doğruladı.

**Seed script'e eklenen:** `general`/`seo`/`social` için varsayılan `settings`
satırları (idempotent, `onConflictDoNothing`).

**Doğrulama (gerçek PostgreSQL + Redis'e karşı, Docker olmadan):**
- Migration uygulandı (2 yeni tablo), seed varsayılan settings satırlarını
  oluşturdu — `GET /settings` seed'lenmiş `{general:{siteName:"2blog"},
  seo:{robotsIndexable:true}, social:{}}` döndürdü
- Bilinmeyen kategori (`/settings/bogus`) → 400; auth'suz PATCH → 401
- PATCH merge semantiği doğrulandı: önce `siteName`+`contactEmail` set edildi,
  sonra sadece `siteDescription` gönderildi → önceki iki alan korundu
- Geçersiz email formatı → 400 (kategoriye özel zod şeması çalışıyor)
- Menü: görünür + gizli (`isVisible:false`) öğeler oluşturdum → `/menu/public`
  sadece görünürleri döndürdü, admin `/menu` ikisini de döndürdü
- **Yukarıdaki bug fix'in canlı doğrulaması:** MEMBER rolüyle hem `POST /menu`
  hem `GET /menu` → ikisi de 403 (fix olmasaydı `GET /menu` yanlışlıkla 200
  dönecekti)
- Menü update/delete + var olmayan id'yi silme → 404, hepsi doğrulandı

**Kapsam dışı bırakılanlar (sonraki fazlar):** Menüde nested/parent-child
yapı (self-referencing FK — gerçek ihtiyaç doğduğunda eklenecek), settings
kategorilerinin admin panelden gerçekten düzenlenmesi (apps/admin hâlâ
placeholder), `social` kategorisinin gerçek OAuth token'ları tutması
(PHASE 14'te ayrı, encrypted bir `social_accounts` tablosunda olacak — bu
genel `settings` blob'una asla girmeyecek).

## Web Frontend — Blog/Hizmetler/Projelerimiz/Yaptıklarımız (tamamlandı)

**apps/web artık gerçek sayfalar render ediyor** (önceki fazlarda yalnızca
bir health-check placeholder'ıydı). Kapsam: `/`, `/blog(+detay)`,
`/hizmetler(+detay)`, `/projelerimiz(+detay)`, `/yaptiklarimiz(+detay)` —
hepsi Server Component, hepsi `lib/api.ts` üzerinden Core API'nin guard'sız
`/*​/public` uçlarını çağırıyor (ARCHITECTURE.md madde 2/3'ün ilk kez
gerçek bir frontend'le uçtan uca kanıtlanması). Header/Footer `/menu/public`
ve `/settings/general`'ı gerçekten çağırıyor — hard-coded nav yok.

**Tailwind eklendi** (`tailwindcss`/`postcss`/`autoprefixer`, apps/web'e).
`tailwind.config.ts`, renklerini `packages/config`'in `designTokens`'ından
alıyor — ikinci bir palet kopyası açmak yerine (madde 24). Dark-mode token
değerleri `packages/config`'te zaten var ama bu fazda henüz bağlanmadı
(light-only, bilinçli kapsam kesintisi).

**SEO:** her detay sayfası `generateMetadata` ile content'in
`seoTitle`/`seoDescription`/`canonicalUrl`/`noindex` alanlarını gerçekten
kullanıyor (fallback: title/excerpt). Yayınlanmamış veya var olmayan slug
→ `notFound()` → gerçek Next.js 404 (sitemap.xml/robots.txt/JSON-LD ayrı
bir SEO fazına bırakıldı, PHASE 10-11).

**Bilinçli kapsam kararı:** Master prompt'un public menüsünde ayrıca
Haberler/İpuçları/SSS/Kütüphane/İstatistikler/İletişim var, ama bunlar
için sayfa yazılmadı — çünkü news/tip/faq/library content type'ları (Blog
domain modülünde henüz kayıtlı değil) ve istatistik/iletişim backend'i
(PHASE 11 Analytics, henüz yok) yok. Var olmayan bir backend'e sahte bir
frontend sayfası yazmak yerine, gerçekten çalışan dört tür için gerçek
sayfalar yapıldı.

**Doğrulama (gerçek PostgreSQL + Redis + s3rver'a karşı, Docker olmadan):**
- Gerçek post/project/service/work içerikleri oluşturup yayınladım (bazıları
  önceki fazlardan kalma soft-delete edilmiş verilerle çakıştığı için yeni
  slug'larla), `apps/web`'i build edip başlattım
- **Önemli operasyonel bulgu (bug değil, Next.js'in belgelenmiş davranışı):**
  İlk build API'de hiç içerik yokken yapıldığından statik ana sayfa boş
  snapshot aldı; içerik oluşturduktan hemen sonraki ikinci build de hâlâ
  eskiyi gösterdi çünkü Next'in fetch/Data Cache'i `.next/cache`'te
  **build'ler arasında** persist ediyor ve 60s'lik revalidate penceresi
  henüz dolmamıştı. `.next` temizlenip yeniden build edilince doğru içerik
  geldi. Bu, gerçek bir production deploy pipeline'ının (build → deploy)
  neden içerik yayınlandıktan sonra ya cache'i temizlemesi ya da
  `revalidatePath` tetiklemesi gerektiğini somut olarak gösteriyor.
- Ana sayfada 4 bölümün de (Hizmetlerimiz/Projelerimiz/Son Yazılar/
  Yaptıklarımız) gerçek başlıklarla render olduğunu doğruladım
- Her detay sayfasını curl'ledim: blog `<title>`/meta description doğru,
  proje teknolojiler+demo/repo linkleri doğru, hizmet özellikler/süreç/SSS/CTA
  doğru, iş sonuç/bağlantılar doğru
- **DRAFT içerik web'den 404 döndü** (public API zaten gizliyor, ama bunu
  frontend üzerinden de doğruladım — API'nin `/​public` guard'ının
  gerçekten frontend'e kadar korumayı taşıdığının kanıtı)
- `noindex:true` ile yayınlanan bir yazı `<meta name="robots" content="noindex,
  nofollow">` döndürdü — `/blog/[slug]`'ın dynamic (build gerektirmeyen)
  render olduğu için yeniden build etmeden hemen doğru geldiğini de gördüm
- Var olmayan slug → gerçek Next.js 404 sayfası

**Kapsam dışı bırakılanlar (sonraki fazlar):** apps/admin hâlâ placeholder
(bir sonraki mantıklı adım), Haberler/İpuçları/SSS/Kütüphane/İstatistikler/
İletişim sayfaları (ilgili content type'lar/backend hazır olunca), dark
mode, sitemap.xml/robots.txt/JSON-LD (PHASE 10-11), galeri/video desteği
(Media modülü hazır ama `ContentMedia` join tablosu yok).

## Admin Panel — Auth/Layout/Dashboard/İçerik/Medya (tamamlandı)

**apps/admin artık gerçek bir yönetim paneli** (önceki fazlarda placeholder'dı).
Kapsam bilinçli olarak temel tutuldu: Auth, Layout, Dashboard, İçerik
(post CRUD + publish workflow), Medya. Projects/Services/Works admin UI,
Users/Roles admin UI, Settings/Menü admin UI **bilinçli olarak ertelendi**
(fast-follow) — Core API tarafları zaten var (önceki fazlarda yazıldı),
sadece admin arayüzleri yok.

**Auth:** `apps/web`'den farklı olarak apps/admin token'ları hiç client
JS'e açmıyor — httpOnly cookie + `middleware.ts`'te sessiz refresh
(madde: access token yoksa refresh token'la `POST /auth/refresh` deneniyor,
o da başarısızsa `/login`'e redirect). Login Server Action
(`@2blog/validation`'ın `loginSchema`'sıyla doğrulanıyor) → cookie set →
redirect. `(admin)/layout.tsx` her sayfa için `GET /users/me`'yi çağırıp
kullanıcı+izinleri alıyor; `UnauthenticatedError` → `/login`. Sidebar
izinlere göre menüyü filtreliyor ama bu **sadece UX** — gerçek sınır
her zaman API'nin `PermissionsGuard`'ı.

**İçerik:** liste/oluştur/düzenle/sil + workflow geçiş butonları
(`@2blog/core-content-engine`'in `canTransitionContent`'i import edilerek
kullanıldı — workflow grafiğinin admin tarafında ikinci bir kopyasını
yazmak yerine, madde 24). Create/update aynı `ContentForm` client
component'ini paylaşıyor (`useActionState`).

**Medya:** multipart upload (`apiFetchForm`) + silme, grid'de görsel
önizleme.

**Bulunan ve düzeltilen bug — test script'inde, uygulama kodunda değil:**
İçerik oluşturma formunu Playwright ile uçtan uca test ederken, submit
sonrası tarayıcı `/icerik/<yeni-id>` yerine `/login`'e düşüyordu ve DB'de
yeni satır oluşmuyordu. `createPostAction`'ın içine eklenen debug log'lar
fonksiyonun **hiç çağrılmadığını** gösterdi; middleware'in geçerli bir
access token gördüğünü ve `apiFetch`'in hiç tetiklenmediğini de doğruladım
— yani sorun uygulama mantığından önce, framework/routing seviyesindeydi
gibi görünüyordu. Playwright'ın `request`/`response` event'lerini dinleyip
gerçek POST'un header'larını yakaladım: `next-action` header'ındaki action
ID'yi `.next/server/server-reference-manifest.json`'da elle çözünce, bu
ID'nin `createPostAction`'a değil **`logoutAction`'a** ait olduğu ortaya
çıktı. Kök neden: test script'i `page.click('button[type="submit"]')` gibi
sayfa genelinde generic bir selector kullanıyordu; `(admin)/layout.tsx`
her admin sayfasında Topbar'ı (kendi `<form action={logoutAction}>`'ıyla)
`<main>`'den **önce** render ediyor, yani DOM'da önce Topbar'ın "Çıkış
yap" butonu geliyor. Playwright generic selector'la ilk eşleşen submit
butonunu (çıkış butonunu) tıklıyordu — her "içerik oluştur" denemesi
aslında kullanıcıyı çıkış yaptırıp `/login`'e atıyordu, tam gözlemlenen
davranışın nedeni. Uygulama kodunda **hiçbir değişiklik gerekmedi**;
düzeltme yalnızca test script'lerinde her forma özgü selector kullanmaktı
(`form:has(#title) button[type="submit"]`, `:has-text("Yayınla")` gibi).
Bu araştırma sürecinde ayrıca (yanlış bir ipucu olarak) `.next` build
cache'inin bir önceki oturumdan kalma stale state taşıyabileceği
ihtimalini de elendi (`rm -rf .next` ile tam temiz rebuild yapıp aynı
sonucu aldım) — gerçek kök neden yukarıdaki selector çakışmasıydı.

**Doğrulama (gerçek PostgreSQL + Redis + s3rver'a karşı, Docker olmadan,
gerçek Chromium/Playwright ile uçtan uca):** login → içerik oluştur →
yayınla (DRAFT→PUBLISHED transition) → başlığı düzenle+kaydet → listede
göründüğünü doğrula → medya yükle → medya sayfasında göründüğünü doğrula
→ medyayı sil → içeriği sil → listeden kalktığını doğrula → çıkış yap →
`/login`'e düştüğünü doğrula → `/`'ye tekrar gidince yine `/login`'e
düştüğünü doğrula (post-logout guard). Hepsi tek bir script'te uçtan uca
geçti.

**Kapsam dışı bırakılanlar (sonraki fazlar):** Projects/Services/Works
admin UI, Users/Roles admin UI, Settings/Menü admin UI, dark mode.

## Admin Panel — Projelerimiz/Hizmetler/Yaptıklarımız/Kullanıcılar/Roller/Ayarlar/Menü (tamamlandı)

Önceki fazda bilinçli olarak ertelenen admin arayüzlerinin tamamı yazıldı.
Hepsi mevcut Core API uçlarını `lib/api.ts` üzerinden çağırıyor — DB'ye
doğrudan bağlanan yok, yeni bir API endpoint'i açılmadı (bu faz saf admin
UI fazı).

**Paylaşılan component'ler** (İçerik'in kendi ContentForm'una dokunmadan,
üç yeni domain arasında tekrarı önlemek için): `ContentBaseFields.tsx`
(title/slug/excerpt/body/coverImage/SEO fieldset — Content Engine'in
ortak alanları), `ContentStatusBar.tsx` (durum + geçiş butonları + sil),
`lib/content-status-labels.ts` (Türkçe durum etiketleri). İçerik'in
`[id]/page.tsx`'i de bu paylaşılan component'leri kullanacak şekilde
düşük riskli bir DRY refactor'ü aldı (davranış aynı, `test3.js` ile
regresyon olmadığı doğrulandı).

**Projelerimiz/Hizmetler/Yaptıklarımız:** İçerik'teki CRUD+workflow
deseninin birebir aynısı, her biri kendi domain-özel alanlarıyla
(`packages/validation`'daki create/update şemalarına birebir uyacak
şekilde). Hizmetler'in kategori seçimi için `/hizmetler` sayfasına inline
bir "kategori ekle" formu eklendi (API'de kategori update/delete uç noktası
yok — yalnızca list+create var, admin UI da bununla sınırlı).

**Kullanıcılar/Roller:** `GET /users` ve `GET /roles` uçları sırasıyla
kullanıcının mevcut rollerini ve rolün mevcut izinlerini döndürmüyor
(yalnızca atama/ekleme uçları var, "mevcut durumu listele" yok) — bu API
tarafının önceki bir fazdan kalma bilinen bir kısıtı; admin sayfaları bunu
kullanıcıya açıkça not olarak gösteriyor, API'yi bu faz kapsamında
genişletmedim (kapsam: admin UI, API değil).

**Ayarlar/Menü:** Ayarlar üç kategori (general/seo/social) için ayrı
`PATCH` formu; Menü tam CRUD (oluştur/düzenle/sil), `Sil` butonu aynı
`<form>` içinde `formAction` override'ıyla (ikinci bir nested form
gerektirmeden).

**Bulunan ve düzeltilen bug'lar (bu kez ikisi de test script'inde, ilki
önceki fazdakiyle aynı sınıftan):**
1. API'yi s3rver'a karşı başlatırken tekrar `NotImplemented` hatası
   (`PutBucketPolicyCommand`, s3rver'ın desteklemediği) çıktı çünkü bu
   oturumun taze container'ında `packages/core-media`'nın `dist/` build
   çıktısı, önceki fazın test bypass'ının geri alınmasından SONRAKİ
   kaynak durumuyla senkronize değildi — bypass'ı test için tekrar
   eklerken `pnpm --filter @2blog/core-media build` çalıştırmayı atlamıştım,
   NestJS `@2blog/core-media`'yı `dist/`'ten import ettiği için kaynak
   değişikliği hiç etkili olmadı. Paket build edilince düzeldi. Test
   bitince bypass tekrar geri alındı VE paket tekrar build edildi (dist'in
   commit edilen kaynakla senkron kalması için).
2. Menü CRUD testinde `page.locator("form", { has: page.locator('input[value=X]') })`
   deseni kullanıldı; düzenleme formunda önce input'un value'sunu
   `fill()` ile değiştirip SONRA aynı `has:` filtresine dayanan locator'ı
   tekrar sorgulayınca (`.locator(...).click()`), filtre artık DOM'da
   eşleşmiyordu (çünkü input'un value'su X değil artık) — locator
   canlı/lazy değerlendirildiği için. Düzeltme: `elementHandle()` ile
   formun sabit bir DOM referansını alıp sonraki tüm etkileşimleri o
   handle üzerinden yapmak (fill + Kaydet/Sil butonlarını
   `:not([formaction])` / `[formaction]` ile ayırt ederek). Uygulama
   kodunda hiçbir değişiklik gerekmedi.

**Doğrulama (gerçek PostgreSQL + Redis + s3rver'a karşı, Docker olmadan,
gerçek Chromium/Playwright ile uçtan uca):** proje oluştur → yayınla →
düzenle → listede doğrula → sil → listeden kalktığını doğrula (aynı akış
hizmet için — önce kategori oluşturup hizmete atayarak — ve iş için de
tekrarlandı) → rol oluştur → role izin ekle (hatasız) → kullanıcıya rol
ata (hatasız) → genel ayarları güncelle → sayfa yenilenince kalıcı
olduğunu doğrula → menü öğesi oluştur → düzenle → sil, her adımda
doğrulama. Ayrıca önceki fazın İçerik/Medya testi (`test3.js`) regresyon
kontrolü için tekrar çalıştırıldı ve geçti.

**Kapsam dışı bırakılanlar:** dark mode. Bunun dışında master prompt'un
admin panelindeki her domain artık bir arayüze sahip; sıradaki mantıklı
adım farklı bir faz (Scraper/AI/Social/Analytics/SEO).

## Scraper / Data Pool (tamamlandı)

Master prompt'un Scraper fazı — `docs/ARCHITECTURE.md` madde 10'un
Core/Domain ayrımı ilk kez gerçek koda döküldü, ve `apps/worker` ilk defa
gerçek bir BullMQ processor kazandı (önceki fazlardan beri "no queues
registered yet" placeholder'dı).

**Core: `packages/core-scraper-kit`** (yeni paket, DB tablosu yok — saf
mekanizma, madde 10'un "CORE (packages/core-scraper-kit)" listesiyle
birebir): `fetchHtml` (SSRF guard'lı, timeout+exponential-backoff retry'lı
fetch), `isAllowedByRobots` (hand-rolled minimal robots.txt parser —
Media'nın magic-byte sniffing'i gibi küçük, tam sahip olunan bir parsing
parçası, dependency değil), `RateLimiter` (Redis `INCR`+`EXPIRE` tabanlı
domain-başına sabit-pencere sayaç — spec "token bucket" diyor ama bu daha
basit bir varyant, aynı garantiyi veriyor: pencere başına host başına en
fazla N istek), `assertPublicHttpUrl` (SSRF guard — madde "allowlist +
private IP range engeli"; **hostname string'ine değil DNS'in çözümlediği
gerçek adrese** bakıyor, çünkü bir hostname DNS rebinding ile private bir
IP'ye işaret edebilir), `extractText/extractAttr/extractLinks` (cheerio),
`computeContentHash` (normalize edilmiş metnin sha256'ı — dedup anahtarı).

**Domain: `apps/api/src/blog/scraper`** — `ScraperSourcesService/
Controller`, `ScraperRulesService/Controller`, `CrawlJobsService/
Controller` (BullMQ `scraper` kuyruğuna enqueue eden tek yer — API asla
kendisi taramaz, madde 7: "Uzun süren hiçbir işlem HTTP request içinde
çalıştırılmaz"), `DataPoolService/Controller` (liste/onayla/reddet/
yayınla — yayınlama `ContentService.create`'i doğrudan çağırıyor, yeni bir
"Post" domain servisi yok çünkü `post` typeKey'inin zaten extension
tablosu yok). Yeni izinler: `SCRAPER_MANAGE`, `DATA_POOL_MANAGE`
(`CORE_PERMISSIONS`'a eklendi, seed script'i idempotent olduğu için var
olan SUPER_ADMIN rolüne otomatik eklendi).

**İlk gerçek Redis kullanımı `apps/api`'de** (`core/cache/cache.module.ts`,
`DatabaseModule`'ün DI-token deseninin birebir aynısı) — daha önce
`apiEnvSchema` `REDIS_URL`'i zorunlu kılıyordu ama hiçbir şey onu
okumuyordu.

**apps/worker: `processors/scraper.processor.ts`** — SOURCE → CRAWL → RAW
DATA → EXTRACTION → NORMALIZATION → CLASSIFICATION → DUPLICATE CHECK
(madde 10) hepsi bu tek job içinde senkron: liste sayfasını çek, öğe
linklerini çıkar (crawl başına en fazla 20 — bilinçli sınır), her link için
SSRF guard + robots.txt + rate limit kontrolü, sayfayı çek, selector'larla
extract et, `raw_data_items`'a `contentHash` üzerinden
`onConflictDoNothing` ile dedup'lu insert (bu *DUPLICATE* durumunun ta
kendisi — ikinci bir satır asla oluşmuyor), yeni olan her satır için
`data_pool_items` (durum: PROCESSED, çünkü RAW hiç persist edilmiyor —
extraction zaten senkron). REVIEW/APPROVAL/PUBLISH tamamen ayrı, admin
tetikli aksiyonlar (`DataPoolService`) — worker asla `contents`'a yazmıyor.

**Bulunan ve düzeltilen buglar:**
1. **Uygulama bug'ı (küçük, düzeltildi):** `DataPoolService.publish`
   `data_pool_items.slug`'ı hiç set etmiyordu — `contents` satırı doğru
   slug'la yaratılıyordu ama data pool'un kendi kaydı `slug: null` kalıyordu.
   Publish sırasında `input.slug`'ı da yazacak şekilde düzeltildi.
2. **Uygulama bug'ı (admin, düzeltildi):** `veri-havuzu/actions.ts`'teki
   `approveAction` API'yi body'siz bir POST ile çağırıyordu; `lib/api.ts`'teki
   `apiFetch` her zaman `Content-Type: application/json` header'ı
   ekliyor, ve Fastify boş body + bu header kombinasyonunda "Body cannot
   be empty when content-type is set to 'application/json'" hatası
   veriyor. Codebase'teki her önceki POST/PATCH action'ı zaten bir body
   gönderdiği için bu şimdiye kadar hiç tetiklenmemişti — approveAction
   body'siz POST atan ilk action'dı. Düzeltme: `body:
   JSON.stringify({})` eklemek (sunucu tarafında `/approve` zaten bir
   `@Body()` beklemiyor, sadece Fastify'ın parser'ını tatmin etmek için).
3. **Test script'inde (uygulama değil):** Data Pool E2E testinde otomatik
   önerilen slug (`slugify(title)`) sahte test verisinin başlığından
   deterministik türediği için tekrarlanan test çalıştırmaları arasında
   çakışıyordu (`contents.slug` unique) — ikinci çalıştırmadan itibaren
   publish "409 Conflict" ile başarısız oluyordu (bu *doğru* davranış,
   uygulamanın kendisi doğru reddediyordu). Bunu debug ederken önce
   yanlışlıkla bir timing sorunu sandım (timeout'u büyüttüm), gerçek kök
   nedeni `curl` ile API'yi doğrudan çağırıp (başarılı) ve ardından
   `contents` tablosunda çakışan slug'ı bulunca anladım. Düzeltme: test
   script'i publish formundaki slug'ı `stamp` ile benzersizleştiriyor.

**Doğrulama (gerçek PostgreSQL + Redis + s3rver + gerçek bir yerel HTTP
hedefi — `127.0.0.1` üzerinde sahte bir "blog" sitesi, 3 yazı — Docker
olmadan, gerçek Chromium/Playwright ile uçtan uca):** kaynak oluştur
(liste URL'i + liste öğesi selector'ı) → kural oluştur (başlık/içerik/
özet/kapak selector'ları) → "Şimdi tara" → crawl job SUCCESS, 3 bulundu/3
yeni → Data Pool'da 3 öğe göründüğünü doğrula → bir öğeyi onayla → slug
girip yayınla → `İçerik` admin'inde doğru başlıkla gerçek bir `contents`
satırı olarak göründüğünü doğrula → başka bir öğeyi sebep yazarak reddet,
reddedildiğini ve sebebin göründüğünü doğrula. Ayrıca **SSRF guard**'ı ve
**rate limiter**'ı testler sırasında ayrı ayrı doğruladım: SSRF guard test
dışı bırakılmadan önce `127.0.0.1`'i gerçekten blokluyordu (beklenen
güvenlik davranışı, testler için `SKIP_SSRF_GUARD_FOR_TEST` ile s3rver
fazındaki `SKIP_BUCKET_POLICY_FOR_TEST` deseninin aynısıyla geçici olarak
bypass edildi, test bitince kaynak koddan tamamen geri alındı ve paket
yeniden build edildi); rate limiter da testler sırasında gerçekten devreye
girip art arda gelen taramalarda bazı item'ları "Rate limit exceeded"
diyerek atladığını worker log'unda gördüm — ikisi de gerçek, çalışan
davranışlar, sahte/iddia değil.

**Bilinçli kapsam kararları:** `scheduleCron` alanı var ama okunmuyor —
taramalar admin'den elle tetikleniyor (gerçek cron scheduler sonraki faz).
Publish yalnızca `typeKey: "post"` destekliyor (Project/Service/Work'ün
zorunlu ekstra alanları taranan veride doğal olarak yok). `ScraperRule`
için update/delete yok (yalnızca list+create, `service_categories`
emsaliyle aynı desen). Crawl başına en fazla 20 öğe.

## AI (tamamlandı)

Master prompt'un AI fazı — `docs/ARCHITECTURE.md` madde 12'nin
`AIProvider` soyutlaması gerçek koda döküldü. `/ai` uç noktası bilinçli
olarak **Core seviyesinde** (`apps/api/src/core/ai`) — Scraper'ın aksine
(o bir Blog domain modülüydü), AI generation herhangi bir domain'in
kullanabileceği generic bir kapasite, bu yüzden `apps/api/src/blog/`
altında değil.

**`packages/core-ai`** (yeni paket): `AIProvider` arayüzü — bu fazda
yalnızca `generateText` (görsel/ses üretimi bilinçli olarak dışarıda
bırakıldı, aşağıda gerekçesi var). Üç sağlayıcı yazıldı:
`OllamaProvider` (yerel HTTP sunucusuna karşı, gerçek Ollama `/api/generate`
kontratıyla), `OpenAiProvider` (OpenAI Chat Completions kontratı),
`GeminiProvider` (Gemini `generateContent` kontratı). `PromptRegistry` —
`{{değişken}}` interpolasyonlu, anahtar+versiyon bazlı şablon deposu;
`ContentTypeRegistry`'nin aynı deseni: domain modülleri kendi promptlarını
`OnModuleInit`'te kaydediyor, Core hiçbirini bilmiyor.

**Dürüst bir kısıt — bu oturumda gerçekten test edilebilen tek sağlayıcı
Ollama oldu.** Bu sandbox'ta ne `OPENAI_API_KEY`/`GEMINI_API_KEY` var, ne
de genel internet erişimi (agent proxy `ollama.com` dahil izin
listesinde olmayan hiçbir domain'e izin vermiyor — kurulum denemesi bile
`403` ile reddedildi). `OpenAiProvider`/`GeminiProvider` gerçek API
kontratlarına karşı yazıldı ve typecheck'ten geçti ama bu ortamda hiç
canlı çağrılmadı — Scraper fazındaki s3rver/gerçek-blog testleri gibi,
burada da "gerçek olmayan hiçbir şeyi iddia etme" ilkesine uyarak bunu
açıkça belirtiyorum. Test edilen tek yol `AI_PROVIDER=ollama` — ve Ollama
zaten yerel bir HTTP sunucusu olduğu için, gerçek Ollama REST kontratını
taklit eden küçük bir yerel stub sunucusuna (`/api/generate`,
`{response, eval_count}` şekli) karşı test edildi; bu, s3rver'ın S3'ü
veya sahte blog sitesinin gerçek bir blog'u taklit etmesiyle birebir aynı
desen.

**`apps/api/src/core/ai`**: `AiService` — `AI_PROVIDER` env'inden bir kez
sağlayıcı seçip enjekte ediyor (istek başına değil), `generateText`
çağırıp sonucu (başarılı ya da başarısız, ikisi de) `ai_requests`'e
logluyor (madde 12: "Tüm çağrılar ai_requests'e loglanır"). `ai_requests`
Core tablosu (`media`/`settings` gibi, domain tablosu değil).
`AiController`: `POST /ai/generate/text` (`AI_USE` izni) — `prompt`
(serbest metin) veya `promptKey`+`variables`'tan tam olarak biri zorunlu
(`generateTextSchema`'nın `.refine()`'ı).

**`apps/api/src/blog/blog.module.ts`**: `AiService`'i inject edip
`OnModuleInit`'te `blog-post-draft` promptunu kaydediyor — tıpkı content
type'ları kaydettiği gibi. `AiModule`'ün kendisi bunu hiç bilmiyor (ilk
yazımda yanlışlıkla AiModule'ün kendi içine bir Blog prompt'u
kaydetmiştim, kendi mimari yorumumla çelişiyordu — fark edip BlogModule'e
taşıdım, ContentTypeRegistry'nin gerçek deseniyle birebir aynı hale
getirdim).

**admin (`/ai`)**: iki adımlı bir araç — 1) konu gir, "Taslak üret"
(promptKey: "blog-post-draft" ile `/ai/generate/text` çağrılıyor), 2)
üretilen metni gözden geçir/düzenle, başlık+slug'ı konu'dan otomatik
öner, "Taslak olarak kaydet". **AI çıktısı asla doğrudan PUBLISHED
olmuyor** (madde 12) ve bunu sağlamak için özel bir mekanizma da
yazmadım: "Taslak olarak kaydet" butonu İçerik sayfasının **zaten var
olan** `createPostAction`'ını doğrudan import edip çağırıyor — aynı
generic `POST /content` her zaman DRAFT'ta başlıyor. AI'dan Content
Engine'e özel bir "domain glue" katmanı hiç gerekmedi.

**Doğrulama (gerçek PostgreSQL + Redis + s3rver + yerel bir sahte Ollama
sunucusu — Docker olmadan, gerçek Chromium/Playwright ile uçtan uca):**
`/ai` sayfasında konu gir → "Taslak üret" → sahte Ollama'nın ürettiği
metin (prompt'un kendisini yankılıyor, gerçekten AiService'in
PromptRegistry'den render ettiği prompt'un sahte sunucuya ulaştığını
kanıtlıyor) body alanına doldu, sağlayıcı "ollama" olarak gösterildi →
başlık/slug konu'dan otomatik önerildi → "Taslak olarak kaydet" →
`/icerik/<id>`'e yönlendi, gerçek bir `contents` satırı `DRAFT`
durumunda oluştu, İçerik admin'inde göründü. Veritabanında `ai_requests`
satırını doğrudan sorgulayıp `provider=ollama`, `promptKey=blog-post-draft`,
render edilmiş `prompt`'un `{{topic}}`'i gerçekten konu metniyle
değiştirdiğini, `tokensUsed=42` (sahte sunucunun döndürdüğü
`eval_count`), `status=SUCCESS` olduğunu doğruladım.

**Bilinçli kapsam kararları:** `generateImage`/`generateAudio` yok —
madde 7'nin "ağır işlemler BullMQ üzerinden asenkron" kuralı bunlar için
geçerli olacağından, bunları eklemek yalnızca `AIProvider`'a bir metod
daha eklemek değil, ayrı bir kuyruk-destekli akış (job durumu sorgulama
endpoint'i dahil) gerektiriyor — bu fazın kapsamı dışında bırakıldı.
`/ai/generate/image|summary` gibi diğer master-prompt uç noktaları da bu
yüzden yok. `OpenAiProvider`/`GeminiProvider` yazıldı ama hiç canlı test
edilemedi (yukarıda gerekçesi var).
