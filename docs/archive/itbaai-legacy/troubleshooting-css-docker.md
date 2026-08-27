# Tài liệu Sửa lỗi: CSS không hiển thị khi Deploy Docker (Next.js 15 + Tailwind v4)

> **Runbook theo incident cũ.** Tên framework trong tiêu đề phản ánh ngữ cảnh
> lúc xảy ra lỗi. Đối chiếu `package.json`, Dockerfile và build output hiện tại
> trước khi áp dụng.

Tài liệu này ghi lại chi tiết nguyên nhân và cách khắc phục lỗi giao diện bị mất (bare HTML) sau khi deploy ứng dụng Next.js 15 sử dụng Tailwind CSS v4 bằng Docker lên VPS.

---

## 1. Hiện tượng (The Symptom)
- Ứng dụng chạy bình thường ở môi trường local (`npm run dev` hoặc `next build && next start`).
- Sau khi deploy bằng Docker lên VPS, trang web tải được nội dung (text, ảnh) nhưng **không có bất kỳ style CSS nào**.
- Kiểm tra mã nguồn trang (View Source) hoặc Network tab trong Browser, file CSS vẫn tồn tại nhưng nội dung bên trong chứa các dòng chưa được xử lý như `@import "tailwindcss";` hoặc `@theme`.

## 2. Nguyên nhân gốc rễ (Root Cause)
Lỗi nằm ở file cấu hình chặn file của Docker: **`.dockerignore`**.

### Chi tiết:
1. **Sự phụ thuộc của Tailwind v4**: Khác với các bản cũ, Tailwind v4 tích hợp sâu vào PostCSS. Để build được CSS, công cụ build cần đọc file `postcss.config.mjs` (hoặc `.js`).
2. **Cấu hình `.dockerignore` cũ**: Trong file `.dockerignore` có dòng `*.mjs`. Dòng này ngăn cản Docker copy bất kỳ file nào có đuôi `.mjs` vào môi trường build bên trong container.
3. **Quá trình Build bị thiếu hụt**: Khi lệnh `npm run build` chạy trong Docker:
    - Nó không tìm thấy file `postcss.config.mjs` (vì đã bị ignore).
    - Tailwind engine không được kích hoạt để xử lý file `globals.css`.
    - Kết quả là file CSS xuất ra chỉ là bản copy thô của file gốc, chứa toàn bộ các directive `@import` mà trình duyệt không thể tự hiểu được.

## 3. Cách khắc phục (The Solution)

### Bước 1: Sửa file `.dockerignore`
Cho phép các file cấu hình `.mjs` (như postcss, eslint...) được đi vào môi trường build.

```diff
# .dockerignore
- *.mjs
+ # *.mjs  <-- Comment lại hoặc xóa dòng này
```

### Bước 2: Đảm bảo Dockerfile có đầy đủ file
Trong `Dockerfile`, tại stage `builder`, hãy đảm bảo lệnh `COPY . .` được thực hiện sau khi đã cài đặt dependencies, để các file cấu hình được đưa vào đúng lúc.

```dockerfile
# Dockerfile snippet
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .  # <-- Bước này sẽ copy postcss.config.mjs nếu không bị ignore
RUN npm run build
```

## 4. Bài học kinh nghiệm (Key Takeaways)

1. **Kiểm tra Build Context**: Luôn đảm bảo các file cấu hình quan trọng (`next.config.js`, `postcss.config.js`, `tailwind.config.js`) **KHÔNG** nằm trong danh sách bị chặn của `.dockerignore`.
2. **Tailwind v4 & PostCSS**: Tailwind v4 yêu cầu môi trường build phải có PostCSS plugin hoạt động. Nếu CSS của bạn trông giống hệt file gốc trong `src/app/globals.css` sau khi build, chắc chắn PostCSS đã không chạy.
3. **Phân biệt Local vs Docker**: Khi gặp lỗi "chỉ bị trên Server/Docker", hãy tập trung kiểm tra sự khác biệt giữa các file có mặt ở folder local và các file được thực sự copy vào Docker image.
4. **Sử dụng Standalone Mode**: Khi dùng `output: 'standalone'` trong Next.js, hãy nhớ copy cả thư mục `public` và `.next/static` vào runner image, vì standalone mode mặc định không đi kèm các file tĩnh này.

---
*Tài liệu được biên soạn để phục vụ việc học tập và tra cứu sau này.*
*Ngày cập nhật: 03/04/2026*
