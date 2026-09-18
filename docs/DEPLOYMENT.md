# Deployment (VPS + Docker Compose + GitHub Actions)

Bu doküman, `docs/ARCHITECTURE.md` madde 19'un öngördüğü dağıtım şeklinin
(VPS + Docker Compose + Caddy, Vercel değil) adım adım uygulanışı. Şu an
**domain yok, yalnızca VPS IP'si üzerinden** çalışacak şekilde kuruluyor
(`infrastructure/caddy/Caddyfile` IP-only mod'da — bkz. altta "Domain
eklendiğinde").

CI/CD: her push, GitHub Actions üzerinden VPS'e SSH ile bağlanıp
`docker compose build` + `up -d` çalıştırıyor (`.github/workflows/deploy.yml`).
Container registry yok — image'lar VPS'in kendisinde build ediliyor, tıpkı
bir geliştiricinin elle `docker compose up -d --build` çalıştırması gibi.

## 1) VPS ön hazırlık (bir kere, elle SSH ile)

Gereksinimler: Ubuntu 22.04+, en az 2GB RAM, kök (root) erişimi.

```bash
ssh root@<VPS_IP>

# Docker + Compose plugin kur
curl -fsSL https://get.docker.com | sh

# root olmayan bir deploy kullanıcısı oluştur, docker grubuna ekle
adduser deploy
usermod -aG docker deploy

# Firewall — yalnızca SSH + Caddy'nin dinlediği 3 port açık
apt install -y ufw
ufw allow OpenSSH
ufw allow 80/tcp    # web
ufw allow 8080/tcp  # api
ufw allow 8081/tcp  # admin
ufw enable
```

`postgres`/`redis`/`minio` için firewall kuralı **gerekmiyor** —
`infrastructure/docker-compose.yml`'de bu servislerin portları
`127.0.0.1:...` şeklinde yalnızca loopback'e bağlı, dışarıdan zaten
erişilemezler (madde: VPS'te DB'yi internete açık bırakmamak).

## 2) CI'nin bağlanacağı SSH anahtarını oluştur

Bu, GitHub Actions'ın deploy için kullanacağı **ayrı** bir anahtar —
kendi kişisel SSH anahtarınız değil.

```bash
# kendi makinenizde (VPS'te değil)
ssh-keygen -t ed25519 -f ./deploy_key -N "" -C "github-actions-2blog"

# public key'i VPS'teki deploy kullanıcısına ekleyin
ssh-copy-id -i ./deploy_key.pub deploy@<VPS_IP>
# (ssh-copy-id yoksa: cat deploy_key.pub | ssh root@<VPS_IP> "mkdir -p ~deploy/.ssh && cat >> ~deploy/.ssh/authorized_keys -")

# bağlantıyı doğrulayın
ssh -i ./deploy_key deploy@<VPS_IP> "echo ok"
```

`deploy_key` (private key) dosyasının içeriği birazdan GitHub Secret'ı
olarak eklenecek — kimseyle paylaşmayın, repoya commit etmeyin.

## 3) Repoyu VPS'e klonla + `.env` oluştur

```bash
ssh deploy@<VPS_IP>
git clone https://github.com/Ugluta/2blog.git ~/2blog
cd ~/2blog

cp infrastructure/.env.production.example .env
nano .env   # her <...> yer tutucusunu gerçek değerle doldurun
```

Secret üretmek için:

```bash
openssl rand -hex 32   # JWT_ACCESS_SECRET / JWT_REFRESH_SECRET için (ayrı ayrı iki kere)
openssl rand -hex 24   # POSTGRES_PASSWORD / STORAGE_SECRET_KEY için
```

`NEXT_PUBLIC_SITE_URL=http://<VPS_IP>`, `CORS_ORIGINS=http://<VPS_IP>,http://<VPS_IP>:8081`
— `<VPS_IP>` yerine gerçek IP'yi yazın. `infrastructure/.env.production.example`
her alanın ne anlama geldiğini ve hangi ikisinin birbiriyle senkron
kalması gerektiğini (örn. `POSTGRES_PASSWORD` ↔ `DATABASE_URL`) yorum
olarak açıklıyor.

## 4) İlk manuel deploy (pipeline'dan önce, tek sefer)

```bash
cd ~/2blog
docker compose --env-file .env -f infrastructure/docker-compose.yml build
docker compose --env-file .env -f infrastructure/docker-compose.yml up -d
docker compose --env-file .env -f infrastructure/docker-compose.yml exec -T api pnpm --filter @2blog/core-database migrate
docker compose --env-file .env -f infrastructure/docker-compose.yml exec -T api pnpm --filter @2blog/core-database seed
```

**Neden `--env-file .env`:** `-f infrastructure/docker-compose.yml` ile
çağrıldığında Compose'un proje dizini `infrastructure/` oluyor (compose
dosyasının kendi klasörü) — `.env`'i orada arıyor, repo kökünde değil,
`POSTGRES_PASSWORD`/`STORAGE_ACCESS_KEY`/`NEXT_PUBLIC_SITE_URL` gibi
zorunlu değişkenleri bulamayıp hata veriyor. `.github/workflows/
deploy.yml`'nin bu hatayı almamasının sebebi `docker compose`'dan önce
`source .env` ile tüm değişkenleri shell'e export etmesi — Compose,
shell'in kendi ortam değişkenlerini de kontrol ediyor. Elle
çalıştırılan komutlarda en basit çözüm `--env-file .env`.

