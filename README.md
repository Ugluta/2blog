# 2blog — Core Platform

Modüler monolith mimarisiyle geliştirilen içerik/dijital hizmet platformu.
Mimari kararlar ve gerekçeleri için bkz. [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Yapı

```
apps/
  web/      Next.js — public site (Blog/Hizmetler/Projelerimiz/Yaptıklarımız, Tailwind)
  admin/    Next.js — admin panel (UI, business logic yok, hâlâ placeholder)
  api/      NestJS — tüm business logic, RBAC, validation, audit
  worker/   BullMQ worker — scraper/AI/media/social/email job'ları

packages/
  config/          env şeması + design tokens
  types/            paylaşılan TS tipleri (API zarfı, Core identity)
  validation/         zod şemaları (auth, rbac, ortak)
  core-database/        Drizzle schema + client (PostgreSQL) + seed script
  core-auth/              argon2id, access/refresh token, rotation yardımcıları
  core-rbac/                hasPermission() + Core izin registry'si
  core-content-engine/        content workflow state machine + type registry
  core-media/                   StorageProvider abstraction (S3/MinIO), mime sniffing
```

## Auth & RBAC (PHASE 3)

- `POST /api/v1/auth/login|refresh|logout` — refresh token rotation + reuse
  detection (bkz. `docs/ARCHITECTURE.md` madde 8). Public registration
  endpoint'i yok; ilk admin kullanıcı seed script ile oluşturulur.
- `GET /api/v1/users/me` — geçerli access token yeterli.
- `GET/POST /api/v1/roles`, `POST /api/v1/roles/:id/permissions`,
  `GET /api/v1/permissions`, `POST /api/v1/users/:id/roles` — `ROLE_VIEW` /
  `ROLE_MANAGE` / `USER_VIEW` / `USER_MANAGE` izinleriyle korunur.

```bash
pnpm db:migrate  # şemayı uygula
SEED_ADMIN_EMAIL=admin@example.com SEED_ADMIN_PASSWORD=... pnpm db:seed
```

## Content Engine

Generic, tip registry tabanlı (bkz. `docs/ARCHITECTURE.md` madde 5) — Core
`typeKey` string'i ve zod şeması dışında hiçbir domain tipini bilmez. Blog
domain modülü (`apps/api/src/blog`) bootstrap'ta `"post"` tipini kaydeder;
Evrak/Koli/2e Music gibi gelecekteki uygulamalar kendi tiplerini aynı
registry'ye kendi domain modüllerinden kaydeder.

- `GET/POST /api/v1/content`, `GET/PATCH/DELETE /api/v1/content/:id`,
  `POST /api/v1/content/:id/transition` — `CONTENT_VIEW/CREATE/EDIT/DELETE`
  izinleriyle korunur; `PUBLISHED`'a geçiş ayrıca `CONTENT_PUBLISH` ister.
- `GET /api/v1/content/public`, `GET /api/v1/content/public/:slug` — **guard'sız**,
  yalnızca `PUBLISHED` içerik döner. `apps/web`'in SSR sırasında çağıracağı
  yer burasıdır (madde 2/3: web asla DB'ye doğrudan bağlanmaz).
- `GET/POST /api/v1/categories`, `GET/POST /api/v1/tags` — many-to-many
  ilişki (`content_categories`, `content_tags`).
- Durum akışı: `DRAFT → REVIEW → APPROVED → SCHEDULED → PUBLISHED → ARCHIVED`
  (`packages/core-content-engine`'de tanımlı, geçersiz geçişler 400 döner).

## Media

`packages/core-media` içinde `StorageProvider` arayüzü + S3-compatible
implementasyon (bkz. `docs/ARCHITECTURE.md` madde 13) — bugün MinIO, ileride
Cloudflare R2/AWS S3'e config değişikliğiyle geçilebilir. Dosya bytes'ı
PostgreSQL'de tutulmaz; DB yalnızca metadata (`storageKey`, `mimeType`,
`size`, `hash`, `altText`, `caption`, `ownerId`) tutar.

- `POST /api/v1/media/upload` (`multipart/form-data`) — client'ın Content-Type
  beyanı **hiçbir zaman güvenilmez**; gerçek dosya tipi magic-byte sniffing
  ile tespit edilir, eşleşmezse (spoofed uzantı) 400 döner.
- Aynı dosya (aynı sha256 hash) tekrar yüklenirse **dedupe** edilir — yeni
  storage nesnesi/DB satırı oluşmaz, mevcut medya döner.
- `GET /api/v1/media`, `GET /api/v1/media/:id`, `PATCH /api/v1/media/:id`
  (altText/caption), `DELETE /api/v1/media/:id` — `MEDIA_VIEW/UPLOAD/EDIT/DELETE`
  izinleriyle korunur. Silme, storage nesnesini de gerçekten siler.
- Bucket + public-read policy API bootstrap'ında otomatik oluşturulur
  (`StorageModule`, idempotent).

## Projects / Services / Works

Content Engine'in "extension table" mekanizmasının gerçek örneği (bkz.
`docs/ARCHITECTURE.md` madde 5, 8) — her biri `contents` satırı (generic
title/slug/SEO/workflow) + kendi extension tablosu (`project_details`,
`service_details`, `work_details`, 1:1 CASCADE FK). `ContentService.create/
update` artık domain modüllerinin aynı transaction içinde kendi tablosuna
yazabileceği bir `onCreated`/`onUpdated` callback kabul ediyor — Core hâlâ
`project_details` diye bir şey bilmiyor.

- `/projects`, `/services`, `/works` — aynı CRUD + `/​:id/transition` +
  `/public` deseni, `content.controller.ts` ile birebir aynı izinler
  (`CONTENT_VIEW/CREATE/EDIT/DELETE` + `PUBLISHED` için `CONTENT_PUBLISH`).
- **Editoryal durum ≠ domain durumu**: `content.status` (DRAFT..PUBLISHED)
  ile `project.projectStatus` (CONCEPT..ARCHIVED, projenin gerçek hayattaki
  ilerlemesi) tamamen bağımsız — bir proje `PUBLISHED` yazıyla anlatılırken
  hâlâ `DEVELOPMENT` durumunda olabilir.
- `/service-categories` (`GET` herkese açık, `POST` `CONTENT_EDIT`) — Core'un
  genel `categories` tablosundan **ayrı**, Services'e özel bir hiyerarşi.
  `ContentService.list/listPublic` artık domain servislerinin kendi
  taksonomisiyle (Core'un bilmediği bir tabloyla) filtreleyebilmesi için
  opsiyonel bir `restrictToIds` parametresi kabul ediyor.
- Works kasıtlı olarak daha gevşek: `category` düz bir string, ayrı bir
  tablo yok (master prompt madde 6: "aynı veri modeli olmak zorunda değil").

## System Settings & Menü

- `GET /api/v1/settings`, `GET /api/v1/settings/:category` — **herkese açık**
  (site adı, SEO varsayılanları, sosyal linkler — hiçbiri hassas değil, `apps/web`
  SSR'da unauthenticated çağırır). `PATCH /api/v1/settings/:category`
  `SETTINGS_MANAGE` ister ve **merge** eder (replace değil — sadece gönderilen
  alanlar güncellenir). Kategori başına ayrı zod şeması (`general`/`seo`/`social`);
  bilinmeyen kategori 400 döner.
- `GET /api/v1/menu/public` — herkese açık, yalnızca `isVisible=true` öğeler,
  `position`'a göre sıralı (master prompt madde 3: "Menüler hard-coded
  olmayacak"). `GET/POST/PATCH/DELETE /api/v1/menu` — admin, `SETTINGS_MANAGE`.
- Seed script varsayılan `general`/`seo`/`social` satırlarını, ve DB'de hiç
  menü öğesi yoksa varsayılan 5 menü öğesini de idempotent şekilde oluşturur.

## Web (public site)

`apps/web` artık gerçek sayfalar render ediyor — hepsi Server Component,
hepsi `lib/api.ts` üzerinden Core API'nin `/*​/public` uçlarını çağırıyor
(asla DB'ye doğrudan bağlanmıyor, madde 2/3). Tailwind eklendi;
`tailwind.config.ts` renklerini `packages/config`'in design token'larından
alıyor (madde 24) — ikinci bir palet kopyası açmak yerine.

- `/` — özet: son yazılar, öne çıkan hizmet/proje/işler (her biri `getX(..., 3)`)
- `/blog`, `/blog/[slug]` — `typeKey=post`
- `/hizmetler`, `/hizmetler/[slug]` — kategori, özellikler, süreç, SSS, CTA
- `/projelerimiz`, `/projelerimiz/[slug]` — teknolojiler, problem/çözüm/sonuç, demo/repo linkleri
- `/yaptiklarimiz`, `/yaptiklarimiz/[slug]` — kategori, sonuç, bağlantılar
- Header/Footer `/menu/public` ve `/settings/general`'ı gerçekten çağırıyor
  (hard-coded nav yok) — `<title>` template'i de site adını kullanıyor.
- Her detay sayfası `generateMetadata` ile `seoTitle`/`seoDescription`/
  `canonicalUrl`/`noindex`'i gerçekten uyguluyor; yayınlanmamış/var olmayan
  slug → Next.js `notFound()` → gerçek 404.
- Master prompt'un genel public menüsündeki Haberler/İpuçları/SSS/Kütüphane/
  İstatistikler/İletişim sayfaları **bilinçli olarak yok** — bu content
  type'lar (news/tip/faq/library) ve istatistik/iletişim backend'i henüz
  kurulmadı; var olmayan bir şeyi render eden sayfa yazmak yerine, backend'i
  olan dört tür (post/project/service/work) için gerçek sayfalar yapıldı.

## Admin (apps/admin)

`apps/admin` — Auth, İçerik ve Medya yönetimi için temel bir yönetim
paneli. `apps/web` gibi hiçbir zaman DB'ye doğrudan bağlanmıyor, her şey
`lib/api.ts` üzerinden Core API'yi çağırıyor (madde 2/3).

- **Auth:** httpOnly cookie'lerde tutulan access/refresh token çifti
  (asla localStorage/client JS'e açık değil). `middleware.ts` her admin
  sayfasından önce çalışıp access token'ı kontrol ediyor; yoksa refresh
  token'la sessiz bir `POST /auth/refresh` deneyip cookie'leri yeniliyor,
  refresh de başarısızsa `/login`'e yönlendiriyor.
- **Layout/Dashboard:** `(admin)/layout.tsx` `GET /users/me`'yi çağırıp
  giriş yapmış kullanıcıyı ve izinlerini alıyor; Sidebar bu izinlere göre
  menü öğelerini gizliyor — **bu sadece UX**, gerçek güvenlik sınırı her
  zaman API'nin `PermissionsGuard`'ı (madde ~ RBAC fazı).
- **İçerik (`/icerik`):** `post` tipi içerikler için CRUD + workflow.
  Oluşturma/düzenleme formu (`ContentForm`) `useActionState` ile Server
  Action'lara bağlı; durum geçişleri (`canTransitionContent`,
  `@2blog/core-content-engine`'den import edilerek workflow grafiğinin
  admin tarafında tekrar yazılması önlendi) buton olarak render oluyor.
- **Medya (`/medya`):** dosya yükleme (`apiFetchForm`, multipart) ve
  silme; grid'de görsellerin gerçek önizlemesi, diğer türler için kind
  etiketi.
- **Kapsam dışı bırakılanlar (sonraki fazlar):** Projects/Services/Works
  admin UI, Users/Roles admin UI, Settings/Menü admin UI, dark mode —
  hepsi API tarafında zaten var, sadece admin arayüzü yazılmadı.

**Bulunan ve düzeltilen bug (test script'i, uygulama değil):** İçerik
oluşturma formunu Playwright ile uçtan uca test ederken, form submit
edildiğinde `createPostAction` hiç çalışmadan `/login`'e yönlendiği
görüldü. Kök neden araştırması (`Next-Action` header'ını ve action ID'yi
`server-reference-manifest.json`'da manuel çözerek) gösterdi ki: tıklanan
buton **content formunun değil, Topbar'daki çıkış yap formunun** submit
butonuydu — çünkü test script'i `button[type="submit"]` gibi sayfa
genelinde birden fazla eşleşen, spesifik olmayan bir selector kullanıyordu
ve Topbar (çıkış formu içeren) DOM'da content formundan önce render
oluyor. Playwright'ın generic selector'ı ilk eşleşeni (çıkış butonunu)
tıklıyordu — bu yüzden her "içerik oluştur" denemesi aslında kullanıcıyı
çıkış yaptırıyordu. Uygulama kodunda hiçbir değişiklik gerekmedi; düzeltme
test script'lerinin her forma özgü, benzersiz selector'lar kullanmasıydı
(ör. `form:has(#title) button[type="submit"]`, metne göre
`:has-text("Yayınla")`). Bu, birden fazla `<form>`/submit butonu render
eden layout'larda genel/generic selector kullanmanın tehlikesine dair
somut bir hatırlatma.

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
pnpm db:seed     # Core izinleri + SUPER_ADMIN rolü + (opsiyonel) ilk admin kullanıcı
```

## Production Deployment

VPS üzerinde Docker Compose + Caddy (bkz. `infrastructure/docker-compose.yml`,
`infrastructure/caddy/Caddyfile`). Next.js uygulamaları production mimarisinde
Vercel'e değil, aynı Compose ağındaki container'lara alınır — gerekçe
`docs/ARCHITECTURE.md` madde 19'da.

```bash
docker compose -f infrastructure/docker-compose.yml up -d --build
```
