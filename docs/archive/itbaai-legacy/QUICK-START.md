# Quick start

## Developer

1. Đọc [`../README.md`](../README.md) và [`../AGENTS.md`](../AGENTS.md).
2. Kiểm tra `git status --short --branch` trong repo ứng dụng.
3. Nhận secret development qua kênh của đội; không copy vào docs/chat.
4. Chạy:

   ```powershell
   npm ci
   npm run dev
   ```

5. Trước bàn giao: `npm run lint` và `npm run build` nếu thay đổi cho phép.

## Product/BA

- Tầm nhìn HRMS tổng thể: [`../../PRODUCT.md`](../../PRODUCT.md)
- Boundary ITBAAI: [`project-overview-pdr.md`](project-overview-pdr.md)
- Raw requirements theo phase: [`../../HRMS_He_thong_quan_ly_nhan_su.md`](../../HRMS_He_thong_quan_ly_nhan_su.md)
- Plans/reports chỉ là hồ sơ theo thời điểm, không thay source truth.

## Engineer/architect

- Bản đồ owner: [`codebase-summary.md`](codebase-summary.md)
- Boundary/data flow: [`system-architecture.md`](system-architecture.md)
- Quy tắc code/review: [`code-standards.md`](code-standards.md)
- Pattern: [`code-patterns.md`](code-patterns.md)

## DevOps (artifact hiện có, CI chưa nối)

- Pipeline legacy cần rewiring/hardening: [`.gitlab-ci.yml`](../.gitlab-ci.yml)
- Image/runtime: [`../Dockerfile`](../Dockerfile),
  [`../docker-compose.yml`](../docker-compose.yml)
- Runbook: [`deployment-guide.md`](deployment-guide.md)

## Cần tìm tài liệu khác

Quay về [`README.md`](README.md). Đây là index duy nhất; file
`DOCUMENTATION-INDEX.md` chỉ giữ redirect tương thích.
