# Tài liệu Sửa lỗi: Biến Môi trường (Environment Variables) không hoạt động trong Docker (Next.js Standalone)

> **Runbook hỗ trợ.** Nguồn chuẩn của build/runtime env là Dockerfile,
> `.gitlab-ci.yml`, `next.config.ts` và
> [`deployment-guide.md`](deployment-guide.md).

Tài liệu này ghi lại chi tiết nguyên nhân và cách khắc phục lỗi các biến môi trường prefix `NEXT_PUBLIC_` bị trống (undefined) khi chạy ứng dụng Next.js trong Docker container, đặc biệt là khi sử dụng chế độ `output: 'standalone'`.

---

## 1. Hiện tượng (The Symptom)
- Ứng dụng chạy bình thường ở môi trường local (`npm run dev`).
- Sau khi deploy bằng Docker lên VPS, các tính năng sử dụng biến `NEXT_PUBLIC_...` (như Supabase URL, Web API key) bị lỗi.
- Kiểm tra Browser Console thấy lỗi: `Uncaught (in promise) Error: @supabase/ssr: Your project's URL and API key are required to create a Supabase client!`.
- Kiểm tra Network hoặc Log thấy các biến này mang giá trị `undefined`.

## 2. Nguyên nhân gốc rễ (Root Cause)
Trong Next.js, các biến môi trường bắt đầu bằng **`NEXT_PUBLIC_`** được **inline** (nhúng trực tiếp giá trị) vào mã nguồn JavaScript được gửi cho trình duyệt **ngay tại thời điểm Build** (`npm run build`).

### Chi tiết:
1. **Quá trình Build tròng Docker**: Khi lệnh `npm run build` chạy trong `Dockerfile`, nó không có quyền truy cập vào các biến môi trường được truyền vào từ file `.env` trên VPS hay từ `docker-compose.yml` (vì đó là biến tại thời điểm **Runtime**).
2. **Giá trị bị trống**: Do không tìm thấy biến tại thời điểm Build, Next.js sẽ thay thế `process.env.NEXT_PUBLIC_...` bằng chuỗi trống hoặc `undefined` trong các file JS tĩnh.
3. **Runtime không ghi đè được**: Ngay cả khi bạn cung cấp file `.env` đầy đủ cho container lúc chạy (`docker compose up`), các file JS của trình duyệt đã được build sẵn rồi, chúng không thể đọc lại các biến này từ server nữa.

## 3. Cách khắc phục (The Solution)

### Bước 1: Cấu hình `Dockerfile` nhận Build Arguments
Chúng ta cần khai báo `ARG` trong `Dockerfile` để nhận giá trị từ bên ngoài truyền vào lúc build.

```dockerfile
# /Dockerfile (Stage builder)
FROM base AS builder
...
COPY . .

# Khai báo ARG để nhận giá trị build-time
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Gán ARG vào ENV để Next.js build script nhìn thấy
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build
...
```

### Bước 2: Cấu hình GitLab CI/CD truyền giá trị
Cập nhật file `.gitlab-ci.yml` để truyền các giá trị từ GitLab Variables vào lệnh `docker build`.

```yaml
# /.gitlab-ci.yml
build:
  script:
    - docker build 
      --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL 
      --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY 
      -t $DOCKER_IMAGE_VERSION .
```

### Bước 3: Thêm Variables vào GitLab
1. Truy cập GitLab Repo -> **Settings** -> **CI/CD** -> **Variables**.
2. Thêm các biến:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Đảm bảo các biến này có giá trị đúng cho môi trường Production.

## 4. Bài học kinh nghiệm (Key Takeaways)

1. **Phân biệt Build-time vs Runtime**:
   - `NEXT_PUBLIC_...`: Cần tại thời điểm **Build** (để nhúng vào JS browser).
   - `OPENAI_API_KEY`, `DATABASE_URL`: Cần tại thời điểm **Runtime** (server-only).
2. **Tính bảo mật**: Mặc dù `NEXT_PUBLIC_` variables được nhúng vào JS, chúng là công khai theo thiết kế. Không bao giờ đặt Secret Keys (như `SERVICE_ROLE_KEY`) vào prefix `NEXT_PUBLIC_`.
3. **Quy trình Deploy chuẩn**: Khi thay đổi giá trị của một biến `NEXT_PUBLIC_`, bắt buộc phải **Rebuild** lại Docker image. Việc chỉ restart container sẽ không giải quyết được vấn đề.

---
*Tài liệu được biên soạn để phục vụ việc học tập và tra cứu sau này.*
*Ngày cập nhật: 03/04/2026*