Seed, `.env`'deki `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` ile ilk
SUPER_ADMIN kullanıcısını oluşturur (idempotent — tekrar çalıştırmak
zararsız). Doğrulama:

```bash
curl http://localhost:8080/api/v1/health   # {"data":{"status":"ok",...}}
```

Tarayıcıdan: `http://<VPS_IP>` (web), `http://<VPS_IP>:8081` (admin, seed'lenen
admin ile giriş).

## 5) GitHub Actions Secrets/Variables ekle

Repo → Settings → Secrets and variables → Actions:

| Tip | Ad | Değer |
|---|---|---|
| Secret | `DEPLOY_HOST` | VPS IP'si |
| Secret | `DEPLOY_USER` | `deploy` |
| Secret | `DEPLOY_SSH_KEY` | adım 2'deki `deploy_key` dosyasının **tüm içeriği** |
| Secret | `DEPLOY_PORT` | (opsiyonel, SSH portu 22 değilse) |
| Variable | `DEPLOY_PATH` | (opsiyonel, repo VPS'te `~/2blog` değilse) |

Uygulama secret'ları (`JWT_*`, `POSTGRES_PASSWORD`, ...) GitHub'a hiç
eklenmiyor — onlar yalnızca VPS'teki `.env` dosyasında yaşıyor, pipeline
sadece VPS'e SSH ile bağlanıp orada zaten var olan `.env`'i kullanıyor.

## 6) Pipeline'ı çalıştır

Secret'lar eklendikten sonra ilk deploy'u tetiklemek için: GitHub → Actions
→ "Deploy" workflow'u → "Run workflow" (`workflow_dispatch`). Sonraki her
`git push` bu branch'e otomatik olarak aynı pipeline'ı tetikler
(`.github/workflows/deploy.yml`).

Pipeline iki job'lı: önce `verify` (`pnpm -r typecheck` — hata varsa
pipeline burada durur, VPS'e hiç dokunulmaz), sonra `deploy` (yalnızca
`verify` geçerse çalışır): VPS'e SSH ile bağlan → `git reset --hard` ile
son commit'e geç → `docker compose build && up -d` → migration'ları
uygula → `/api/v1/health`'i dışarıdan curl'le doğrula.

**Not:** `seed` pipeline'da otomatik çalışmıyor (yalnızca ilk kurulumda
gerekli, adım 4'te elle çalıştırıldı) — script idempotent olduğu için
tekrar elle çalıştırmak zararsız, ama her deploy'da otomatik çalıştırmaya
gerek yok.

## Domain eklendiğinde

