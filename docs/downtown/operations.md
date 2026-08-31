---
type: operations-guide
status: active
updated: 2026-08-27
links:
  - README.md
  - architecture.md
  - development.md
  - security.md
---

# Vận hành Town Hown

## Trạng thái vận hành

Source có Dockerfile và compose ở repository root. Pipeline GitLab đã được gỡ
khỏi repository; không còn `.gitlab-ci.yml`.

- Dockerfile/compose vẫn là executable artifact owners cho build/chạy thủ công.
- GitHub workflows hiện có là hygiene, branch-policy và workflow lint — không
  deploy.
- Production deployment automation chưa được xác minh. Release vẫn theo
  GitFlow `release/x.y.z` trên GitHub.

Không gọi Vercel, VPS hoặc nền tảng khác là production authority cho đến khi
owner chọn và workflow root được kiểm chứng end-to-end.

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
| Container image | [`Frontend/Dockerfile`](../../Frontend/Dockerfile) |
| Runtime service/port | [`docker-compose.yml`](../../docker-compose.yml) |
| GitHub CI | [`.github/workflows`](../../.github/workflows) |
| Database evolution | [`Backend/supabase/migrations`](../../Backend/supabase/migrations) |

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

```powershell
docker build `
  --build-arg NEXT_PUBLIC_SUPABASE_URL=<value> `
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<value> `
  -t town-hown:local `
  -f Frontend/Dockerfile Frontend

docker run --rm -p 3000:3000 --env-file .env town-hown:local
```

Dockerfile build standalone artifact, copy `.next/standalone`, `.next/static` và
`public`, chạy non-root trên port 3000. Public build variables có thể được bake
vào client bundle; server secrets chỉ truyền runtime.

Smoke checklist:

- Container chạy ổn, không restart loop.
- Homepage trả expected response.
- Login/session refresh hoạt động.
- Một protected data read hoạt động đúng RLS.
- Critical API không lộ stack/secret.
- Static asset/CSS không 404.
- Log không chứa credential hoặc PII bất thường.

## Database migration

1. Xác minh đúng Supabase project/environment.
2. Backup database/data trước schema hoặc bulk data change.
3. Thêm migration mới, không sửa im lặng migration đã apply.
4. Review destructive SQL, lock risk, data conversion và RLS.
5. Apply trên disposable/staging environment trước production.
6. Kiểm tra authenticated, unauthorized và privileged paths.
7. Chuẩn bị forward-fix/rollback và tiêu chí dừng rollout.

Rollback schema không đủ nếu data đã bị xoá/chuyển không đảo ngược. Migration có
data loss risk cần backup/restore drill hoặc staged migration.

## Yêu cầu nếu thêm pipeline deploy sau này

Bất kỳ pipeline deploy mới (GitHub Actions, không phải GitLab) phải:

1. Chạy từ repository root; frontend jobs dùng context/working directory `Frontend`.
2. Tuân GitFlow `release/x.y.z` và môi trường staging/production.
3. Dùng protected/masked variables; không echo secret.
4. Pin SSH host key từ nguồn tin cậy; không tắt strict host verification.
5. Không để privileged `.env` thành runner artifact; remote secret file có owner,
   permission và cleanup rõ.
6. Dùng registry authentication không để password hiện trong process/log.
7. Build immutable image tag gắn commit/version.
8. Chạy lint/build/security/smoke gates trước deploy.
9. Có deploy lock, health check và rollback image tag.
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

Request path kỳ vọng:

```text
Browser -> Cloudflare/DNS/TLS -> reverse proxy -> host :3000
        -> container :3000 -> Next.js standalone
```

Khi gặp connection refused, không đổi sang port mới ngẫu nhiên. Xác minh compose
port, container state và proxy upstream.

Chẩn đoán:

```bash
docker compose ps
docker compose logs --tail=200 itba-ai
curl -I http://127.0.0.1:3000/
```

- Origin fail: app/container/env/migration.
- Origin pass, domain fail: reverse proxy, Cloudflare, DNS/TLS.
- HTML pass, CSS/JS fail: build/static copy hoặc proxy rewrite `_next/static`.
- Homepage pass, API fail: auth, runtime secret, RLS hoặc provider.

Không paste public log chứa secret/PII.

## Rollback

### Application-only

1. Xác định image tag trước đã chạy ổn.
2. Pin service về tag đó.
3. Pull/recreate service.
4. Smoke origin trước, domain sau.
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
