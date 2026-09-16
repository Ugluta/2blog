# CORE PLATFORM — Mimari Analiz (PHASE 0)

> **Durum:** PHASE 0 REVISION. Bu doküman, PHASE 0'da hazırlanan ilk analiz üzerine
> kesinleşen mimari kararların işlendiği güncel halidir. Kural 1 gereği bu revizyon
> kapsamında da **hiçbir kod, migration, dependency kurulumu veya PHASE 1 işlemi
> yapılmamıştır** — yalnızca bu doküman güncellenmiştir.

### Bu revizyonda değişenler (önceki analize göre)

| Konu | Önceki (PHASE 0 ilk taslak) | Şimdi (kesinleşti) |
|---|---|---|
| API framework | Fastify standalone | **NestJS** |
| ORM | Prisma | **Drizzle ORM** |
| Web'in veri okuma yolu | SSR sırasında `packages/database`'e doğrudan erişim | **Her zaman NestJS API üzerinden** (aşağıda madde 3) |
| Deployment | VPS/Docker **veya** Vercel (opsiyonel) | **Yalnızca VPS + Docker Compose + Caddy**, Vercel production'da yok |
| Medya depolama | Cloudflare R2 (doğrudan öneri) | **S3-compatible abstraction**, ilk deployment **MinIO** (self-hosted), R2/S3 ileride takılabilir |
| Content Engine | Blog türleri (Post/Project/Service...) örtük olarak Core içinde | **Type Registry** ile Core generic kalır; somut tipler domain modüllerinde kayıt olur |
| Scraper/Social | Tek paket (`packages/scraper`, `packages/social`) Core altında | **Core (generic infra) / Domain (uygulamaya özel kurallar) olarak ikiye ayrıldı** |
| Auth | JWT access + refresh cookie (rotasyon detayı yok) | **Rotasyon + reuse detection + hash'lenmiş refresh token** eklendi |
| RBAC | Tek düzey rol/izin | **Core RBAC (rol/izin) ile domain-özel profil alanları (örn. `teacherLevel`) ayrıştırıldı** |

---

## 1. Kesinleşmiş Teknoloji Stack

