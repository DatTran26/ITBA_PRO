---
type: operations-guide
status: active
updated: 2026-09-02
links:
  - README.md
  - architecture.md
  - development.md
  - security.md
---

# Vận hành Town Hown

## Trạng thái vận hành

Source có Dockerfile dưới `Frontend/` và compose ở repository root. Pipeline
GitLab đã được gỡ; không còn `.gitlab-ci.yml`. GitHub Actions `.github/workflows/docker-publish.yml` build image `linux/amd64`
lên GHCR rồi SSH **root** lên VPS:

- push `develop` → Environment `staging` → `/opt/ITBA-OCR/staging` →
  `staging.wpcteam.shop` (`APP_PORT=2026`)
- push `main` → Environment `production` → `/opt/ITBA-OCR/production` →
  `production.wpcteam.shop` (`APP_PORT=2005`)

Runtime `.env` trên VPS không đi qua GitHub. Deploy key nằm ở
`/root/.ssh/authorized_keys`.

- Local/VPS runtime owner: [`docker-compose.yml`](../../docker-compose.yml)
  (services `web`, `vision-ai-api`, `vision-ocr-api`).
- Image owner: [`Frontend/Dockerfile`](../../Frontend/Dockerfile),
  [`modules/vision-ai/backend/Dockerfile`](../../modules/vision-ai/backend/Dockerfile),
  [`modules/vision-ocr/backend/Dockerfile`](../../modules/vision-ocr/backend/Dockerfile).
- Publish: push `develop` → `:staging` + sha; push `main` → `:latest` + sha;
  git tag `v*` → `:x.y.z` + `:latest` + sha. The same tags are applied to
  `down-town`, `down-town-vision-ai`, and `down-town-vision-ocr`.

Tracking (GitHub, không chứa secret):

