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
docker compose -f infrastructure/docker-compose.yml build
docker compose -f infrastructure/docker-compose.yml up -d
docker compose -f infrastructure/docker-compose.yml exec -T api pnpm --filter @2blog/core-database migrate
docker compose -f infrastructure/docker-compose.yml exec -T api pnpm --filter @2blog/core-database seed
```

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
5. `docker compose -f infrastructure/docker-compose.yml up -d --build` —
   Caddy otomatik olarak Let's Encrypt'ten TLS sertifikası alır.

## Sorun giderme

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
