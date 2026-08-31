# Báo Cáo Debug: API Routes Trả Về 404 ở Role HR

**Ngày:** 01/05/2026  
**Branch:** dev  
**URL truy cập:** conditions-taylor-todd-char.trycloudflare.com

---

## Tóm Tắt

Tất cả các API route phục vụ HR Dashboard đều trả về **404**, khiến dashboard không hiển thị dữ liệu. Có **2 nguyên nhân riêng biệt** được xác định.

---

## Các Route Bị Lỗi

| Route | Status | Thời gian |
|-------|--------|-----------|
| `GET /api/recruitment/dashboard` | 404 | ~1.9s |
| `GET /api/recruitment/applications?pageSize=20` | 404 | ~2.1–3.5s |
| `GET /api/recruitment/activity` | 404 | ~2.3–2.5s |
| `GET /api/recruitment/interviews` | 404 | ~1.2–1.7s |
| `GET /api/versions/unread` | 404 | ~0.6–2.2s |

---

## Nguyên Nhân

### Nguyên Nhân 1 — `/api/recruitment/activity` KHÔNG có trong build

File `src/app/api/recruitment/activity/route.ts` được **thêm vào sau lần `next build` cuối cùng**.

- Kiểm tra `.next/server/app/api/recruitment/`: không có thư mục `activity/`
- Kiểm tra `.next/server/chunks/`: không có chunk nào cho `activity`
- **Kết quả:** Server production sẽ luôn trả về 404 cho route này vì nó chưa bao giờ được compile

### Nguyên Nhân 2 — Biến môi trường `SUPABASE_SERVICE_ROLE_KEY` có thể bị thiếu

Các route khác (`dashboard`, `applications`, `versions/unread`) **có trong build** (`routes-manifest.json` và `.next/server/app/api/`) nhưng vẫn trả về 404.

Các route này đều gọi `createAdminClient()`, hàm này yêu cầu:

```ts
// src/lib/supabase/admin.ts
createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // ← nếu thiếu → throw Error
)
```

File `.env.local` **chỉ có duy nhất**:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Không có `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, hay `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Nếu các biến này không được set trong môi trường shell/Docker đang chạy server, `createClient()` sẽ throw lỗi → Next.js 16 (Turbopack runtime) convert thành **404** thay vì 500 như các phiên bản cũ.

---

## Bằng Chứng

| Kiểm tra | Kết quả |
|----------|---------|
| TypeScript compile | ✅ Không lỗi |
| `activity/` trong `.next` build | ❌ Không tồn tại |
| `dashboard/` trong `.next` build | ✅ Tồn tại |
| `applications/` trong `.next` build | ✅ Tồn tại |
| `versions/unread/` trong `.next` build | ✅ Tồn tại |
| `activity` trong `routes-manifest.json` | ❌ Không có |
| `dashboard` trong `routes-manifest.json` | ✅ Có |
| Middleware chặn API routes | ❌ Không (middleware bỏ qua `/api/*`) |
| Code route handler trả về 404 | ❌ Không (chỉ trả 401/403/500) |

---

## Cách Khắc Phục

### Bước 1 — Kiểm tra biến môi trường

Chạy lệnh này trong terminal đang chạy server (hoặc trong Docker container):

```bash
echo $SUPABASE_SERVICE_ROLE_KEY
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Nếu có biến nào **trống** → cần set lại trước khi khởi động server.

### Bước 2 — Rebuild lại ứng dụng

```bash
npm run build
```

Lệnh này sẽ compile `activity/route.ts` và tất cả route còn thiếu vào `.next`.

### Bước 3 — Khởi động lại server

```bash
# Dev mode
npm run dev

# Hoặc production
npm run start
```

Nếu dùng Docker:
```bash
docker run \
  -e SUPABASE_SERVICE_ROLE_KEY=<key> \
  -e NEXT_PUBLIC_SUPABASE_URL=<url> \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=<key> \
  ...
```

---

## Test Nhanh Để Xác Nhận

Sau khi fix, chạy lệnh này để kiểm tra:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/recruitment/dashboard
```

| Kết quả | Ý nghĩa |
|---------|---------|
| `401` | ✅ Route hoạt động, chỉ cần login |
| `404` | ❌ Route vẫn không tìm thấy, cần rebuild |
| `500` | ❌ Route tìm thấy nhưng lỗi runtime, kiểm tra env vars |

---

## Câu Hỏi Còn Tồn Đọng

1. Server đang chạy **dev mode** hay **production mode**? (Ảnh hưởng đến cách xử lý build stale)
2. `SUPABASE_SERVICE_ROLE_KEY` được set ở đâu trong môi trường hiện tại? (shell profile, Docker, CI/CD?)
3. Lần `next build` cuối cùng chạy là khi nào? (So sánh với commit `972f087` thêm HR dashboard data)