1. DNS'te `<domain>` → VPS IP'sine A kaydı ekleyin (web/admin/api için ayrı
   subdomain'ler öneriliyor, örn. `blog.example.com`/`admin.example.com`/`api.example.com`).
2. `infrastructure/caddy/Caddyfile`'ı IP-only bloklarından, dosyanın sonunda
   zaten hazır duran yorumlu domain-bazlı bloklara geçirin (`{$WEB_DOMAIN}` vb.).
3. `infrastructure/docker-compose.yml`'de caddy servisinin portlarını
   `"80:80"`/`"443:443"`'e geri döndürün (8080/8081 satırlarını kaldırın).
4. `.env`'de `WEB_DOMAIN`/`ADMIN_DOMAIN`/`API_DOMAIN` + `NEXT_PUBLIC_SITE_URL`/
   `NEXT_PUBLIC_ADMIN_URL`/`API_URL`/`CORS_ORIGINS`'i gerçek domain'lerle güncelleyin.
5. `docker compose --env-file .env -f infrastructure/docker-compose.yml up -d --build` —
   Caddy otomatik olarak Let's Encrypt'ten TLS sertifikası alır.

## Sorun giderme

- **`error while interpolating services.postgres.environment.POSTGRES_PASSWORD:
  required variable POSTGRES_PASSWORD is missing a value` (veya
  `STORAGE_ACCESS_KEY`/`NEXT_PUBLIC_SITE_URL` için aynı hata):** `.env`
  var ve doğru dolu olsa bile, `docker compose -f infrastructure/
  docker-compose.yml ...` komutunu `--env-file .env` olmadan doğrudan
  çalıştırırsanız bu hatayı alırsınız — yukarıda "Neden `--env-file .env`"
  kutusuna bakın. Gerçek bir ilk canlı deploy denemesinde tam olarak bu
  hatayla karşılaşıldı, kök nedeni burada belgelendi.
- **`pull access denied for minio/minio, repository does not exist`:**
  MinIO resmi image'ını Docker Hub'dan Quay.io'ya taşıdı — bu repo
  `quay.io/minio/minio` kullanıyor (`docker-compose.yml`), en son
  `git pull` ile güncel değilseniz eski `minio/minio` referansını
  almış olabilirsiniz.
- **`failed to bind host port 127.0.0.1:5432/tcp: address already in use`:**
  VPS'te Docker dışı, yerel bir PostgreSQL zaten 5432'de çalışıyor
  (bazı VPS imajları bunu önceden kurulu getiriyor) — `ss -tlnp | grep
  5432` ile doğrulayın. `.env`'e `POSTGRES_HOST_PORT=5433` (veya boşta
  başka bir port) ekleyip `docker compose ... up -d`'yi tekrar
  çalıştırın; container'ın kendi içi hâlâ 5432, `DATABASE_URL` hiç
  değişmez, yalnızca host'a açılan port taşınır. Aynı çakışma redis
  (6379) veya minio (9000/9001) için de olursa aynı mantıkla
  `docker-compose.yml`'e benzer bir `_HOST_PORT` değişkeni eklenebilir
  (şu an yalnızca postgres için var, gerçek ihtiyaç çıkarsa genişletin).
- **`Bind for 0.0.0.0:80 failed: port is already allocated`:** VPS
  paylaşımlıysa (üzerinde 2blog dışında başka projeler/container'lar da
  çalışıyorsa) 80 zaten kullanımda olabilir — `ss -tlnp | grep :80` ile
  doğrulayın, kimin tuttuğuna bakın. **O container'a/projeye asla
  dokunmayın** (kullanıcının başka bir canlı servisi olabilir). Bunun
  yerine `.env`'e `CADDY_WEB_PORT=8082` (veya boşta başka bir port)
  ekleyin, `NEXT_PUBLIC_SITE_URL`/`CORS_ORIGINS`'i de aynı portu
  içerecek şekilde güncelleyin (`http://<VPS_IP>:8082`), sonra
  `NEXT_PUBLIC_SITE_URL` build-time'da bundle'a gömüldüğü için
  **web image'ını yeniden build edin** (`docker compose build web`),
  sonra `up -d`.
- **`docker compose exec api ...` "no such service" hatası verirse:** `up -d`
  henüz tamamlanmamış olabilir, `docker compose ps` ile `api`'nin `healthy`
  olduğunu doğrulayın.
- **Health check pipeline'da başarısız ama site elle çalışıyor:** GitHub
  Actions runner'ının VPS'e 8080 portundan erişimi firewall/cloud
  security-group tarafından engelleniyor olabilir — deploy'un kendisi
  (SSH adımı) yine de başarılı sayılır, bu adım `continue-on-error`.
- **`git reset --hard` sunucudaki `.env`'i siler mi?** Hayır — `.env`
  `.gitignore`'da, git tarafından hiç takip edilmiyor, `reset --hard`
  yalnızca tracked dosyaları etkiler.
