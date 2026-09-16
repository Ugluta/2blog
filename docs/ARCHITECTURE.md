# CORE PLATFORM — Mimari Analiz (PHASE 0)

> **Durum:** Bu doküman, master prompt'un 37. maddesinde istenen "İLK GÖREV" çıktısıdır.
> Kural 1 gereği bu doküman onaylanmadan **PHASE 1 (Project Bootstrap)** dahil hiçbir kod
> yazılmamıştır. Aşağıdaki 20 madde, onay beklenen karar seti olarak sunulmuştur.

---

## 1. Kesin Teknoloji Stack Önerisi

| Katman | Seçim | Gerekçe |
|---|---|---|
| Monorepo | **Turborepo + pnpm workspaces** | Incremental build/cache, TS proje referansları, tek CI pipeline, `packages/*` paylaşımı |
| Dil | **TypeScript (strict mode, tüm katmanlarda)** | Uçtan uca tip güvenliği (DB → API → Web/Admin/Mobile) |
| Web | **Next.js 15 (App Router)** | SSR/SSG/ISR, React Server Components → düşük JS, native SEO (metadata API, sitemap, robots) |
| Admin | **Next.js 15, ayrı app (`apps/admin`)** | Web bundle'ını admin kodundan izole eder, farklı auth/CSP politikası uygulanabilir, aynı `packages/ui`'ı paylaşır |
| UI | **Tailwind CSS + Radix UI primitives** | Erişilebilirlik (ARIA/keyboard) hazır, headless component + tasarım token sistemi kurulabilir |
| API | **Fastify + TypeScript, ayrı servis (`apps/api`)** | Web/Admin/Mobile'ın ortak tükettiği tek backend; Next.js API routes'tan daha performanslı ve process olarak ayrıştırılabilir (ileride microservice'e bölünmeye uygun) |
| ORM | **Prisma** | Migration yönetimi, tip güvenli sorgular, şema tek kaynak — DB bölümünde N+1 önleme için `include`/`select` disiplini uygulanacak |
| Database | **PostgreSQL 16** | JSONB desteği, full-text search, güçlü constraint/transaction desteği, partition desteği (ileri seviye) |
| Cache/Queue backend | **Redis** | Session/rate-limit/cache + BullMQ için tek altyapı; sadece gerçekten fayda sağlayan yerlerde kullanılacak (bkz. madde 11) |
| Queue | **BullMQ** | Redis tabanlı, retry/backoff/idempotency desteği, Node ekosisteminde olgun |
| Arama | **PostgreSQL Full-Text Search (başlangıç)**, abstraction ile **Meilisearch**'e geçiş yolu | `packages/search` içinde `SearchProvider` interface'i — hacim arttığında sağlayıcı değişir, üst katman değişmez |
| Medya depolama | **S3 uyumlu object storage (Cloudflare R2 önerilir — maliyet)** | Egress maliyeti düşük, S3 API uyumlu, sunucu diskine bağımlılık yok |
| Mobile | **React Native + Expo** | Flutter yerine tercih: TypeScript/tip paylaşımı (`packages/types`, `packages/validation`) web/API ile aynı dilde olur, tek ekip aynı dili yazar, EAS Build ile düşük maliyetli CI/CD, native performans SEO gerektirmeyen alanlarda yeterli |
| Auth | **Özel oturum sistemi**: JWT access token (kısa ömürlü) + httpOnly refresh cookie, `packages/auth` | 3. parti bağımlılık yerine RBAC/izin modeliyle birebir entegre, tüm client'larda (web/admin/mobile) aynı akış |
| AI | Provider-agnostic `packages/ai` (OpenAI/Gemini/Ollama adapter) | Vendor lock-in yok, maliyet/performansa göre sağlayıcı değişebilir |
| Deployment | **Docker Compose (VPS)** veya Vercel (yalnızca `web`/`admin` için opsiyonel) + ayrı container'da `api`, `worker`, `postgres`, `redis` | Düşük maliyet + kontrol; Next.js app'leri istenirse Vercel'e taşınabilir çünkü stateless |
| CI/CD | **GitHub Actions** | lint → typecheck → test → build → (opsiyonel) security scan; build kırmızıysa deploy yok |

**Kriter karşılaştırması (özet gerekçe):** Next.js App Router SSR/SSG + RSC sayesinde SEO ve performans kriterlerini aynı anda karşılıyor; Fastify tabanlı ayrı API, "modüler monolith → gerektiğinde servis ayrıştırma" hedefine uyuyor (Next.js API routes bu ayrıştırmayı zorlaştırır); Prisma+PostgreSQL uzun vadeli bakım ve referential integrity için endüstri standardı; Redis'in her şeye değil sadece session/rate-limit/cache/queue'ya sınırlanması maliyeti düşük tutuyor.

---

## 2. Sistem Mimarisi

```
                         ┌─────────────────────────┐
                         │        CORE API         │
                         │   apps/api (Fastify)    │
                         │  - REST /api/v1/*        │
                         │  - RBAC middleware        │
                         │  - Validation (zod)        │
                         └────────────┬─────────────┘
                                      │
                 ┌────────────────────┼────────────────────┐
                 │                    │                    │
        ┌────────▼───────┐   ┌────────▼────────┐   ┌───────▼────────┐
        │   apps/web      │   │   apps/admin    │   │  apps/mobile   │
        │  Next.js (SSR)  │   │  Next.js (SPA-  │   │  Expo / RN     │
        │  Public content │   │  ish, authed)   │   │  Authed client │
        └─────────────────┘   └─────────────────┘   └────────────────┘
                 │                    │                    │
                 └────────────────────┴────────────────────┘
                                      │ (server-side, aynı süreç ağı)
                         ┌────────────▼─────────────┐
                         │  packages/database (Prisma)│
                         │  packages/auth             │
                         │  packages/content           │
                         │  packages/permissions        │
                         │  packages/media               │
                         │  packages/seo                  │
                         │  packages/ai                    │
                         │  packages/scraper                 │
                         │  packages/social                    │
                         │  packages/notifications              │
                         │  packages/validation, types, ui, config│
                         └────────────┬─────────────────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │   PostgreSQL   │   Redis   │
                         └───────────────────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │  apps/worker (BullMQ)     │
                         │  scraper / AI / social /  │
                         │  email / media processing │
                         └───────────────────────────┘
```

`apps/web` public sayfalarda **SSR/ISR sırasında doğrudan `packages/database` üzerinden okuma** yapar (network hop'u önlemek için — aynı monorepo/aynı sunucu ağı içinde). Mutasyonlar (form submit, admin işlemleri) ve mobile/3rd-party erişim **her zaman `apps/api` üzerinden** gider. Böylece "tek API tüm client'lar tarafından kullanılır" ilkesi korunurken, public sayfa render performansı da optimize edilir.

---

## 3. Web / Admin / API / Mobile İlişkisi

- **apps/api**: Tek gerçek kaynak (single source of truth) için iş mantığı, RBAC, validation, audit log. Tüm yazma işlemleri buradan geçer.
- **apps/web**: Public, SEO-first. Okuma ağırlıklı sayfalar server component içinde `packages/database`'den (repository katmanı üzerinden) veri çeker → cache edilir (madde 22). Form/mutasyon işlemleri (iletişim formu, üyelik) `apps/api`'a proxy edilir.
- **apps/admin**: Tamamen authed, `apps/api`'ı tüketen bir client. Kendi içinde iş mantığı bulundurmaz — sadece UI + API çağrıları.
- **apps/mobile**: Sadece `apps/api` üzerinden çalışır (DB'ye doğrudan erişimi yok). Aynı auth akışı (JWT + refresh) kullanılır.
- Ortak sözleşme: `packages/types` (DTO/response tipleri) + `packages/validation` (zod şemaları) — API, web, admin, mobile aynı tipleri import eder; tip kayması engellenir.

---

## 4. Database ER Diagram Mantığı (özet ilişkiler)

```
User ──< UserRole >── Role ──< RolePermission >── Permission
User ──< Session
User ──< AuditLog
User ──< Content (authorId)

Content (polymorphic ana tablo)
 ├─< ContentMeta (type-specific JSONB veya ayrı tablo)
 ├─< ContentCategory >── Category
 ├─< ContentTag >── Tag
 ├─< ContentMedia >── Media
 └─< ContentRevision (audit/versioning)

Project (Content.type=PROJECT'in genişletilmiş tablosu, 1:1 FK)
Service (ServiceCategory ──< Service ──< ServiceFAQ)
Work

Media ── owner:User
MediaVariant (thumbnail/webp/resized — 1:N)

ScraperSource ──< ScraperRule ──< CrawlJob ──< RawDataItem
RawDataItem ── contentHash (unique index) → duplicate detection
DataPoolItem (RAW→PROCESSED→...→PUBLISHED) ──> Content (published olduğunda)

AIRequest ── userId, provider, type, tokensUsed, resultRef
SocialAccount ──< SocialPost ──< SocialPostResult
Subscription ── Plan ──< PlanFeature
UsageRecord ── subscriptionId, metric, period, count

Page ──< PageBlock (ordered, type + JSON config)

AnalyticsEvent (append-only, partition-friendly: type, entityId, ts, meta)
```

**İlkeler:** Her tablo `id (uuid)`, `createdAt`, `updatedAt`; silinebilir varlıklarda `deletedAt` (soft delete); tüm FK'ler `ON DELETE RESTRICT` (kritik ilişkiler) veya `SET NULL` (opsiyonel ilişkiler) olarak açıkça tanımlanır — asla sessiz cascade yok. Yüksek hacimli tablolar (`AnalyticsEvent`, `RawDataItem`, `AuditLog`) ileride `createdAt` bazlı partition'a uygun tasarlanır.

---

## 5. Ana Tablolar (ilk migration kapsamı — Faz 2-3)

`users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `sessions`,
`contents`, `content_revisions`, `categories`, `tags`, `content_categories`, `content_tags`,
`media`, `media_variants`,
`projects`, `services`, `service_categories`, `works`,
`pages`, `page_blocks`,
`settings`,
`audit_logs`.

İleri fazlarda eklenecek: `scraper_sources`, `scraper_rules`, `raw_data_items`, `data_pool_items`,
`ai_requests`, `ai_prompts`, `social_accounts`, `social_posts`,
`plans`, `plan_features`, `subscriptions`, `usage_records`,
`analytics_events`, `notifications`.

---

## 6. Modül Bağımlılıkları

```
config, types, validation      → (bağımlılığı yok, temel katman)
database                       → types
auth                            → database, validation, types
permissions                      → database, auth
content                           → database, permissions, seo, media, validation
media                              → database, config
seo                                 → content, config
scraper                              → content (Data Pool aracılığıyla), media
ai                                    → content, media, permissions (limit kontrolü subscriptions'a bağlanır)
social                                  → content, media, ai (opsiyonel: AI destekli caption)
notifications                            → auth, queue
ui                                        → config (design tokens) — diğer paket bağımlılığı yok
```

Kural: `content`, `projects/services/works` gibi Blog'a özel domain paketleri **Core**'un generic `content` motorunu kullanır ama Core, Blog'a özel alan adlarını (`slug` şablonları vb.) bilmez — bu sayede Evrak/2e Music/Koli/Kurumsal aynı `packages/content`'i kendi tipleriyle genişletebilir (madde 38-39, kritik ilke).

---

## 7. Klasör ve Dosya Ağacı (ilk sprint sonrası hedef yapı)

```
2blog/
├── apps/
│   ├── web/                # Next.js public site
│   ├── admin/               # Next.js admin panel
│   ├── api/                  # Fastify REST API
│   ├── worker/                 # BullMQ worker process
│   └── mobile/                  # Expo React Native
│
├── packages/
│   ├── config/               # env şeması, design tokens, shared consts
│   ├── types/                  # paylaşılan TS tipleri / DTO'lar
│   ├── validation/               # zod şemaları
│   ├── database/                   # Prisma schema + repository katmanı
│   ├── auth/                         # session/JWT/RBAC çekirdeği
│   ├── permissions/                    # izin tanımları + kontrol yardımcıları
│   ├── content/                          # Content Engine (generic)
│   ├── seo/                                # metadata/schema.org/sitemap yardımcıları
│   ├── media/                                # upload/validate/variant üretimi
│   ├── ai/                                     # AIProvider abstraction
│   ├── scraper/                                  # crawler + data pool
│   ├── social/                                     # SocialProvider abstraction
│   ├── notifications/                                # in-app/email/push adapter
│   ├── search/                                         # SearchProvider abstraction
│   └── ui/                                               # Tailwind + component kütüphanesi
│
├── infrastructure/
│   ├── docker/                # Dockerfile'lar (api, worker, web, admin)
│   └── docker-compose.yml
│
├── scripts/                    # seed, migration yardımcıları
├── tests/                        # e2e (playwright) — birim testler paket içinde
├── docs/
│   └── ARCHITECTURE.md            # bu doküman
├── .env.example
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 8. API Endpoint Planı (v1, prefix: `/api/v1`)

```
/auth            POST /login, /register, /refresh, /logout
/users           CRUD + /users/:id/roles
/roles           CRUD
/permissions     GET (liste), roller ile ilişkilendirme /roles/:id/permissions
/content         GET (filtre: type,status,category), POST, PATCH /:id, DELETE /:id, POST /:id/publish
/posts /news /tips /faq /library   → /content?type=X üzerinden ince wrapper (duplicate route mantığı yok)
/projects        CRUD + durum geçişleri
/services        CRUD (kategori dahil)
/works           CRUD
/media           POST /upload, GET, DELETE /:id
/scraper         /sources CRUD, /rules CRUD, /jobs (POST tetikle, GET durum), /data-pool (liste/onay/red)
/ai              POST /generate/text, /generate/image, /generate/summary ... (asenkron olanlar job id döner)
/social          /accounts CRUD, /posts (schedule/queue), /posts/:id/status
/subscriptions   /plans, /subscriptions (mevcut kullanıcı), /usage
/pages           CRUD + /pages/:slug (public render için)
/settings        GET/PATCH (kategori bazlı: general, seo, social...)
/analytics       POST /event (public, hafif), GET /reports/* (admin)
```

**Standartlar:** Tüm response'lar `{ data, meta }` / hata `{ error: { code, message } }` zarfında; validation `packages/validation` (zod) ile merkezi; pagination cursor-bazlı (`?cursor=&limit=`), yüksek hacimli listelerde (content, analytics) zorunlu.

---

## 9. Authentication ve Authorization Mimarisi

- **Authn:** email+password (argon2id hash) → access JWT (15dk, `Authorization: Bearer`) + refresh token (httpOnly, secure, sameSite=strict cookie, 30 gün, rotasyonlu — her refresh'te eskisi geçersiz kılınır, `sessions` tablosunda tutulur → tekil oturum iptali/audit mümkün).
- **Authz:** RBAC + granular permission string'leri (`BLOG_PUBLISH`, `AI_IMAGE` vb.). Roller DB'de tanımlı (hard-coded değil), `packages/permissions` bir `hasPermission(user, permission)` yardımcı fonksiyonu sağlar; bu fonksiyon **hem API middleware'inde hem admin/web'de UI gizleme için** kullanılır — ama **yetki kararı her zaman API'de tekrar doğrulanır** (frontend gizleme asla tek başına güvenlik mekanizması değildir — Kural 11).
- Mobile aynı access/refresh akışını kullanır; refresh token secure storage'da (Expo SecureStore) tutulur (cookie yerine, çünkü native).
- Rate limiting + brute-force koruması login endpoint'inde Redis tabanlı sliding-window.

---

## 10. SEO Mimarisi

- Next.js `generateMetadata` her content/page/project/service route'unda zorunlu (title, description, canonical, OG, Twitter card).
- `packages/seo`: JSON-LD üretici fonksiyonlar (Article, FAQ, Organization, WebSite, BreadcrumbList, Service, Project schema).
- `sitemap.xml` dinamik üretim (içerik tablosundan, `publishedAt` ve `noindex` filtreli), `robots.txt` ayarlardan yönetilir.
- Her content/page kaydında `seoTitle`, `seoDescription`, `canonicalUrl`, `noindex` alanı — admin panelden yönetilir.
- Duplicate content önleme: canonical URL zorunlu, pagination sayfalarında `rel=prev/next` + canonical ana sayfaya değil kendi sayfasına.
- Semantic HTML + `next/image` ile otomatik `alt` zorunluluğu (media metadata'dan).

---

## 11. Cache Stratejisi

| Veri | Yöntem | TTL/Invalidation |
|---|---|---|
| Public content sayfaları | Next.js ISR (`revalidate`) + on-demand `revalidatePath` (publish/update sonrası webhook) | Yayın anında invalidate |
| Navigation/settings | Redis, kısa TTL + publish sonrası invalidate | 5-10dk TTL + event-based invalidation |
| Popüler içerik listeleri | Redis, `packages/database` repository katmanında cache-aside | 5dk TTL |
| Kullanıcıya özel veri (session, kullanıcı paneli) | **Cache'lenmez** (Kural: ortak cache'e karışmaz) | - |
| Rate limit sayaçları | Redis (kısa ömürlü key) | Window bazlı |

İlke: Redis yalnızca yukarıdaki somut senaryolarda kullanılır; "her şeyi Redis'e atma" kuralına uyulur.

---

## 12. Queue / Background Job Mimarisi

`apps/worker` (BullMQ + Redis) şu kuyruklara sahip: `scraper`, `ai-generation`, `media-processing`, `social-publish`, `email`, `import-export`.

- Her job **idempotent** tasarlanır: job payload'ında `idempotencyKey` (ör. scraper için content hash, AI için requestId) — aynı key ile ikinci çalıştırma no-op döner.
- Retry: exponential backoff, max deneme sayısı job tipine göre (scraper: 3, AI: 2, social: 5).
- Uzun süren tüm işlemler (scraper crawl, AI generation, video/image processing, social publish, email, bulk import/export) senkron HTTP request içinde **asla** çalıştırılmaz — API sadece job enqueue eder ve `jobId` döner, client polling/webhook ile sonucu alır.

---

## 13. Scraper Mimarisi

```
ScraperSource (domain, robots.txt cache, rate-limit config)
   → ScraperRule (selector/pattern, hedef content type)
   → CrawlJob (queue'da, cron ile tetiklenir)
   → RawDataItem (contentHash unique — duplicate detection burada başlar)
   → Normalization (ortak şemaya dönüştürme)
   → DataPoolItem: RAW_DATA → PROCESSED_DATA → (DUPLICATE|REJECTED|READY)
   → Editorial Review (admin panelde onay ekranı)
   → Publish (Content tablosuna yazılır, DataPoolItem.status=PUBLISHED)
```

Zorunlu teknik kontroller: `robots.txt` parse+cache (crawl öncesi kontrol), domain bazlı rate-limit (Redis token bucket), timeout+retry (job seviyesinde), her kaynağın `lastCheckedAt`/`lastHash`'i tutulur — hash değişmediyse yeni kayıt açılmaz, sadece `lastCheckedAt` güncellenir. Google/arama motoru için yalnızca resmi API'ler (ör. Custom Search API) kullanılır, agresif scraping yapılmaz.

---

## 14. AI Provider Mimarisi

```
packages/ai
 ├── AIProvider (interface: generateText, generateImage, generateAudio...)
 ├── providers/openai.ts
 ├── providers/gemini.ts
 ├── providers/ollama.ts
 └── PromptRegistry (merkezi, DB'de veya versiyonlu dosyada tutulan promptlar)
```

- API key'ler yalnızca `apps/api`/`apps/worker` ortamında (env/secret manager), frontend'e **asla** gönderilmez.
- Tüm AI çağrıları backend üzerinden, `ai_requests` tablosuna loglanır (tokensUsed, provider, userId, type) → `Subscription`/`UsageRecord` ile limit kontrolü (`packages/permissions` + plan feature check).
- AI çıktısı doğrudan `PUBLISHED` olamaz — content workflow'unda `RAW/DRAFT` statüsüyle girer, editoryal onay zorunlu.

---

## 15. Social Provider Mimarisi

```
packages/social
 ├── SocialProvider (interface: publish, schedule, getStatus)
 ├── providers/facebook.ts, instagram.ts, x.ts, linkedin.ts, youtube.ts
```

Akış: Content → SocialPost (platforma özel formatlama) → Queue (`social-publish`) → Provider.publish() → SocialPostResult (başarı/hata log). Platform token'ları DB'de **encrypted at rest** (AES-256-GCM, key `packages/config` üzerinden secret manager'dan) saklanır, hiçbir API response'unda ham token dönülmez.

---

## 16. Mobile Architecture

- Expo (managed workflow) + React Navigation; ana sekmeler: Ana Sayfa, İçerikler, Projeler, Hizmetler, Kütüphane, Favoriler, Bildirimler, Profil.
- Veri: `apps/api`'a REST çağrıları (aynı `packages/types`/`validation` tipleri kullanılır — API client kod üretimi `openapi`/zod'dan otomatik).
- Auth: access+refresh JWT, refresh token Expo SecureStore'da.
- Offline/cache: React Query + persist (yalnızca gerektiğinde — ör. favoriler, son görüntülenen içerikler).
- Push notification: altyapı `packages/notifications`'a `PUSH` adapter olarak eklenecek şekilde tasarlanır (Expo Push Notifications), ilk fazda pasif bırakılabilir.
- Mobile, web'in küçültülmüş kopyası değildir: kendi native UX'i (tab bar, native gesture, favoriler gibi mobile-first özellikler) vardır; public içerikler SEO için ayrıca web'de de yayınlanır (aynı API'den, farklı sunum).

---

## 17. Security Architecture

- **Authn/Authz:** madde 9.
- **Input validation:** her API endpoint'inde zod şeması zorunlu (request body/query/params).
- **Output encoding:** React otomatik escape + admin'de zengin metin (rich text) alanlarında sanitization (ör. `rehype-sanitize`) — stored XSS önleme.
- **SQLi:** Prisma parametrized query (ham SQL yasak, gerekiyorsa `Prisma.sql` tagged template).
- **SSRF:** Scraper ve AI görsel/URL işleme modüllerinde hedef URL allowlist/DNS-rebinding kontrolü, private IP range engeli.
- **Rate limiting & brute-force:** Redis token bucket, login/AI/scraper endpoint'lerinde.
- **Headers:** CSP (nonce-based), HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy — `apps/web`/`admin` middleware'inde merkezi.
- **CORS:** `apps/api`, yalnızca bilinen origin'lere (web, admin, mobile deep-link scheme) izin verir.
- **Secrets:** `.env` Git'e girmez, `.env.example` ile şablon; production'da secret manager (ör. Doppler/Vault veya hosting sağlayıcısının secret store'u).
- **Audit log:** madde 27'deki olaylar `audit_logs` tablosuna, hassas veri (şifre/token) hariç.
- **File upload:** MIME+uzantı çift doğrulama, boyut limiti, magic-byte kontrolü, filename sanitization (UUID ile yeniden adlandırma), antivirüs taraması (ClamAV, ileri faz).

---

## 18. Deployment Architecture

- **Development:** `docker-compose.yml` (postgres, redis, api, worker, web, admin) — tek komutla ayağa kalkar.
- **Staging/Production:** Aynı imajlar; `api`+`worker` bir VPS/container platformunda (ör. Hetzner/Fly.io), `postgres`+`redis` yönetilen servis ya da aynı ağda container; `web`/`admin` stateless olduğu için Vercel'e veya aynı VPS'e Docker ile alınabilir (maliyet tercihine göre).
- **CI/CD (GitHub Actions):** PR → lint+typecheck+unit test; main'e merge → build+integration test → (onaylı ortamlarda) deploy; build kırmızıysa deploy adımı çalışmaz.
- **Migration:** `prisma migrate deploy` deployment pipeline'ında ayrı, geri alınabilir adım (her migration için rollback script/plan dokümante edilir — Kural 18).
- **Environments:** development / test / staging / production, her biri ayrı `.env` + ayrı DB.

---

## 19. Development Roadmap

Master prompt madde 35'teki 20 fazı aynen benimsiyoruz (PHASE 0 → PHASE 20). Her faz, önceki fazın onaylı ve çalışır durumda olmasını önkoşul sayar (Kural 1: onaysız faz atlanmaz). Fazların çıktısı her seferinde bu dokümana (veya ayrı bir `docs/PHASE_LOG.md`'ye) not düşülerek ilerlenmesi önerilir.

---

## 20. İlk Sprint Dosya Listesi (PHASE 1 onayı verildiğinde oluşturulacaklar)

```
pnpm-workspace.yaml
turbo.json
package.json (root)
tsconfig.base.json
.env.example
.gitignore
infrastructure/docker-compose.yml
infrastructure/docker/api.Dockerfile
infrastructure/docker/worker.Dockerfile

packages/config/package.json, src/env.ts, src/tokens.ts
packages/types/package.json, src/index.ts
packages/validation/package.json, src/index.ts
packages/database/package.json, prisma/schema.prisma (User/Role/Permission ilk migration)

apps/api/package.json, src/server.ts, src/plugins/*, src/routes/health.ts
apps/web/package.json, next.config.ts, app/layout.tsx, app/page.tsx
apps/admin/package.json, next.config.ts, app/layout.tsx
apps/worker/package.json, src/index.ts

README.md (kurulum talimatları)
```

---

## Onay Bekleyen Karar Noktaları

1. API için **Fastify ayrı servis** mi, yoksa başlangıçta Next.js route handlers ile mi başlanmalı (daha hızlı MVP, sonra ayrıştırma)?
2. Mobile için **React Native + Expo** kararı onaylanıyor mu (Flutter alternatifine karşı)?
3. Medya depolama için **Cloudflare R2** mi tercih edilsin yoksa başka bir sağlayıcı mı (AWS S3, self-hosted MinIO)?
4. Deployment için **VPS + Docker Compose** mu yoksa **Vercel + managed DB/Redis** mi öncelikli olsun (maliyet vs. operasyonel kolaylık)?

Bu doküman onaylandıktan ve yukarıdaki karar noktaları netleştikten sonra **PHASE 1 (Project Bootstrap)**'e geçilecektir. Onay verilmeden herhangi bir uygulama kodu yazılmayacaktır (Kural 1, Madde 37).