| Katman | Seçim | Not |
|---|---|---|
| Monorepo | **pnpm workspaces + Turborepo** | Değişmedi |
| Dil | **TypeScript strict, tüm katmanlarda** | Değişmedi |
| Web | **Next.js (App Router), Server Components öncelikli** | UI/SSR/SSG/SEO katmanı; business logic barındırmaz (madde 2) |
| Admin | **Next.js (App Router)** | Aynı ilke — sadece UI + API tüketimi |
| API | **NestJS (TypeScript)** — KESİN | Fastify standalone kullanılmayacak. HTTP adapter olarak Nest'in Fastify adapter'ı (`@nestjs/platform-fastify`) tercih edilebilir — bu yalnızca Nest'in altında hangi HTTP sunucusunun çalıştığıyla ilgili bir performans detayıdır, **uygulama mimarisi Nest'tir** (modül/controller/provider/guard/interceptor yapısı). Next.js API Routes/Route Handlers merkezi business logic için kullanılmaz. |
| Database | **PostgreSQL** | Tek source of truth |
| ORM | **Drizzle ORM** — KESİN | Prisma kullanılmayacak; repo içinde Prisma schema/client/migration/config bulunmayacak |
| Cache/Queue backend | **Redis** | Primary database olarak asla kullanılmaz |
| Queue | **BullMQ** | Tüm uzun süren işler için zorunlu |
| Arama | PostgreSQL full-text (başlangıç) → `SearchProvider` abstraction ile Meilisearch'e geçiş yolu | Değişmedi |
| Medya depolama | **S3-compatible storage abstraction**; ilk deployment **MinIO** (self-hosted, VPS içinde) | R2/AWS S3/başka provider ileride adapter değişimiyle takılır, business logic'e gömülmez |
| Mobile | **React Native + Expo** | Değişmedi |
| Auth | **Custom (NextAuth kullanılmaz)**: access+refresh JWT, rotation, reuse detection, Argon2id | Detay madde 9 |
| Reverse proxy / TLS | **Caddy** | Otomatik HTTPS, security header, routing |
| Deployment | **VPS + Docker Compose** — KESİN | Vercel production mimarisinin parçası değil (gerekçe: worker/BullMQ/scraper/AI/media/social gibi uzun süreli process'ler tek deployment modelinde yönetilmeli) |
| CI/CD | **GitHub Actions** | lint → typecheck → test → build → deploy; build kırmızıysa deploy yok |

---

## 2. Business Logic Kuralı (Next.js vs NestJS sınırı)

Bu, mimarinin en kritik kuralıdır ve tüm diğer kararları bağlar:

**Merkezi business logic yalnızca NestJS API/domain katmanında bulunur.**

Next.js (`apps/web`, `apps/admin`) yalnızca şunlar için kullanılır:
- UI render (Server/Client Components)
- SSR / SSG / ISR
- SEO (metadata, sitemap, JSON-LD render — *veri* NestJS'ten gelir, *render* Next.js'te olur)
- Gerekiyorsa ince bir BFF/consumer katmanı (ör. bir sayfanın birden fazla API çağrısını tek route handler'da toplayıp client'a tek response dönmek) — ama bu katman **karar vermez, sadece birleştirir/iletir**

Aşağıdaki mantık **hiçbir zaman** Next.js içine (route handler, server action, middleware) yazılmaz, yalnızca NestJS domain katmanında yaşar:

- Authentication business logic (şifre doğrulama, token üretimi/rotasyonu)
- Authorization / RBAC kararları
- Subscription / plan / usage-limit kuralları
- Content business logic (durum geçişleri, yayın kuralları, content type registry)
- AI job orchestration (provider seçimi, limit kontrolü, prompt yönetimi)
- Scraper orchestration (crawl planlama, duplicate/classification kararları)
- Social publishing kararları (hangi hesaba, ne zaman, hangi formatta)
- Payment/subscription kuralları
- Audit kuralları (neyin loglanacağına karar verme)

**Sonuç — madde 3'teki önceki karar düzeltildi:** PHASE 0'ın ilk taslağında "`apps/web` SSR sırasında `packages/database`'e doğrudan erişir" deniyordu; bu, business logic'in (yayın durumu filtreleme, izin kontrolü, content type çözümleme gibi kararların) Next.js tarafına sızmasına yol açacağından **çelişkilidir ve iptal edilmiştir**. Next.js her zaman NestJS API'nin **public/read endpoint'lerini** çağırır; performans, Next.js tarafında HTTP-cache/ISR (`fetch` + `revalidate`) ile sağlanır, veritabanına ikinci bir erişim yolu açılmaz. Bu aynı zamanda Evrak/2e Music/Koli/Kurumsal gibi gelecekteki uygulamaların da aynı deseni (kendi Next.js frontend'i → aynı Core API şablonu) tekrar edebilmesini garanti eder.

---

## 3. Web / Admin / API / Mobile İlişkisi

- **apps/api (NestJS)**: Tek gerçek kaynak. Tüm okuma **ve** yazma işlemleri, RBAC kontrolü, validation, audit log burada. Modüler yapı: `CoreModule` (Auth, Users, Rbac, Media, Notifications, Subscriptions, ContentEngine, Audit, Seo) + her uygulama için `DomainModule` (Blog için `BlogModule` → `PostModule`, `ProjectModule`, `ServiceModule`, `WorkModule`, `ScraperModule`, `SocialModule`).
- **apps/web**: Next.js, yalnızca NestJS API'yi tüketir (SSR sırasında `fetch(NEST_API_URL, { next: { revalidate } })`). Doğrudan DB bağlantısı yoktur.
- **apps/admin**: Tamamen authed, NestJS API client'ı. İş mantığı barındırmaz.
- **apps/mobile**: Sadece NestJS API üzerinden çalışır, aynı auth akışını (access+refresh JWT) kullanır.
- Ortak sözleşme: `packages/types` (NestJS DTO'larından türeyen response tipleri) + `packages/validation` (zod/class-validator şemaları) — dört client da aynı tipleri import eder.

---

## 4. Core Mimarisi — Blog'a Özel Olmayan Çekirdek

**En önemli gereksinim:** Core, Blog'a özel değildir. Blog, Core'u kullanan ilk referans uygulamadır; Evrak, 2e Music, Koli, Kurumsal aynı Core'u kendi domain modülleriyle genişletir.

```
                         CORE (packages/core-*, apps/api'nin CoreModule'ü)
        ┌───────────┬───────────┬───────────┬────────────┬───────────────┬─────────┐
        │   Auth    │   RBAC    │   Media   │Notifications│ Subscriptions │ Content │
        │           │(Users/    │           │             │               │ Engine  │
        │           │ Roles/    │           │             │               │(generic)│
        │           │ Perms)    │           │             │               │         │
        └───────────┴───────────┴───────────┴────────────┴───────────────┴─────────┘
                         + Shared: config, types, validation, logging, audit, seo primitives,
                                   database infra (Drizzle client + migration runner)
                                      │
          ┌───────────────────────────┼───────────────────────────┬───────────────┐
          │                           │                           │               │
   apps/api/blog/*            apps/api/evrak/*            apps/api/koli/*   apps/api/2e/*
   Post, News, Tip, FAQ,      Document, TeacherProfile     Company, Product,  Track, Album,
   Library, Project,          (teacherLevel vb. domain      Service            Playlist
   Service, Work,             attribute — Core Role'den
   Blog Scraper rules,        ayrı)
   Blog Social mapping
```

**İlke:** Core'un amacı uygulamaların domain mantığını kendi içine çekmek değildir; Core yalnızca *mekanizmayı* (generic content engine, RBAC çekirdeği, medya, bildirim, abonelik, queue/scraper/social altyapısı) sağlar. Domain kararları (hangi content type'lar var, hangi alanlar zorunlu, hangi kaynaklar taranacak, hangi profil alanları tutulacak) her zaman ilgili uygulamanın kendi modülünde kalır.

