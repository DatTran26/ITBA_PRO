# Kiến trúc hệ thống ITBAAI

Tài liệu này ghi các boundary và quyết định giúp thay đổi hệ thống an toàn. Chi
tiết endpoint, component, schema và dependency thuộc source/migrations/manifest;
trang này chỉ dẫn tới owner thay vì sao chép inventory dễ lỗi thời.

## Bối cảnh hệ thống

ITBAAI là ứng dụng Next.js App Router phục vụ bốn nhóm tương tác chính:

- Candidate truy cập bài test bằng token công khai và gửi kết quả.
- Recruiter/HR quản lý bài test, ứng viên và recruitment pipeline.
- Interviewer tiếp nhận phiên, đánh giá và dữ liệu phòng phỏng vấn.
- Admin quản lý cấu hình, user, template, version và quan sát usage.

Ứng dụng kết nối Supabase cho Auth/PostgreSQL/RLS/storage/realtime, provider AI
cho sinh/phân tích nội dung và SMTP cho email. Container standalone là artifact
triển khai được tạo từ Dockerfile.

## System context

```text
Browser
  -> Next.js pages/layouts
  -> Route handlers / server boundaries
  -> Domain helpers in src/lib
  -> Supabase Auth + PostgreSQL + Storage
  -> AI providers / SMTP

Supabase Edge Functions
  -> CV processing
  -> document text/topic extraction
  -> question generation from documents
```

Executable owners:

- Web surfaces: [`../src/app`](../src/app)
- Reusable UI: [`../src/components`](../src/components)
- Server/domain helpers: [`../src/lib`](../src/lib)
- Route protection: [`../src/middleware.ts`](../src/middleware.ts)
- Database/RLS: [`../supabase/migrations`](../supabase/migrations)
- Edge functions: [`../supabase/functions`](../supabase/functions)

## Boundary model

### Presentation boundary

Dashboard và public test pages nằm trong `src/app`. Client component chỉ sở hữu
interaction/local UI state; dữ liệu có quyền truy cập phải được kiểm tra lại ở
server/API boundary. Component dùng chung đặt ở `src/components` theo domain.

### HTTP/application boundary

Route handlers trong `src/app/api` là boundary cho request, auth, validation và
response. Handler nên điều phối; logic có thể tái sử dụng thuộc module tương ứng
trong `src/lib`. Không tin request body, params, query hoặc AI/provider payload
trước khi parse/validate.

### Data boundary

Supabase clients được tách theo ngữ cảnh tại `src/lib/supabase`:

- Client/browser dùng anon key và session của user.
- Server dùng cookie/session để thực thi dưới danh tính user.
- Admin/service-role chỉ dùng ở server boundary cho tác vụ thực sự cần bypass
  RLS; không được bundle hoặc gửi xuống browser.

Migrations là nguồn chuẩn của schema/RLS. Không duy trì danh sách bảng thủ công
trong docs. Mọi schema change phải thêm migration mới và có kế hoạch rollback/
backup phù hợp với môi trường.

### External provider boundary

- AI: route/helper chịu trách nhiệm chọn provider/model, giới hạn input, parse
  structured output, xử lý timeout/error và log usage phù hợp.
- Email: `src/lib/email` sở hữu render, credential use và send behavior; UI/API
  không tự dựng một SMTP path riêng.
- File/document: upload phải kiểm tra type/size/access trước khi parse hoặc gửi
  sang Edge Function/AI.

Provider output không phải domain truth. Kết quả AI phải có trạng thái đề xuất,
evidence khi phù hợp và đường cho con người review/override.

## Domain boundaries

### Assessment

Owner nằm tại dashboard/tests, public `test/[token]`, APIs tests/results,
`src/lib/grading` và migrations core/results. Token public cho phép vào đúng bài
test được chia sẻ; không được mở rộng thành quyền đọc dữ liệu recruiter.

### Recruitment

Owner nằm tại dashboard/API recruitment, `src/lib/recruitment`, recruitment
migrations và `supabase/functions/cv-processor`. State transition phải qua rule
tập trung (xem `src/lib/recruitment/state-machine.ts`) để UI/API không định nghĩa
workflow khác nhau.

