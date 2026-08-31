# Agent instructions — ITBAAI

Các quy tắc này áp dụng khi làm việc trong repository ứng dụng
`learning-and-testing-system`.

## Trước khi thay đổi

1. Đọc [`README.md`](README.md) và [`docs/README.md`](docs/README.md).
2. Kiểm tra `git status --short --branch` từ repo gốc. Ứng dụng là một phần của
   repository Town Hown, không có Git history độc lập.
3. Đọc tài liệu sở hữu domain cần sửa; dùng source, migration, manifest và CI
   làm bằng chứng cho hành vi thực tế.
4. Không đọc hoặc đưa giá trị từ `.env`, `.env.local` vào output/tài liệu.

## Quy tắc triển khai

- Giữ TypeScript strict và alias `@/*` theo [`Frontend/tsconfig.json`](Frontend/tsconfig.json).
- API/auth/data access phải theo helper hiện có trong `Frontend/src/lib` và boundary gần
  nhất; không tạo lớp song song nếu module hiện hành đã sở hữu concern đó.
- Database change phải có migration mới trong `Backend/supabase/migrations`; backup dữ
  liệu trước mọi thay đổi schema/data trên môi trường thật.
- AI output là dữ liệu không đáng tin cho đến khi được parse/validate. Không để
  AI tự ra quyết định nhân sự cuối cùng.
- Không commit secret, `.env*`, `.next`, build output hoặc Supabase temp state.
- Chỉ cập nhật docs khi thay đổi user-visible behavior, setup, command,
  configuration, architecture, security hoặc public contract.

## Validation

- Chạy check hẹp nhất liên quan tới thay đổi trước.
- Các lệnh frontend được khai báo tại [`Frontend/package.json`](Frontend/package.json).
- Repository hiện không khai báo `npm test`; không mô tả test command không tồn
  tại. Khi thiếu automated test, ghi rõ validation thực tế đã chạy.
- Không dùng `npm run version`: manifest đang trỏ tới script không tồn tại.
- Với thay đổi shared/public contract, chạy `npm run lint` và `npm run build`
  nếu môi trường cho phép.

## Tài liệu và hồ sơ

- [`docs/README.md`](docs/README.md) là index tài liệu ứng dụng duy nhất.
- `docs/decisions` lưu quyết định bền vững.
- `plans` và `plans/reports` là hồ sơ theo thời điểm, không phải nguồn evergreen.
- Harness CLI không tồn tại trong working tree hiện tại; không coi các tài liệu
  Harness là quy trình bắt buộc cho đến khi binary/tooling được phục hồi và xác
  minh.
- Không stage generated state trong `Backend/supabase/.temp`.

GitFlow của repository được định nghĩa tại [`../AGENTS.md`](../AGENTS.md). Không
tự ý tạo chính sách nhánh cạnh tranh cho thư mục ứng dụng.