---

## 5. Content Engine — Type Registry Yaklaşımı

Önceki taslakta Content Engine, Post/Project/Service/Work gibi türleri örtük olarak biliyormuş gibi tasarlanmıştı; bu **Core'u Blog'a bağımlı kılacağından düzeltildi**.

```
CORE: ContentEngine
 ├── contents (generic tablo: id, typeKey, title, slug, excerpt, body, status,
 │             authorId, categoryId, coverMediaId, seo{...}, publishedAt, ...)
 ├── content_revisions
 ├── ContentTypeRegistry (interface):
 │      registerType({ key, label, schema (zod), workflow?, extensionTable? })
 └── Workflow: DRAFT → REVIEW → APPROVED → SCHEDULED → PUBLISHED → ARCHIVED
              (RAW/PROCESSING öncesi durumlar AI/Scraper akışında, madde 12/13)

DOMAIN (Blog örneği):
 BlogModule, uygulama başlarken ContentTypeRegistry'e şunları kaydeder:
   - "post"    → contents tablosu yeterli (extra alan yok)
   - "news"    → contents tablosu yeterli
   - "tip"     → contents tablosu yeterli
   - "faq"     → contents tablosu yeterli
   - "library" → contents tablosu yeterli
   - "project" → contents + project_details (problem, çözüm, teknolojiler,
                 demoUrl, repoUrl, müşteri, tarihler) — extension table, 1:1 FK
   - "service" → contents + service_details (özellikler, süreç, CTA)
   - "work"    → contents + work_details (kategori, sonuç, bağlantılar)
   - "page"    → contents + page_blocks (page builder, madde ayrı)

DOMAIN (Evrak örneği, gelecekte):
   - "document" → contents + document_details (dosya numarası, onay zinciri vb.)
   TeacherProfile (teacherLevel: UZMAN_OGRETMEN vb.) Core Role'den TAMAMEN AYRI bir
   domain tablosu — RBAC madde 6'da detaylı.

DOMAIN (Koli örneği, gelecekte):
   Company, Product, Service — Content Engine'e zorla sokulmaz; bunlar kendi
   domain tablolarıdır, yalnızca gerekiyorsa (ör. "haberlerimiz" gibi bir bölüm
   varsa) generic content type olarak da kayıt olabilirler.

DOMAIN (2e Music örneği, gelecekte):
   Track, Album, Playlist — kendi domain modülünde, Content Engine'i kullanmaz.
```

**Kural:** Her şey Content Engine'e zorla sokulmaz. Content Engine yalnızca "editoryal iş akışı olan, yayınlanabilir, SEO'lu içerik" kavramına uyan varlıklar için kullanılır. Saf domain varlıkları (Company, Track vb.) kendi tablolarında, kendi modülünde yönetilir ve gerektiğinde Core'un sadece medya/audit/notification gibi generic servislerini kullanır.

---

## 6. Database

