# Vận hành và triển khai ITBAAI

## Trạng thái hiện tại

Dockerfile và compose mô tả artifact/runtime có thể kiểm chứng. Pipeline GitLab
trong `.gitlab-ci.yml` là **legacy và chưa được nối vào single-repo**:

```text
manual/CI build (cần wiring)
  -> Docker image
  -> Next.js standalone container :3000
```

Owners:

- Legacy pipeline reference: [`.gitlab-ci.yml`](../.gitlab-ci.yml)
- Image: [`Dockerfile`](../Dockerfile)
- Runtime service: [`docker-compose.yml`](../docker-compose.yml)
- Next standalone setting: [`next.config.ts`](../next.config.ts)

GitLab không tự discovery `.gitlab-ci.yml` nằm trong thư mục app, và jobs legacy
giả định `package.json`, Dockerfile/compose ở repository root. Vì vậy không coi
GitLab/VPS hoặc Vercel là production automation hiện hành cho đến khi root CI,
working directory, branch trigger và environment ownership được cấu hình lại.

Pipeline legacy còn có security debt: dynamic `ssh-keyscan`, tắt strict host
verification khi `scp`, tạo `.env` chứa privileged secrets và copy lên VPS mà
chưa chứng minh permission/cleanup. Không chạy pipeline này cho production trước
khi pin host key, dùng protected/masked variables, hạn chế quyền file, xoá secret
artifact và thay registry authentication bằng cơ chế an toàn hơn.

## Local development

### Yêu cầu

- Node.js/npm tương thích lockfile.
- Supabase project hoặc environment development hợp lệ.
- Secret được cấp qua kênh quản lý secret của đội.

### Cài và chạy

```powershell
npm ci
npm run dev
```

Ứng dụng mặc định ở `http://localhost:3000`.

Project không version-control `.env.example`. Tạo `.env.local` theo secret được
cấp và không commit. Source hiện tham chiếu các key chính:

| Key | Boundary |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public build/runtime configuration |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon client key, vẫn phụ thuộc RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged key |
| `OPENAI_API_KEY` | Server-only AI provider key |
| `OPENAI_MODEL` | Optional server-side model override |
| `NEXT_PUBLIC_APP_URL` | Canonical absolute app URL khi luồng cần |

Không đưa giá trị thật vào docs, log hoặc client bundle ngoài các biến được chủ
ý đánh dấu `NEXT_PUBLIC_*`.

### Validation trước khi giao

```powershell
npm run lint
npm run build
```

Không có `npm test` trong manifest hiện tại. Với thay đổi domain/risk cao, ghi rõ
focused/manual checks đã chạy và environment sử dụng.

## Database change

1. Xác định đúng Supabase project/environment.
2. Backup trước schema/data change trên database chia sẻ hoặc production.
3. Thêm migration mới trong `supabase/migrations`.
4. Review SQL, lock/data-loss risk và RLS.
5. Apply trên disposable/staging database trước production.
6. Xác minh cả authenticated, unauthorized và service-role path liên quan.
7. Chuẩn bị rollback/forward-fix; migration destructive cần kế hoạch phục hồi dữ
   liệu, không chỉ rollback schema.

Migration files là nguồn chuẩn; không copy danh sách migration/table vào docs.

## Build container

```powershell
docker build `
  --build-arg NEXT_PUBLIC_SUPABASE_URL=<value> `
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<value> `
  -t itba-ai:local .

docker run --rm -p 3000:3000 --env-file .env itba-ai:local
```

Hai biến `NEXT_PUBLIC_*` được bake vào client bundle trong build stage. Server
secrets chỉ truyền runtime, không dùng Docker `ARG` nếu chúng không cần ở build.
Image chạy non-root và dùng output standalone.

## Legacy GitLab CI contract (chưa vận hành)

Pipeline cũ được viết để chạy build/deploy trên branch `release` khi app là repo
riêng. Sau tích hợp, nó cần được di chuyển/được include từ root, đặt working
directory `learning-and-testing-system` và đồng bộ trigger `release/x.y.z` trước
khi sử dụng. Khi được thiết kế lại, CI sẽ cần các nhóm variable:

- Container registry credentials do GitLab cung cấp.
- Public Supabase build variables.
- Server runtime secrets như service role, database/AI key.
- VPS SSH identity và target (`SSH_PRIVATE_KEY`, VPS user/IP).

Tên chi tiết và cách sử dụng phải đối chiếu trực tiếp pipeline đã được review.
Không ghi giá trị/private key vào repository hoặc runner artifact. Host key phải
được pin từ nguồn tin cậy, không thu động ngay trong job deployment.

## VPS runtime

Runbook legacy copy `docker-compose.yml` và runtime `.env` tới VPS rồi recreate
service. Cách này chưa được phê duyệt cho single-repo và cần hardening secret
file permissions/cleanup trước khi dùng. Compose expose container port 3000.

Checklist sau deploy:

- Container mới đang chạy và không restart loop.
- Health/smoke path qua domain trả expected status.
- Login/session refresh hoạt động.
- Một read path Supabase hoạt động dưới RLS.
- Critical API không lộ secret/error stack.
- Log không có credential/PII bất thường.
- Nếu có migration: schema/RLS và backward compatibility đã được xác minh.

## Cloudflare/reverse proxy

Reverse proxy phải trỏ tới port thực sự được expose bởi compose/service. Khi gặp
`127.0.0.1:3001 refused`, không đổi port ngẫu nhiên; xác định container port,
host mapping và upstream config. Runbook chi tiết:
[`troubleshooting-vps-cloudflare-nextjs-standalone.md`](troubleshooting-vps-cloudflare-nextjs-standalone.md).

## Rollback

### Application-only

1. Xác định image tag trước đó đã chạy ổn.
2. Đặt `DOCKER_IMAGE` về tag đó trên VPS/deployment process.
3. `docker compose pull` rồi recreate service.
4. Smoke test critical paths và kiểm tra logs.

### Có database migration

- Ưu tiên forward-fix nếu migration đã được production traffic sử dụng.
- Chỉ rollback schema khi đã chứng minh tương thích với app image cũ và dữ liệu
  không bị mất.
- Restore từ backup cần approval và target verification; không thao tác trực tiếp
  dựa trên tên project mơ hồ.

## Troubleshooting ladder

1. Xác nhận domain/TLS/reverse proxy có tới đúng host/port.
2. Kiểm tra compose service và container exit/restart state.
3. Đọc container logs, tìm lỗi env, build artifact hoặc provider connectivity.
4. So sánh runtime env **theo tên key**, không in giá trị secret.
5. Kiểm tra Supabase URL/key scope, RLS và migration state.
6. Với lỗi client asset/build, kiểm tra build-time `NEXT_PUBLIC_*` và `.next`
   standalone/static copy trong Dockerfile.
7. Với AI/email, tách provider failure khỏi application validation/auth failure.

Tài liệu chuyên biệt còn lại:

- [`troubleshooting-env-docker.md`](troubleshooting-env-docker.md)
- [`troubleshooting-css-docker.md`](troubleshooting-css-docker.md)
- [`vps-deployment-gitlab-cicd.md`](vps-deployment-gitlab-cicd.md) — runbook cũ,
  dùng cùng executable owners ở trên và kiểm chứng trước khi chạy.

## Production readiness chưa được suy ra từ docs

Việc có pipeline không tự chứng minh backup, monitoring, retention, legal/privacy
hoặc incident ownership đã hoàn chỉnh. Trước production rollout cần owner xác
nhận những policy này ngoài technical smoke checks.
