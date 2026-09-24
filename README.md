# DOWN TOWN — AI HRMS workspace

DOWN TOWN là một repository cho sản phẩm HRMS tích hợp AI. Repository gốc sở
hữu tầm nhìn sản phẩm, quy tắc cộng tác và GitFlow. Source ứng dụng được tách
thẳng tại `Frontend/` và `Backend/` để tiếp tục tích hợp/mở rộng tại đây.

## Thành phần

| Thành phần | Vai trò | Nguồn chuẩn |
| --- | --- | --- |
| Sản phẩm HRMS | Phạm vi, nguyên tắc AI, bảo mật và nghiệp vụ mục tiêu | [`PRODUCT.md`](PRODUCT.md) |
| Frontend ITBAAI | Next.js UI, Server Components và same-origin BFF `/api/*` | [`Frontend/package.json`](Frontend/package.json) |
| Backend ITBAAI | Supabase migrations, RLS, RPC, Storage policies, Edge Functions và DB utilities | [`Backend/`](Backend) |
| Quy trình cộng tác | Nhánh, PR, release và quy tắc dành cho agent | [`AGENTS.md`](AGENTS.md), [`CONTRIBUTING.md`](CONTRIBUTING.md) |
| Bảo mật | Kênh báo cáo và nguyên tắc xử lý secret | [`SECURITY.md`](SECURITY.md) |
| Tài liệu | Điều hướng tài liệu hiện hành, lịch sử và tài liệu nhập | [`docs/README.md`](docs/README.md) |

Git status, diff, commit và release đều thuộc repository DOWN TOWN; không tạo
nested Git trong `Frontend`/`Backend` và phải tránh stage `.env*`, build output
hoặc thay đổi không liên quan.

## GitFlow của repository gốc

```text
develop-<name> -> PR -> develop -> release/x.y.z -> main
```

- Nhánh cá nhân: `develop-dat`, `develop-hieu`, `develop-kien`, `develop-thanh`.
- Feature mới có thể bắt đầu từ `develop` dưới dạng `feature/<slug>` hoặc từ
  nhánh cá nhân.
- Nhánh cá nhân và feature chỉ mở PR vào `develop`.
- Release được cắt từ `develop`, sau đó hợp nhất vào `main`.
- Hotfix bắt đầu từ `main`.

Chi tiết và fallback tooling nằm trong [`AGENTS.md`](AGENTS.md).

## Bắt đầu

1. Đọc [`PRODUCT.md`](PRODUCT.md) để hiểu phạm vi HRMS tổng thể.
2. Đọc [`docs/README.md`](docs/README.md) để chọn đúng nguồn tài liệu.
3. Khi phát triển web app, chuyển vào `Frontend`; khi làm schema/RLS/Edge
   Functions hoặc DB utilities, dùng `Backend`.
4. Để chạy container: copy `.env.example` (repo root) sang `.env`, rồi xem
   [`docs/downtown/operations.md`](docs/downtown/operations.md).
5. Kiểm tra `git status` ở repo gốc trước khi thay đổi.

Repository gốc phát hành theo giấy phép [`MIT`](LICENSE).