- **PostgreSQL**, **Drizzle ORM** (schema-first, `drizzle-kit` migration).
- Şema, Core ve her domain için ayrı dosyalarda tutulur (`packages/core-database/schema/*.ts`, `apps/api/src/blog/**/schema.ts`) ama tek bir Postgres instance'ına migrate edilir (modüler monolith — madde 1 ilkesi).
- Repo içinde **Prisma'ya ait hiçbir dosya (schema.prisma, prisma client, prisma migration klasörü, prisma dependency) bulunmayacaktır.**
- Redis hiçbir zaman kalıcı/birincil veri kaynağı olarak kullanılmaz — yalnızca cache/rate-limit/queue/geçici state.

### ER Diagram Mantığı (özet)

```
User ──< UserRole >── Role ──< RolePermission >── Permission
User ──< Session (refresh token family/rotation kayıtları — madde 9)
User ──< AuditLog
User ──< Content (authorId)

Content (generic, typeKey ile ayrışır)
 ├─< ContentRevision
 ├─< ContentCategory >── Category
 ├─< ContentTag >── Tag
 ├─< ContentMedia >── Media
 └─  project_details / service_details / work_details (typeKey'e göre 1:1 extension)

Media (metadata) ── owner:User, storageKey (MinIO/S3), hash, mimeType, size
MediaVariant (thumbnail/webp/resized) — 1:N

ScraperSource ──< ScraperRule ──< CrawlJob ──< RawDataItem (contentHash unique)
DataPoolItem: RAW → PROCESSED → (DUPLICATE|REJECTED|READY) → PUBLISHED → Content

AIRequest ── userId, provider, type, tokensUsed, resultRef
SocialAccount ──< SocialPost ──< SocialPostResult
Plan ──< PlanFeature; Subscription ── Plan; UsageRecord ── subscriptionId, metric, period

Page ──< PageBlock (ordered, type + JSON config)
AnalyticsEvent (append-only, partition-friendly)
```

**İlkeler:** Her tablo `id (uuid)`, `createdAt`, `updatedAt`; silinebilir varlıklarda `deletedAt`; FK'ler açıkça `RESTRICT`/`SET NULL`, sessiz cascade yok. Yüksek hacimli tablolar (`AnalyticsEvent`, `RawDataItem`, `AuditLog`) ileride partition'a uygun tasarlanır.

### Ana Tablolar (Core — ilk migration kapsamı, Faz 2-3)

`users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `sessions` (refresh token hash/family),
`contents`, `content_revisions`, `categories`, `tags`, `content_categories`, `content_tags`,
`media`, `media_variants`, `pages`, `page_blocks`, `settings`, `audit_logs`,
`plans`, `plan_features`, `subscriptions`, `usage_records`, `notifications`.

### Domain Tabloları (Blog — Faz 7-8)

`project_details`, `service_details`, `service_categories`, `work_details`,
`scraper_sources`, `scraper_rules`, `raw_data_items`, `data_pool_items`,
`ai_requests`, `ai_prompts`, `social_accounts`, `social_posts`.

---

## 7. Cache / Queue

- **Redis** kullanım alanları: cache (public sayfa/nav/settings), rate limiting, geçici state (ör. login attempt sayacı), BullMQ backend, job coordination. **Primary database değildir.**
- **BullMQ** kuyrukları: `ai-generation`, `scraper`, `media-processing`, `ocr` (ileride Evrak için), `video-processing`, `social-publish`, `email`, `notifications`, `import-export`.
- Uzun süren hiçbir işlem HTTP request içinde çalıştırılmaz; NestJS controller job'u enqueue eder, `jobId` döner.
- Her job tasarımında zorunlu: **retry** (exponential backoff, tip bazlı max deneme), **idempotency** (`idempotencyKey`, aynı key ikinci kez no-op), **dead-letter/error handling** (BullMQ'nun failed job listesi + alerting), **job status** (client'ın sorgulayabileceği durum endpoint'i), **logging** (job başlangıç/bitiş/hata, `audit_logs`'a değil ayrı `job_logs`'a).

---

## 8. Authentication (Custom — NextAuth kullanılmaz)

- **Şifre:** Argon2id hash.
- **Access token:** kısa ömürlü (örn. 10-15dk) JWT, `Authorization: Bearer`.
- **Refresh token:** uzun ömürlü, rotasyonlu. **Ham refresh token veritabanında tutulmaz** — yalnızca token'ın hash'i (SHA-256) + bir `family id` `sessions` tablosunda saklanır.
- **Refresh Token Rotation:** her refresh çağrısında eski token geçersiz kılınır, yeni token + yeni hash kaydedilir; aynı `family id` korunur.
- **Refresh Token Reuse Detection:** zaten geçersiz kılınmış (rotasyona uğramış) bir refresh token tekrar kullanılmaya çalışılırsa, bu token'ın ait olduğu **tüm family** (yani o oturum zinciri) anında iptal edilir — token çalınması senaryosuna karşı koruma.
- **Session Revocation:** kullanıcı/admin tekil oturumu veya tüm oturumları `sessions` tablosu üzerinden iptal edebilir (audit log'a yazılır).
- Bu akış **web ve mobile tarafından ortak** kullanılır: web'de refresh token httpOnly+secure+sameSite=strict cookie'de, mobile'da Expo SecureStore'da tutulur; her iki client da aynı NestJS `AuthModule` endpoint'lerini (`/auth/login`, `/auth/refresh`, `/auth/logout`) çağırır.
- Rate limiting + brute-force koruması: Redis tabanlı sliding-window, `/auth/login` üzerinde.

---

## 9. RBAC — Core Authorization ile Domain Profillerinin Ayrımı

Core RBAC yalnızca şu generic modeli bilir: `User`, `Role`, `Permission`, `RolePermission`, `UserRole`, ve resource/action bazlı yetki kontrolü (`hasPermission(user, "BLOG_PUBLISH")`, `hasPermission(user, "PROJECT_EDIT")` vb.).

**Domain'e özel profil/nitelik alanları Core Role modeline karıştırılmaz.** Örnek (Evrak):

```
role = "EDITOR"                         ← Core RBAC (yetki: ne yapabilir)
teacherLevel = "UZMAN_OGRETMEN"          ← Evrak domain'inin kendi profil tablosu
                                            (evrak_teacher_profiles.userId FK)
