# Báo cáo chuẩn hoá tài liệu Town Hown

## Kết quả

Đã thiết lập một tuyến tài liệu canonical cho repository Town Hown và source ứng
dụng `learning-and-testing-system`. Tài liệu hiện phân biệt rõ:

- tầm nhìn HRMS mục tiêu;
- phân hệ ITBAAI đang có source;
- executable truth trong source/config/migrations/CI;
- tài liệu evergreen;
- raw requirements, Harness, roadmap, plans và reports theo thời điểm;
- snapshot/import `ITBA_docs`.

Không thay đổi product code, schema, CI hoặc dữ liệu.

## Quyết định được áp dụng

### Single repository

Người dùng xác nhận đã xoá `.git` bên trong `learning-and-testing-system` để tích
hợp source lên Town Hown. Tài liệu đã được cập nhật theo mô hình single-repo:

- GitFlow gốc áp dụng cho toàn bộ source.
- Không còn hướng dẫn commit/release từ nested repository.
- `.gitignore` trong thư mục ứng dụng vẫn bảo vệ `.env*`, `.next` và
  `*.tsbuildinfo` khi Git quét từ root.

### Product boundary

- `PRODUCT.md` là product target của HRMS tổng thể.
- ITBAAI là phân hệ tuyển dụng/assessment đang được triển khai.
- `HRMS_He_thong_quan_ly_nhan_su.md` là raw requirements provenance, không phải
  implementation status.

### Documentation authority

- `docs/README.md` là router cấp repository.
- `learning-and-testing-system/docs/README.md` là index duy nhất của ứng dụng.
- Manifest/source/migrations/CI sở hữu WHAT/HOW.
- Docs sở hữu WHY/WHERE, terminology, boundary và constraint.
- `DOCUMENTATION-INDEX.md` được giữ như redirect tương thích, không còn là index
  cạnh tranh.

### Archive và history

- `ITBA_docs` được gắn nhãn archive/import; không xoá để bảo toàn plans/reports
  và nội dung provenance duy nhất.
- Harness docs được gắn nhãn inactive vì binary được mô tả không tồn tại.
- Roadmap, note, story/backlog và milestone được gắn nhãn stateful/historical.
- Broken link trong historical records được giữ nguyên khi target đã mất, thay
  vì viết lại lịch sử theo cấu trúc source hiện tại.

## Tài liệu canonical đã chuẩn hoá

### Repository root

- `README.md`: component map, single-repo boundary và GitFlow.
- `docs/README.md`: tuyến tài liệu và maintenance rules.
- `PRODUCT.md`: phân biệt product target với implemented subsystem.
- `HRMS_He_thong_quan_ly_nhan_su.md`: provenance banner.

### Application entry và governance

- `learning-and-testing-system/README.md`: scope, source owners, setup, env names,
  lệnh project và repository boundary.
- `learning-and-testing-system/AGENTS.md`: quy tắc làm việc, security boundary và
  validation thực sự tồn tại.
- `learning-and-testing-system/SECURITY.md`: reporting, secret handling và trust
  boundaries; loại bỏ bảng supported version mẫu.

### Product, architecture và source map

- `docs/project-overview-pdr.md`: users, domain lifecycle, AI/data constraints và
  cách chứng minh implementation.
- `docs/system-architecture.md`: system context, domain/data/provider boundaries,
  trust model, data flows, deployment và observability.
- `docs/codebase-summary.md`: source navigation không dùng file/route/LOC counts.
- `docs/ARCHITECTURE.md`: đổi thành redirect/reference cho Harness template cũ.

### Development và operations

- `docs/code-standards.md`: TypeScript/React/API/Supabase/AI/email/file/security
  rules và validation ladder.
- `docs/code-patterns.md`: auth context, state machine, optimistic rollback,
  provider parsing, score recompute, email, document provenance, audit/realtime,
  CSV/PDF patterns.
- `docs/deployment-guide.md`: GitLab -> image -> VPS path, local setup, env
  boundary, migrations, container, CI, smoke, rollback và troubleshooting.
- `docs/troubleshooting-vps-cloudflare-nextjs-standalone.md`: canonical runbook
  mới theo port/config hiện tại.
- `docs/QUICK-START.md`: role-based short route.
- `docs/version-management-policy.md`: SemVer/GitFlow và CI branch mismatch.

## Drift đã sửa