- Cutover còn lại: https://github.com/DatTran26/down-town/issues/22
- Docker/GHCR PR: https://github.com/DatTran26/down-town/pull/21
  (`develop-dat` → `develop`; merge không đóng #22)

## GitHub Environments (bắt buộc trước publish thật)

Workflow đọc `vars.NEXT_PUBLIC_*` từ Environment. File YAML không tạo được
Environment. Trên `DatTran26/down-town` → Settings → Environments:

Canonical origins (baked into each image as `NEXT_PUBLIC_APP_URL`):

| Environment | Origin | Supabase project |
| --- | --- | --- |
| `staging` | `https://staging.wpcteam.shop` | `itba-ai-staging` (`mqwsulanzahqaiecnfwc`; thay `kxpunppvqfxfqdwpqpmp` đã xóa), org **WPCTeam** |
| `production` | `https://production.wpcteam.shop` | `itba-ai` (`lhvdtmieaplxzqmpmupe`), org **WPC Team** |

Các biến public trên mỗi Environment: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`,
`NEXT_PUBLIC_ENABLE_TURNSTILE`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
Khi bật Turnstile, đặt `NEXT_PUBLIC_ENABLE_TURNSTILE=true` và site key của
đúng widget cho từng environment. Site key được phép nằm trong GitHub
Environment variable vì nó xuất hiện trong browser bundle; **không** đặt
Turnstile Secret key ở GitHub, `.env`, source, log, hay chat.

Không đưa `SUPABASE_SERVICE_ROLE_KEY` / `OPENAI_API_KEY` / `DATABASE_URL` lên
GitHub. Chúng thuộc `.env` trên VPS (runtime) và/hoặc Supabase Edge Function
secrets / `system_settings`.

Org **WPCTeam** (staging) hiện chỉ có Owner `wpcteampro`. Mời Dat/Hieu/Kien/Thanh
vào [Team settings](https://supabase.com/dashboard/org/qfnvmweuancehaukodeb/team)
để cùng thấy project staging (API invite Free plan trả 402).

Không dùng một image cho cả hai origin. Staging build từ `develop`; production
build từ `main` (và tag `v*`).

1. Tạo `staging` và `production`.
2. Mỗi environment: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`,
   `NEXT_PUBLIC_ENABLE_TURNSTILE`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
3. `NEXT_PUBLIC_APP_URL` **bắt buộc** trên `production` (job fail nếu trống).
   Khi `NEXT_PUBLIC_ENABLE_TURNSTILE=true`, workflow cũng fail nếu site key
   trống.
4. Sau lần push GHCR đầu: Packages → `down-town` → Change visibility → Public
   (repo đã public; image không chứa server secret) để VPS pull không cần PAT.

Publish chưa được coi là “xong” cho đến khi một `workflow_dispatch` hoặc push
`develop` chạy với vars khác rỗng.

### Turnstile / Supabase CAPTCHA

`captcha protection: request disallowed (invalid-input-secret)` là lỗi từ
Cloudflare Siteverify: secret mà Supabase Auth gửi để xác thực widget không hợp
lệ hoặc đã bị thu hồi. Đây không phải lỗi mật khẩu hay token của người dùng.

Với **mỗi** environment, cấu hình theo cặp cùng một widget:

1. Trong Cloudflare Turnstile, tạo/chọn widget cho hostname tương ứng và lấy
   Site Key cùng Secret Key. Nếu staging và production dùng widget khác nhau,
   chúng phải dùng cặp key riêng.
2. Trong GitHub → Settings → Environments → `staging` hoặc `production`, đặt
   `NEXT_PUBLIC_ENABLE_TURNSTILE=true` và
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY=<Site Key>`.
3. Trong đúng Supabase project ở bảng trên: Settings → Authentication → Bot and
   Abuse Protection, bật CAPTCHA, chọn **Cloudflare Turnstile**, dán **Secret
   Key** của cùng widget, rồi Save. Secret chỉ được dán trực tiếp vào dashboard.
4. Publish lại image của environment vì các biến `NEXT_PUBLIC_*` được in vào
   bundle khi build. Sau đó đăng nhập một lần để smoke-test.

Nếu lỗi vẫn là `invalid-input-secret`, lấy Secret Key đang hoạt động từ widget
trong Cloudflare (hoặc tạo cặp key mới) rồi thay trong Supabase project đó; kiểm
tra không nhầm Secret Key với Site Key và không dùng secret của widget khác.

## Validation snapshot sau tái cấu trúc

Ngày 2026-08-27:

- `Frontend`: `npm ci` hoàn tất; production `npm run build` pass và nhận diện
  toàn bộ pages/BFF routes.
- `Backend`: lockfile install, package audit và syntax check năm DB utilities pass.
- `Frontend`: lint config đã được đưa sang native flat config và chạy được, nhưng
  source baseline còn 34 errors/154 warnings. Các warning overrides có sẵn được
  giữ nguyên; task không hạ thêm rule để làm gate giả pass.
- Frontend dependency audit báo 22 findings (14 high); cần triage riêng, không
  chạy auto-fix trong task tài liệu/restructure.
- Next cảnh báo convention `middleware` deprecated; migration sang `proxy` là
  task compatibility riêng.

## Executable artifacts

| Concern | Owner |
| --- | --- |
| Build scripts/dependencies | [`Frontend/package.json`](../../Frontend/package.json) |
| Standalone output | [`Frontend/next.config.ts`](../../Frontend/next.config.ts) |
| Container image | [`Frontend/Dockerfile`](../../Frontend/Dockerfile), Vision AI/OCR Dockerfiles under `modules/` |
| Runtime service/port | [`docker-compose.yml`](../../docker-compose.yml) |
| GHCR publish | [`.github/workflows/docker-publish.yml`](../../.github/workflows/docker-publish.yml) |
| GitHub CI | [`.github/workflows`](../../.github/workflows) |
| Database evolution | [`Backend/supabase/migrations`](../../Backend/supabase/migrations) |
| Schema contract vs live/staging | [`Backend/README.md`](../../Backend/README.md) |

## Local build

```powershell
Set-Location Frontend
npm ci
npm run lint
npm run build
```

`npm run build` cần public Supabase build configuration nếu source yêu cầu tại
build time. Không in hoặc commit secret để làm build pass.

## Container build và smoke

Hai template env:

- `npm run dev`: copy [`Frontend/.env.example`](../../Frontend/.env.example)
- `docker compose`: copy [`.env.example`](../../.env.example) ở repo root sang
  `.env` (gitignored), điền public Supabase keys trước `up --build`

`NEXT_PUBLIC_*` được bake lúc build. Sửa `.env` trên VPS không đổi URL đã in
trong bundle. Staging và production phải là hai image khác nhau.

```powershell
docker compose config
docker compose up --build -d
curl -fsS "http://127.0.0.1:$($env:APP_PORT ?? 3000)/api/health"
docker compose logs --tail=200 web
```

```bash
docker compose config
docker compose up --build -d
curl -fsS "http://127.0.0.1:${APP_PORT:-3000}/api/health"
docker compose logs --tail=200 web
```

`docker compose config` parse được khi chưa có `.env`. `up --build` cần public
Supabase keys trong `.env` hoặc shell.

Tương đương build tay:

```powershell
docker build `
  --build-arg NEXT_PUBLIC_SUPABASE_URL=<value> `
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<value> `
  --build-arg NEXT_PUBLIC_APP_URL=<value> `
  -t ghcr.io/dattran26/down-town:local `
  -f Frontend/Dockerfile Frontend
```

Image chạy non-root, `GET /api/health` → `{"ok":true}` (middleware bỏ qua path
này, không gọi Supabase). `restart: unless-stopped` **không** tự restart
container `unhealthy`; recover bằng recreate/rollback.

Smoke checklist:

- Container `web` healthy, không restart loop.
- Containers `vision-ai-api` và `vision-ocr-api` healthy trên cùng compose project.
- `/api/health` 200.
- Homepage trả expected response.
- Login/session refresh hoạt động.
- Một protected data read hoạt động đúng RLS.
- Critical API không lộ stack/secret.
- Static asset/CSS không 404.
- Log không chứa credential hoặc PII bất thường.

`CHANGELOG.md` trong container là ephemeral. Version approval ghi DB; recreate
mất phần append trên filesystem.

## GHCR pull trên VPS (thủ công)

Pin tag hoặc digest, không dùng `:latest` làm pin production.

```bash
# First cutover from the old itba-ai service name:
docker compose down
export DOCKER_IMAGE=ghcr.io/dattran26/down-town:staging
export VISION_AI_IMAGE=ghcr.io/dattran26/down-town-vision-ai:staging
export VISION_OCR_IMAGE=ghcr.io/dattran26/down-town-vision-ocr:staging
docker compose pull
docker compose up -d --remove-orphans
docker compose ps
curl -fsS "http://127.0.0.1:${APP_PORT:-3000}/api/health"
```

`--remove-orphans` tránh container `itba-ai` cũ giữ host port.

## Database migration

Inventory object (bảng, bucket, lệch còn lại) nằm tại
[`Backend/README.md`](../../Backend/README.md). Timestamp trong
`schema_migrations` trên dashboard không cần trùng tên file git; object
`public` mới là contract.

1. Xác minh đúng Supabase project/environment.
2. Backup database/data trước schema hoặc bulk data change.
3. Thêm migration mới, không sửa im lặng migration đã apply.
4. Review destructive SQL, lock risk, data conversion và RLS.
5. Apply trên disposable/staging environment trước production.
6. Kiểm tra authenticated, unauthorized và privileged paths.
7. Chuẩn bị forward-fix/rollback và tiêu chí dừng rollout.

Rollback schema không đủ nếu data đã bị xoá/chuyển không đảo ngược. Migration có
data loss risk cần backup/restore drill hoặc staged migration.

## Yêu cầu nếu thêm SSH/VPS auto-deploy sau này

GHCR publish đã có. Bất kỳ pipeline **deploy lên máy** (vẫn GitHub Actions, không
GitLab) phải:

1. Chạy từ repository root; frontend jobs dùng context `Frontend`.
2. Tuân GitFlow `release/x.y.z` và môi trường staging/production.
3. Dùng protected/masked variables; không echo secret.
4. Pin SSH host key từ nguồn tin cậy; không tắt strict host verification.
5. Không để privileged `.env` thành runner artifact; remote secret file có owner,
   permission và cleanup rõ.
6. Dùng registry authentication không để password hiện trong process/log.
7. Build immutable image tag gắn commit/version (đã có trên GHCR).
8. Chạy lint/build/security/smoke gates trước deploy.
9. Có deploy lock, health check và rollback image tag/digest.
10. Tách staging/production approval và secret scope.

## Release

Version authority là `Frontend/package.json`. Manifest hiện có
`npm run version` nhưng target script không tồn tại; không dùng lệnh này.

Quy trình mục tiêu:

```text
personal/feature -> develop -> release/x.y.z -> main -> tag/artifact
```

Chỉ tag/publish khi manifest/lockfile đồng bộ, validation pass và artifact đã
được smoke test. Không bump version chỉ vì tài liệu phase báo complete.

## Reverse proxy và Cloudflare

Cùng VPS với Max Claw; Town Hown **không** dùng cổng Claw. Host ports cố định:

| Env | Domain | Host port | Compose project |
| --- | --- | --- | --- |
| production | `production.wpcteam.shop` | **2005** | `itba-ocr-production` |
| staging | `staging.wpcteam.shop` | **2026** | `itba-ocr-staging` |

Snippet Nginx/Caddy: [`deploy/vps/`](../../deploy/vps/README.md). Local compose vẫn mặc định `APP_PORT=3000`.

Request path kỳ vọng:

```text
Browser -> Cloudflare (SSL Full / Full strict, HTTPS) -> Traefik :443
        -> 127.0.0.1:2005 (prod) hoặc :2026 (staging)
        -> container :3000 -> Next.js standalone
```

HTTP tới origin được Traefik 308 sang HTTPS. Overlay này không dùng với
Cloudflare Flexible. Full (strict): Origin CA trên Traefik, xem
[`deploy/vps/README.md`](../../deploy/vps/README.md).

Khi gặp connection refused, không đổi sang port mới ngẫu nhiên. Xác minh compose
`APP_PORT`, container state và proxy upstream.

Chẩn đoán:

```bash
docker compose ps
docker compose logs --tail=200 web
curl -I "http://127.0.0.1:${APP_PORT:-3000}/api/health"
```

- Origin fail: app/container/env/migration.
- Origin pass, domain fail: reverse proxy, Cloudflare, DNS/TLS.
- HTML pass, CSS/JS fail: build/static copy hoặc proxy rewrite `_next/static`.
- Homepage pass, API fail: auth, runtime secret, RLS hoặc provider.

Không paste public log chứa secret/PII.

## Rollback

### Application-only

1. Xác định image tag/digest trước đã chạy ổn (không dùng `:latest`).
2. `export DOCKER_IMAGE=ghcr.io/dattran26/down-town:<tag-or-digest>`.
3. `docker compose pull && docker compose up -d --remove-orphans`.
4. Smoke origin (`/api/health` trên `$APP_PORT`) trước, domain sau.
5. Kiểm tra login, protected read và critical flow bị ảnh hưởng.

### Có migration

- Ưu tiên forward-fix nếu production traffic đã dùng schema mới.
- Chỉ rollback khi app image/schema/data vẫn tương thích.
- Restore backup là destructive/high-impact action cần approval và target
  verification.

## Incident ladder

1. Ghi timestamp, URL, status, request/Ray ID và release tag.
2. Phân loại DNS/TLS/proxy/container/app/database/provider.
3. Kiểm tra owner nhỏ nhất trước, không restart toàn stack theo thói quen.
4. Redact log/evidence.
5. Mitigate hoặc rollback theo safety boundary.
6. Xác minh recovery bằng critical user journey.
7. Ghi incident report; chuyển invariant bền vững về docs owner.

## Production readiness checklist

- Owner on-call/escalation rõ.
- Backup/restore và migration recovery đã thử.
- Secret rotation và least privilege được kiểm tra.
- Retention/consent/privacy policy được phê duyệt.
- Health, logs, alerting và audit có consumer.
- Capacity/provider quota và failure modes được đánh giá.
- Staging gần production đủ để validate release.
- Rollback tag và runbook đã được diễn tập.

Có pipeline hoặc container không tự chứng minh production readiness.