### Talent and CRM

Persons, positions, skills và groups chia sẻ UI primitives trong
`src/components/crm`/`management` nhưng vẫn giữ API và validation theo resource.
Scoring là derived data; source facts và override của người dùng phải truy nguyên
được.

### Question bank và Document AI

Owner nằm tại dashboard/API question-bank/documents/document-sources,
`src/lib/document-parsing`, document migrations và Edge Functions. Raw file,
extracted text, topic và generated question là các stage khác nhau; không ghi đè
provenance giữa các stage.

### Email

Owner nằm tại dashboard/API emails, `src/lib/email` và email migrations. SMTP
credential là secret server-side. Log delivery là audit/operation record, không
được chứa credential hay nội dung nhạy cảm vượt nhu cầu.

## Identity, authorization và trust

1. Middleware cung cấp route-level protection/refresh session, không thay thế
   authorization ở API/data layer.
2. API xác định auth context bằng helper hiện có và kiểm tra role/scope cho hành
   động tương ứng.
3. RLS là lớp bảo vệ dữ liệu cuối cùng cho access qua Supabase user client.
4. Service-role bypass RLS nên được giới hạn ở server-only module và action cụ
   thể, với validation/audit tương ứng.
5. Public token, file upload, AI output, email variables và provider response là
   untrusted boundary.

Security reporting và secret policy: [`../SECURITY.md`](../SECURITY.md).

## Data flows quan trọng

### Tạo và làm bài test

```text
Recruiter UI -> tests API -> tests/questions/instructions
Candidate token -> public test page -> results API -> result/answers
Result -> grading + optional AI analysis -> recruiter review
```

Invariant: candidate không cần tài khoản cho link public, nhưng token chỉ cấp
khả năng cần thiết cho bài test; ownership của recruiter vẫn được enforce ở các
API quản trị.

### CV và recruitment

```text
Upload -> storage/source record -> extraction/scoring -> application
application -> validated state transition -> interview/offer/onboarding records
```

Invariant: AI score không tự động trở thành quyết định tuyển dụng cuối cùng;
override của HR phải giữ lý do và audit trail khi contract domain yêu cầu.

### Document-to-question

```text
Document -> extracted text -> topics -> human review/merge/split
         -> generation job -> question bank -> test composition
```

Invariant: generated question phải giữ reference về source/topic để review và
truy nguyên.

## Runtime và deployment artifacts

- Next.js được build ở chế độ `standalone` theo [`../next.config.ts`](../next.config.ts).
- [`../Dockerfile`](../Dockerfile) tạo image nhiều stage và chạy non-root.
- [`.gitlab-ci.yml`](../.gitlab-ci.yml) là pipeline legacy từ thời app còn là
  repository riêng. Sau khi tích hợp single-repo, file nằm dưới thư mục app nên
  GitLab không tự discovery như root pipeline; các path/working directory và
  branch filter cũng chưa khớp GitFlow hiện tại.
- [`../docker-compose.yml`](../docker-compose.yml) chạy container trên port 3000.

Runbook và trạng thái wiring: [`deployment-guide.md`](deployment-guide.md).
Docker artifacts có thể build thủ công, nhưng chưa có production deployment
automation được xác minh sau khi nhập source vào root repo.

## Observability và audit

Operational logging, AI usage, email logs và recruitment activity logs phục vụ
những mục tiêu khác nhau. Không dùng application log thay audit record. Log phải
tránh secret/credential và dữ liệu cá nhân không cần thiết; action quan trọng
cần đủ actor, target, outcome và timestamp để điều tra.

## Quy tắc thay đổi kiến trúc

- Thêm boundary/module mới chỉ khi concern có owner và lifecycle riêng.
- Tránh gọi Supabase/provider trực tiếp rải rác nếu helper domain đã tồn tại.
- Contract public hoặc schema change phải cập nhật validation và tài liệu owner.
- Quyết định bền vững có trade-off nên ghi một lần trong `docs/decisions`.
- Không cập nhật tài liệu này bằng inventory thủ công; thêm pointer tới owner.
