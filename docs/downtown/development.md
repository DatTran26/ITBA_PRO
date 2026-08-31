---
type: development-guide
status: active
updated: 2026-08-27
links:
  - README.md
  - architecture.md
  - operations.md
  - security.md
---

# Phát triển Town Hown

## Repository contract

Town Hown là single-repo. Source ứng dụng nằm trực tiếp tại `Frontend` và
`Backend`; Git commands, branch và PR thuộc repository root.
Không tạo nested `.git` hoặc GitFlow cạnh tranh.

GitFlow authority: [`../../AGENTS.md`](../../AGENTS.md).

```text
develop-<name> -> PR -> develop -> release/x.y.z -> main
```

- Personal/feature chỉ vào `develop`, không vào `main`.
- Release cắt từ `develop`; hotfix bắt đầu từ `main`.
- Không force-push `main` hoặc `develop`.
- Không trộn thay đổi không liên quan hoặc secret vào commit.

## Bắt đầu local

```powershell
Set-Location Frontend
npm ci
npm run dev
```

Mở `http://localhost:3000`. Project không version-control secret. Copy `Frontend/.env.example` và
`Backend/.env.example` sang `.env.local`/`.env` (đã gitignore) rồi điền value
qua kênh của đội.

Source hiện dùng các tên cấu hình chính:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL` khi cần override
- `NEXT_PUBLIC_APP_URL` khi cần URL tuyệt đối

Không ghi value vào docs/log. Prefix `NEXT_PUBLIC_*` đồng nghĩa value có thể xuất
hiện ở client bundle, nên không đặt secret vào đó.

## Lệnh được xác minh

```powershell
npm run dev
npm run lint
npm run build
npm start
```

Manifest hiện không có `npm test`. Entry `npm run version` trỏ tới script không
tồn tại và không được dùng cho đến khi task config riêng sửa owner đó.

## Tìm đúng owner

```powershell
rg --files Frontend/src/app
rg -n "search-term" Frontend/src Backend/supabase
rg --files Frontend/src/app/api -g "route.ts"
rg -n "entity_or_policy" Backend/supabase/migrations
```

Đọc [Architecture](architecture.md) trước khi tạo module hoặc đi vòng boundary.

## Quy tắc code

### TypeScript

- Giữ `strict: true`; unknown input bắt đầu từ `unknown`, không dùng `any` để bỏ
  parse/validation.
- Shared type chỉ đưa vào `Frontend/src/types` khi có nhiều consumer thật.
- Dùng alias `@/*` cho import từ `src`; import gần module có thể dùng relative.
- Tôn trọng convention folder; file mới ưu tiên kebab-case khi chưa có convention
  mạnh hơn.

### React/Next.js

- Server Component là mặc định; `use client` chỉ khi cần interaction/browser API/
  client hook/local state.
- Dữ liệu nhạy cảm được fetch/filter ở server boundary; không truyền toàn row
  xuống client vì tiện.
- Reuse primitives ở `Frontend/src/components/ui` và domain component trước khi tạo mới.
- Cleanup timer/listener/realtime subscription; tránh channel trùng do dependency
  không ổn định.
- UI cần loading, empty, error, keyboard/focus và responsive behavior phù hợp.

### API

Route handler thực hiện theo thứ tự:

1. Parse body/params/query.
2. Xác định auth context.
3. Kiểm tra role, ownership và scope.
4. Gọi helper/domain owner.
5. Map response/error mà không lộ nội bộ.
6. Ghi audit/usage khi business contract yêu cầu.

Middleware hoặc việc UI ẩn control không thay API authorization và RLS.

### Database/Supabase

- Dùng đúng browser/server/admin client trong `Frontend/src/lib/supabase`.
- Service role chỉ server-side cho action đã authorize cụ thể.
- Schema/RLS/index/function change phải có migration mới.
- Backup và xác minh target trước mọi schema/data change trên môi trường thật.
- Không sửa migration đã apply trên shared environment nếu chưa có strategy.
- List query cần scope/filter/pagination; không tải hết rồi lọc quyền ở client.

### AI, email và file

- AI/provider response phải parse/validate và có timeout/error path.
- Không để AI tự quyết định tuyển dụng/kỷ luật.
- SMTP credential và AI key chỉ server-side.
- Template variables/recipient/file type/size/access phải validate ở boundary.
- Raw document, extracted text, topic và generated artifact giữ provenance riêng.

## Pattern bắt buộc

- Recruitment transition đi qua state-machine owner, không copy list transition.
- Optimistic UI phải rollback/reconcile; không dùng cho decision/delivery quan
  trọng khi server confirmation là contract.
- Derived score recompute từ source facts; không patch nhiều bản sao aggregate.
- Fire-and-forget chỉ cho side effect có thể mất mà không làm response sai.
- CSV/PDF export chỉ chứa field đã authorize và escape dữ liệu user-controlled.

## Validation ladder

1. Chạy check hẹp nhất cho behavior thay đổi.
2. Chạy `npm run lint`.
3. Chạy `npm run build` khi shared/public contract thay đổi.
4. API: kiểm tra success, malformed input, unauthenticated, forbidden và owner.
5. UI: loading/empty/error, keyboard và responsive khi liên quan.
6. Migration: apply trên disposable/staging, kiểm RLS và rollback/forward-fix.
7. Provider: malformed output, timeout, partial failure và redacted logs.

Không tuyên bố test đã chạy nếu project chưa có runner. Ghi đúng manual/focused
validation thực tế.

## Review checklist

- Thay đổi đúng owner và scope chưa?
- Input/auth/authorization đã enforce ở server/data boundary chưa?
- Client/log/export có secret hoặc dữ liệu vượt nhu cầu không?
- Schema change có migration, backup, RLS và recovery plan chưa?
- AI/provider failure có an toàn và review path không?
- Audit và operational log có đúng mục đích không?
- Contract user/setup/security có cần cập nhật không?
- Validation report có phản ánh đúng những gì đã chạy không?

## Generated/local state không được stage

- `.env*`
- `Frontend/.next`
- `*.tsbuildinfo`
- `Backend/supabase/.temp`

Application `.gitignore` ignore toàn bộ nhóm generated/local state trên.
