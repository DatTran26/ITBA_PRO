# Runbook VPS, Cloudflare và Next.js standalone

Runbook này áp dụng khi domain qua Cloudflare/reverse proxy không tới được
container ITBAAI hoặc ứng dụng trả lỗi sau deploy. Executable owners hiện tại:

- [`../Dockerfile`](../Dockerfile)
- [`../docker-compose.yml`](../docker-compose.yml)
- [`../next.config.ts`](../next.config.ts)
- [`.gitlab-ci.yml`](../.gitlab-ci.yml)

## Safety boundary

- Chỉ kiểm tra/dừng container hoặc process thuộc ITBAAI.
- Không in `.env`, token, key hoặc credential vào terminal log/chụp màn hình.
- Không đổi port, DNS hoặc TLS khi chưa xác định lớp nào đang lỗi.
- Trước rollback có migration, xác minh tương thích schema và backup.

## Luồng request kỳ vọng

```text
Browser -> Cloudflare DNS/TLS -> reverse proxy trên VPS
        -> host port 3000 -> container port 3000
        -> Next.js standalone server
```

`docker-compose.yml` hiện publish `3000:3000`; Dockerfile đặt `PORT=3000` và
`HOSTNAME=0.0.0.0`. Nếu reverse proxy trỏ `127.0.0.1:3001`, cấu hình đó không
khớp executable owner hiện tại.

## Chẩn đoán theo lớp

### 1. Client và Cloudflare

- Ghi lại URL, timestamp, HTTP status, Cloudflare Ray ID nếu có.
- Phân biệt DNS/TLS error, Cloudflare 52x và HTTP 4xx/5xx từ app.
- Không bật/tắt proxy mode hoặc thay origin certificate chỉ để thử ngẫu nhiên.

### 2. Reverse proxy

Xác minh upstream host/port trong Nginx/Caddy/Cloudflare Tunnel config. Upstream
phải tới host port mà compose publish. Kiểm tra config syntax trước reload và
reload mềm thay vì dừng toàn bộ web server.

### 3. Container

```bash
cd /app/itba-ai
docker compose ps
docker compose logs --tail=200 itba-ai
```

Tìm restart loop, missing runtime env, lỗi kết nối provider/database hoặc thiếu
standalone/static artifact. Không paste log chứa dữ liệu nhạy cảm ra public issue.

### 4. Origin smoke test

Từ VPS, gọi trực tiếp host port:

```bash
curl -I http://127.0.0.1:3000/
```

- Origin fail: tập trung container/app/env.
- Origin pass nhưng domain fail: tập trung reverse proxy, Cloudflare, DNS/TLS.
- Homepage pass nhưng API fail: kiểm tra auth, RLS, runtime secret và route log.

### 5. Build-time và runtime environment

`NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` được cung cấp lúc
Docker build và có thể được bake vào client bundle. Server secrets được truyền
lúc container chạy. So sánh **tên key và presence**, không in value.

Khi public config sai, rebuild image đúng variable rồi deploy tag mới; restart
container với env mới không sửa giá trị đã bake vào bundle cũ.

### 6. Static asset/CSS

Dockerfile phải copy cả `.next/standalone`, `.next/static` và `public`. Nếu HTML
có nhưng CSS/JS 404:

- kiểm tra asset request/status/path;
- xác minh image được build từ commit mong muốn;
- kiểm tra reverse proxy có rewrite `_next/static` sai không;
- không copy thủ công `.next` từ máy dev vào container production.

## Lỗi phổ biến

### `connect() failed (111: Connection refused)`

Upstream không có listener. Kiểm tra compose port, container state và reverse
proxy upstream. Không tăng sang port mới; sửa cấu hình về đúng owner.

### Container restart loop

Đọc log/exit code. Các nhóm nguyên nhân thường gặp: thiếu runtime env, artifact
standalone không đầy đủ, provider/database unreachable hoặc migration không tương
thích. Sửa nguyên nhân hoặc rollback image; không đặt `restart: always` như bằng
chứng service khỏe.

### Cloudflare 502/504

Smoke test origin. Nếu origin khỏe, kiểm tra proxy/tunnel/firewall. Nếu origin
không khỏe, xử lý app/container trước Cloudflare.

### Login/API 500 sau deploy

Kiểm tra runtime Supabase server key/config, cookie/domain và migration/RLS. API
log phải được redact trước khi chia sẻ.

## Recovery

1. Nếu image mới gây lỗi và schema vẫn tương thích, pin về image tag trước.
2. `docker compose pull` và recreate service.
3. Smoke test origin trước, sau đó domain.
4. Kiểm tra login, một protected read và critical flow bị ảnh hưởng.
5. Lưu incident evidence/decision trong report; chuyển rule bền vững về docs owner.

Rollback có database change phải theo
[`deployment-guide.md`](deployment-guide.md), không tự chạy down migration khi
chưa xác minh data loss/compatibility.