- Bỏ claim Next.js 15/15.1.11 và version 1.6.2 khỏi tuyến canonical; manifest sở
  hữu dependency/version.
- Bỏ manual counts về source files, routes, pages, tables, migrations và LOC.
- Bỏ tỷ lệ “100%”, “complete/current” và reading-time/status table không có bằng
  chứng máy kiểm tra.
- Bỏ hướng dẫn `npm test` vì manifest không có test script.
- Bỏ setup phụ thuộc `.env.example` của app vì file không tồn tại.
- Thay license “Proprietary” mẫu bằng security/license route phù hợp MIT của repo
  gốc; bản cũ chỉ còn trong archive đã gắn nhãn.
- Loại Harness CLI khỏi agent workflow vì binary không tồn tại.
- Xác định Dockerfile/compose là executable artifact owners. GitLab/VPS pipeline
  chỉ là legacy reference, chưa được discovery/wire từ root single-repo; Vercel
  và self-hosted Supabase cũng chưa được chọn làm production authority.
- Ghi rõ CI legacy sai repository working directory, lọc `release` thay vì
  `release/x.y.z`, và chưa đạt yêu cầu SSH/secret handling.
- Ghi rõ `npm run version` đang trỏ tới script không tồn tại.

## Bằng chứng đã đối chiếu

- `package.json`, lockfile, `tsconfig.json`, `next.config.ts`.
- `src/app`, `src/components`, `src/hooks`, `src/lib`, `src/types`.
- `src/middleware.ts`, Supabase client/auth helpers.
- `supabase/migrations`, `supabase/functions`.
- `Dockerfile`, `docker-compose.yml`, `.gitlab-ci.yml`.
- Root `AGENTS.md`, GitHub workflows và Git status.
- User decision: source app đã bỏ nested `.git` và được tích hợp vào root.

## Validation

- Quét toàn bộ Markdown trong workspace: 319 file tại thời điểm kiểm tra.
- Kiểm tra 27 tài liệu canonical: không có relative link hỏng hoặc code fence lẻ.
- Kiểm tra Markdown ngoài plans/archive: không có broken relative link.
- Kiểm tra Markdown ngoài plans/archive: không có unclosed code fence hoặc
  heading marker thiếu khoảng trắng.
- Quét stale canonical claims: không còn Next.js 15.1.11, version 1.6.2,
  COMPLETE/CURRENT, proprietary license hoặc “no application code”.
- Xác minh `.env`, `.env.local`, `.next` và `*.tsbuildinfo` được ignore bởi
  `learning-and-testing-system/.gitignore` từ repository root.
- Không có docs validator/markdownlint/prettier binary trong project; validation
  dùng read-only link/fence/heading/claim scans.
- Không chạy lint/build vì thay đổi chỉ thuộc Markdown và không thay executable
  contract.

## Historical link debt

Phát hiện 102 relative link hỏng trong `plans`, `plans/reports` và
`ITBA_docs` historical records. Không tự sửa vì nhiều target là source/phase cũ
đã bị rename hoặc chưa từng được đưa vào snapshot. Việc sửa sẽ làm sai provenance.
Archive/index banner đã hướng người đọc về canonical docs.

## Rủi ro còn lại

- Toàn bộ `learning-and-testing-system` hiện untracked ở root. Trước commit cần
  review scope/staging kỹ; không dùng bulk staging thiếu kiểm soát.
- `supabase/.temp` chưa được kiểm chứng là ignored trong lần scan; cần tránh stage
  generated Supabase state.
- Dockerfile label vẫn ghi “Next.js 15” dù manifest hiện tại mới hơn; đây là
  config metadata, ngoài phạm vi docs-only và nên sửa trong task code/config riêng.
- GitLab CI legacy chưa được root discovery/include, dùng path giả định app ở
  root, branch filter không khớp và có SSH/secret-handling debt; không được coi
  là production automation.
- `npm run version` không hoạt động vì target script không tồn tại.
- Chưa có automated test runner trong `package.json`.

## Câu hỏi chưa giải quyết

- GitLab/VPS có tiếp tục là production path chính sau khi nhập source vào GitHub
  repo hay cần chuyển CI sang GitHub Actions?
- Có phục hồi Harness tooling hay xoá hẳn bộ Harness design records trong một đợt
  cleanup được phê duyệt riêng?
- Sau khi review provenance, có cho phép xoá duplicate top-level trong
  `ITBA_docs` và chỉ giữ plans/reports/artifacts duy nhất không?