```

Bu ikisi **farklı kavramlardır ve farklı tablolardadır**: `role`, kullanıcının sistemde hangi işlemleri yapabileceğini (yetki) belirler; `teacherLevel` gibi alanlar tamamen domain'in kendi iş kuralına ait bir sınıflandırma/profil bilgisidir ve Core'un bundan haberi yoktur. Her domain modülü, kendi profil tablosunu `users.id`'ye FK ile bağlayarak genişletir; Core RBAC şeması bu yüzden hiçbir zaman domain'e özel enum/alan içermez.

Yetki kontrolü hem NestJS guard/interceptor seviyesinde (zorunlu, gerçek güvenlik sınırı) hem de web/admin/mobile'da UI gizleme amacıyla (yalnızca UX, güvenlik değil) uygulanır — frontend gizleme hiçbir zaman tek başına yetki mekanizması sayılmaz.

---

## 10. Scraper Mimarisi — Core / Domain Ayrımı

Önceki taslakta scraper tek bir Core paketi olarak tasarlanmıştı; bu, uygulamaya özel tarama mantığının Core'a gömülmesine yol açacağından **ayrıştırıldı**:

```
CORE (packages/core-scraper-kit)
 ├── Queue entegrasyonu (BullMQ job tanımları)
 ├── HTTP client (timeout, retry, user-agent yönetimi)
 ├── Scheduling (cron tetikleme altyapısı)
 ├── Parsing abstraction (HTML/JSON parser arayüzü)
 ├── Rate limiting (domain bazlı token bucket, Redis)
 └── Data normalization altyapısı (ortak hash/dedup yardımcıları)

