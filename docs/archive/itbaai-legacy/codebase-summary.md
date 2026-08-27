# Bản đồ codebase ITBAAI

Trang này giúp tìm đúng owner; nó không duy trì số lượng file, route, component,
LOC hoặc table. Dùng `rg --files` và source tree khi cần inventory tại thời điểm
thực hiện.

## Entry points

| Mục đích | Vị trí |
| --- | --- |
| Root layout và global CSS | `src/app/layout.tsx`, `src/app/globals.css` |
| Landing/login/reset | `src/app/page.tsx`, `src/app/login`, `src/app/reset-password` |
| Authenticated shell | `src/app/dashboard/layout.tsx`, dashboard shell/nav components |
| Public assessment | `src/app/test/[token]` |
| API routes | `src/app/api/**/route.ts` |
| Route protection | `src/middleware.ts` |
| Runtime configuration | `package.json`, `tsconfig.json`, `next.config.ts` |

## Source ownership

```text
src/
├── app/          Next.js pages, layouts, route handlers và server actions
├── components/   UI primitives và component theo domain
├── hooks/        Client hooks/realtime/update watchers
├── lib/          Server/domain helpers và provider adapters
├── types/        Shared TypeScript contracts
└── middleware.ts Session refresh và route-level protection
```

### `src/app`

- `dashboard`: authenticated product surfaces.
- `test/[token]`: candidate-facing public assessment.
- `api`: HTTP boundaries theo resource/domain.
- `actions`: server actions có phạm vi cụ thể.

Không suy ra quyền truy cập từ vị trí UI; kiểm tra route handler, auth helper và
RLS owner của luồng.

### `src/components`

- `ui`: primitives/shell/status/layout dùng chung.
- `dashboard`: dashboard composition và metrics.
- `crm`, `management`, `evaluation`: talent/assessment building blocks.
- `recruitment`, `question-bank`, `tests`, `shares`: domain components.

Trước khi tạo component mới, tìm owner gần nhất và reuse primitive hiện có.

### `src/lib`

- `supabase`: browser/server/admin clients.
- `api`: auth và request helpers.
- `recruitment`: state machine và recruitment logic.
- `grading`: score recomputation/manual grading.
- `email`: render, recipient/config, SMTP send.
- `document-parsing`: file/text parsing boundary.
- `crm`, `settings`, `export`, `ui`: helpers theo concern.
- Các file `ai-*`/`get-ai-config`: provider configuration, analysis và usage.

Logic dùng bởi nhiều route/UI nên được đặt tại module sở hữu concern, không copy
giữa handlers.

## Data và backend services

```text
supabase/
├── migrations/  schema, indexes, functions, storage/RLS changes
└── functions/   deployable Edge Functions
```

Migrations là lịch sử tiến hoá schema, không phải tutorial. Khi cần hiểu bảng/
policy, đọc migration tạo ban đầu và các migration sửa đổi tiếp theo bằng search
theo tên entity.

Edge Functions hiện được tổ chức theo CV processing và document-to-question
pipeline. Mỗi function có runtime/config riêng; không giả định Node/Next.js API
và Deno Edge Function dùng chung dependency/runtime behavior.

## Configuration và operations

| File | Sở hữu |
| --- | --- |
| `package.json` / lockfile | dependency và lệnh npm |
| `next.config.ts` | Next.js standalone/image/build behavior |
| `eslint.config.mjs` | lint policy |
| `Dockerfile` | production image |
| `docker-compose.yml` | container runtime contract |
| `.gitlab-ci.yml` | build/deploy pipeline của app repo |
| `.gitignore` | local/generated/secret exclusions |

## Cách tìm nhanh

```powershell
# Tìm page/API owner
rg --files src/app

# Tìm nơi một entity hoặc env key được sử dụng
rg -n "search-term" src supabase

# Liệt kê route handlers tại thời điểm hiện tại
rg --files src/app/api -g "route.ts"

# Tìm migration liên quan tới entity/policy
rg -n "entity_name|policy_name" supabase/migrations
```

## Tài liệu liên quan

- Boundary và data flow: [`system-architecture.md`](system-architecture.md)
- Product/domain intent: [`project-overview-pdr.md`](project-overview-pdr.md)
- Coding rules: [`code-standards.md`](code-standards.md)
- Accepted patterns: [`code-patterns.md`](code-patterns.md)