DOMAIN (apps/api/src/blog/scraper)
 ├── Hedef site tanımları (ScraperSource kayıtları)
 ├── Extraction rules (selector/pattern — Blog'a özel)
 ├── Classification (hangi content type'a düşecek)
 └── Publication rules (Data Pool → Content Engine'e ne zaman/nasıl aktarılacağı)
```

**Scraper hiçbir durumda doğrudan yayın yapmaz.** Akış değişmedi, teyit edildi:

```
SOURCE → CRAWL → RAW DATA → EXTRACTION → NORMALIZATION → CLASSIFICATION
       → DUPLICATE CHECK → REVIEW → APPROVAL → PUBLISH
```

`robots.txt` kontrolü ve rate limiting Core seviyesinde zorunlu ve tüm domain'ler için ortaktır (Evrak veya Koli de kendi scraper'ını yazarken aynı Core kit'i kullanır, tekrar yazmaz). Google/arama motoru için yalnızca resmi API'ler kullanılır.

---

## 11. Social Media Mimarisi — Core / Domain Ayrımı

```
CORE (packages/core-social-kit)
 ├── SocialAccount (provider, token — encrypted at rest)
 ├── SocialProvider interface (publish, schedule, getStatus)
 ├── providers/facebook.ts, instagram.ts, x.ts, linkedin.ts, youtube.ts
 ├── SocialPost (generic: platform, payload, scheduledAt, status)
 └── Retry/error handling (queue: social-publish)

DOMAIN (örnek: Blog)
 └── "Content → SocialPost" dönüştürücü (Article'dan caption/görsel çıkarma)

DOMAIN (örnek: Koli, gelecekte)
 └── "Company → SocialPost" dönüştürücü (aynı Core publishing altyapısını kullanır)
```

Platform token'ları DB'de AES-256-GCM ile encrypted saklanır, API response'unda asla ham token dönülmez. Dönüştürme mantığı (hangi alan caption olacak, hangi görsel seçilecek) her zaman domain tarafında kalır — Core, "bir SocialPost'u nasıl yayınlarım" sorusuna cevap verir, "bu içerikten SocialPost nasıl üretilir" sorusuna değil.

---

## 12. AI Provider Mimarisi

```
packages/core-ai
 ├── AIProvider (interface: generateText, generateImage, generateAudio...)
 ├── providers/openai.ts, gemini.ts, ollama.ts
 └── PromptRegistry (merkezi, versiyonlu promptlar)
```

- API key'ler yalnızca NestJS API/worker ortamında; frontend'e asla gönderilmez.
- Tüm çağrılar `ai_requests`'e loglanır; `Subscription`/`UsageRecord` ile limit kontrolü Core RBAC/subscription modülü üzerinden yapılır.
- AI çıktısı doğrudan `PUBLISHED` olamaz — Content Engine workflow'una `DRAFT`/`REVIEW` durumuyla girer.
- Ağır işlemler (görsel/video/ses üretimi) BullMQ üzerinden asenkron çalışır (madde 7).

---

## 13. Media

- Dosya binary'leri **PostgreSQL'de tutulmaz**. DB yalnızca metadata tutar: `id`, `storageKey`, `mimeType`, `size`, `hash`, `metadata (jsonb)`, `owner`, `createdAt`.
- Storage, **S3-compatible abstraction** (`packages/core-media` içinde `StorageProvider` interface) üzerinden çalışır.
- İlk deployment: **MinIO** (VPS içinde, Docker Compose servisi). İleride Cloudflare R2/AWS S3/başka bir S3-compatible provider'a adapter değişimiyle geçilebilir — storage provider seçimi hiçbir zaman business logic'e gömülmez, her zaman interface arkasındadır.
- Upload güvenliği: MIME+uzantı çift doğrulama, magic-byte kontrolü, boyut limiti, filename sanitization (UUID ile yeniden adlandırma).

---

## 14. Klasör ve Dosya Ağacı (güncel hedef yapı)

```
2blog/
├── apps/
│   ├── web/                      # Next.js public site (yalnızca UI/SSR/SEO)
│   ├── admin/                     # Next.js admin panel (yalnızca UI + API tüketimi)
│   ├── api/                        # NestJS — Core + Domain modülleri
│   │   └── src/
│   │       ├── core/               # AuthModule, UsersModule, RbacModule, MediaModule,
│   │       │                       # NotificationsModule, SubscriptionsModule,
│   │       │                       # ContentEngineModule, AuditModule, SeoModule
│   │       └── blog/                # PostModule, ProjectModule, ServiceModule, WorkModule,
│   │                                 # ScraperModule (domain), SocialModule (domain)
│   ├── worker/                       # BullMQ worker process (ayrı Node process, Nest context paylaşır)
│   └── mobile/                         # Expo React Native
│
├── packages/
│   ├── config/                   # env şeması, design tokens, shared consts
│   ├── types/                      # paylaşılan TS tipleri / DTO'lar
│   ├── validation/                   # zod şemaları
│   ├── core-database/                  # Drizzle schema (core) + migration + client
│   ├── core-auth/                        # JWT/rotation/reuse-detection çekirdeği
│   ├── core-rbac/                          # Role/Permission modeli + hasPermission()
│   ├── core-content-engine/                  # generic content tablosu + type registry
│   ├── core-media/                             # StorageProvider abstraction (MinIO/S3)
│   ├── core-ai/                                  # AIProvider abstraction
│   ├── core-scraper-kit/                           # queue/http/scheduling/parsing altyapısı
│   ├── core-social-kit/                              # SocialProvider abstraction
│   ├── core-notifications/                             # in-app/email/push adapter
│   ├── core-seo/                                         # JSON-LD/metadata yardımcıları
│   ├── search/                                             # SearchProvider abstraction
│   └── ui/                                                   # Tailwind + component kütüphanesi
│
├── infrastructure/
│   ├── docker/                   # Dockerfile'lar (api, worker, web, admin)
│   ├── caddy/                      # Caddyfile (reverse proxy, TLS, security headers)
│   └── docker-compose.yml            # postgres, redis, minio, api, worker, web, admin, caddy
│
├── scripts/                        # seed, migration yardımcı script'leri
├── tests/                            # e2e (playwright) — birim testler paket içinde
├── docs/
│   └── ARCHITECTURE.md                # bu doküman
├── .env.example
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

Domain klasörlerinin (`apps/api/src/blog/*`) Core'dan (`apps/api/src/core/*`, `packages/core-*`) net biçimde ayrılması, Evrak/2e Music/Koli/Kurumsal için gelecekte `apps/api/src/evrak`, `apps/api/src/koli` gibi kardeş klasörlerin aynı Core'u bozmadan eklenebilmesini garanti eder.

---

## 15. API Endpoint Planı (v1, prefix: `/api/v1`)

```
/auth            POST /login, /refresh, /logout
/users           CRUD + /users/:id/roles
/roles           CRUD
/permissions     GET, /roles/:id/permissions
/content         GET (filtre: typeKey,status,category), POST, PATCH /:id, DELETE /:id, POST /:id/publish
/projects /services /works   → domain-özel alanlarla content'i genişleten ince controller'lar
/media           POST /upload, GET, DELETE /:id
/scraper         /sources, /rules, /jobs, /data-pool (liste/onay/red)   [blog domain]
/ai              POST /generate/text|image|summary... (asenkron → jobId)
/social          /accounts, /posts (schedule/queue), /posts/:id/status   [blog domain]
/subscriptions   /plans, /subscriptions, /usage
/pages           CRUD + /pages/:slug
/settings        GET/PATCH (kategori bazlı)
/analytics       POST /event (public), GET /reports/* (admin)
```

Standartlar: `{ data, meta }` / `{ error: { code, message } }` zarfı; validation NestJS `ValidationPipe` + zod/class-validator; cursor-bazlı pagination (yüksek hacimli listelerde zorunlu).

---

## 16. SEO Mimarisi

- Veri NestJS'ten (`/content`, `/pages` vb.), render Next.js'te (`generateMetadata`, JSON-LD component'leri `packages/core-seo`'daki üretici fonksiyonları kullanır).
- `sitemap.xml`/`robots.txt` Next.js'te, veri kaynağı NestJS API.
- Her content/page kaydında `seoTitle`, `seoDescription`, `canonicalUrl`, `noindex` — admin panelden yönetilir.
- Duplicate content önleme: canonical zorunlu, pagination'da `rel=prev/next`.

---

## 17. Cache Stratejisi

| Veri | Yöntem | Not |
|---|---|---|
| Public content sayfaları | Next.js `fetch` cache + ISR (`revalidate`) | NestJS API'den, on-demand revalidate publish webhook'uyla tetiklenir |
| Nav/settings | Redis, kısa TTL + event-based invalidation | NestJS tarafında cache-aside |
| Popüler içerik listeleri | Redis, cache-aside (NestJS servis katmanı) | 5dk TTL |
| Kullanıcıya özel veri | Cache'lenmez | Ortak cache'e asla karışmaz |
| Rate limit sayaçları | Redis | Window bazlı |

---

## 18. Security Architecture

- Authn/Authz: madde 8-9.
- Input validation: NestJS `ValidationPipe` + DTO şemaları, tüm endpoint'lerde zorunlu.
- Output encoding: React otomatik escape + admin rich-text alanlarında sanitization.
- SQLi: Drizzle parametrized query (ham SQL yasak, gerekiyorsa `sql` tagged template ile parametrize).
- SSRF: Scraper/AI URL işleme modüllerinde allowlist + private IP range engeli (Core scraper-kit seviyesinde, tüm domain'ler için ortak).
- Rate limiting & brute-force: Redis token bucket (`/auth/login`, AI, scraper endpoint'lerinde).
- Headers: CSP (nonce-based), HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy — Caddy + Next.js middleware'de.
- CORS: NestJS'te yalnızca bilinen origin'lere (web, admin, mobile deep-link) izin verilir.
- Secrets: `.env` Git'e girmez, production'da secret manager; hiçbir secret frontend bundle'ına yazılmaz.
- Audit log: madde 27 (master prompt) kapsamındaki olaylar, hassas veri hariç.
- File upload: MIME+uzantı+magic-byte doğrulama, boyut limiti, filename sanitization.

---

## 19. Deployment Architecture (KESİN)

```
VPS (tek sunucu, Docker Compose ile orkestre)
 ├── Caddy            → reverse proxy, otomatik HTTPS/TLS, security headers, routing
 │     ├── web.domain.com     → apps/web
 │     ├── admin.domain.com   → apps/admin
 │     └── api.domain.com     → apps/api (NestJS)
 ├── apps/api (NestJS)
 ├── apps/worker (BullMQ worker)
 ├── apps/web (Next.js, Node runtime)
 ├── apps/admin (Next.js, Node runtime)
 ├── PostgreSQL
 ├── Redis
 └── MinIO (S3-compatible object storage)
```

- Vercel production mimarisinin bir parçası **değildir** — gerekçe: worker/BullMQ/scraper/AI job/media processing/social publishing gibi uzun süreli, stateful process'ler tek bir deployment modeli içinde (aynı Docker Compose ağı) yönetilmelidir; Next.js app'lerini ayrı bir platforma (Vercel) taşımak bu bütünlüğü bozar ve iki ayrı deployment/ortam yönetimine yol açar.
- **Development:** aynı `docker-compose.yml` yerelde çalışır (postgres, redis, minio, api, worker, web, admin, caddy) — tek komutla ayağa kalkar.
- **CI/CD (GitHub Actions):** PR → lint+typecheck+unit test; main'e merge → build+integration test → deploy (build kırmızıysa deploy yok).
- **Migration:** `drizzle-kit` migration'ları deployment pipeline'ında ayrı, geri alınabilir bir adım; her migration için rollback planı dokümante edilir.
- **Environments:** development / test / staging / production, her biri ayrı `.env` + ayrı DB.

---

## 20. Development Roadmap

Master prompt madde 35'teki 20 faz korunuyor (PHASE 0 → PHASE 20). Bu revizyon **PHASE 0 içinde bir alt adımdır** (PHASE 0 REVISION); PHASE 1 (Project Bootstrap) için ayrı onay gereklidir (Kural 1). Fazların çıktısı bu dokümana veya ayrı bir `docs/PHASE_LOG.md`'ye not düşülerek ilerlenmesi önerilir.

### İlk Sprint Dosya Listesi (yalnızca PHASE 1 onayı verildiğinde oluşturulacak — şu an oluşturulmamıştır)

```
pnpm-workspace.yaml, turbo.json, package.json (root), tsconfig.base.json
.env.example, .gitignore
infrastructure/docker-compose.yml, infrastructure/caddy/Caddyfile
infrastructure/docker/{api,worker,web,admin}.Dockerfile

packages/config, packages/types, packages/validation
packages/core-database (Drizzle schema: users/roles/permissions + drizzle-kit config)

apps/api (NestJS: AppModule, CoreModule iskeleti, health endpoint)
apps/web, apps/admin (Next.js App Router iskeleti)
apps/worker (BullMQ worker iskeleti)

README.md
```

---

## Sonuç

Bu revizyonla birlikte önceki analizdeki **Fastify → NestJS**, **Prisma → Drizzle**, **web'in DB'ye doğrudan erişimi → her zaman API üzerinden erişim**, **Vercel opsiyonu → yalnızca VPS/Docker/Caddy**, **Content Engine'in Blog'a örtük bağımlılığı → type registry ile generic hale getirilmesi**, ve **scraper/social'ın Core'a tek parça gömülmesi → Core/Domain ayrımı** çelişkileri giderilmiştir. Core artık Blog'dan bağımsız, Evrak/2e Music/Koli/Kurumsal tarafından yeniden kullanılabilecek şekilde tanımlanmıştır.

Kod yazılmamış, migration oluşturulmamış, dependency kurulmamış, PHASE 1'e başlanmamış, commit/push/PR yapılmamıştır. Onay verildiğinde PHASE 1 (Project Bootstrap) ile devam edilecektir.
