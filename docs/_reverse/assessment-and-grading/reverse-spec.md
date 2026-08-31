# Reverse SRS — Assessment và grading

## Mục tiêu và phạm vi

✅ Hệ thống cho phép người có quyền tạo/quản lý bài đánh giá, chia sẻ bài qua
token, nhận bài làm, tự chấm câu khách quan, chờ chấm câu thủ công và quản lý
follow-up session. BFF Next.js giữ contract `/api/*`; Supabase giữ dữ liệu và
RLS.

Ngoài phạm vi đã chứng minh: proctoring, chống gian lận, ngân hàng rubric được
phê duyệt, SLA chấm bài và certification.

## Actors

| Actor | Hành vi có bằng chứng |
| --- | --- |
| Recruiter/admin | Tạo, sửa, xoá test; xem result; chấm manual answer |
| Candidate | Mở bài bằng share token và submit answers |
| AI provider | Phân tích result/sinh follow-up; output cần human review |
| Supabase | Persist test, question, result, grade và enforce RLS |

## Functional requirements tái lập

- **FR-AS-01 ✅** API tests hỗ trợ list/create/update/delete và sinh
  `share_token` khi tạo (`Frontend/src/app/api/tests/route.ts:9`, `:49`, `:124`,
  `:197`, `:220`).
- **FR-AS-02 ✅** Test detail trả questions và results liên quan
  (`Frontend/src/app/api/tests/[id]/route.ts:4`, `:13`).
- **FR-AS-03 ✅** Submission phân loại câu manual, tự chấm câu còn lại và đặt
  `grading_status` (`Frontend/src/app/api/results/route.ts:66`, `:73`, `:82`).
- **FR-AS-04 ✅** Manual answers được ghi thành overlay rows chờ chấm
  (`Frontend/src/app/api/results/route.ts:108`).
- **FR-AS-05 ✅** Chấm một manual answer phải recompute score từ một owner duy
  nhất (`Frontend/src/app/api/results/[id]/grade/route.ts:7`,
  `Frontend/src/lib/grading/recompute-result-score.ts:15`).
- **FR-AS-06 ✅** Score bằng auto-correct cộng manual-pass; status phụ thuộc số
  grade còn thiếu (`Frontend/src/lib/grading/recompute-result-score.ts:29`,
  `:36`, `:39`, `:42`).
- **FR-AS-07 ✅** Follow-up session hỗ trợ read/update/delete
  (`Frontend/src/app/api/followup-sessions/[id]/route.ts:8`, `:39`, `:78`).

## Data và authorization

✅ Các bảng gốc là `tests`, `questions`, `results`; submission/result có policy
riêng (`Backend/supabase/migrations/20260310000000_init_schema.sql:27`, `:55`,
`:78`, `:94`). Manual grades và follow-up sessions là bảng có RLS
(`Backend/supabase/migrations/20260525000000_manual_grading.sql:11`, `:26`;
`Backend/supabase/migrations/20260319000000_follow_up_sessions.sql:6`, `:16`).

## Business rules

1. Manual question không được tính đúng/sai khi submit; grade quyết định sau.
2. Score derived phải recompute, không patch độc lập ở nhiều nơi.
3. Share token là public entry point nhưng không đồng nghĩa mọi field của test
   được public.
4. 🟡 AI analysis/follow-up là tư vấn, không phải quyết định tuyển dụng cuối.

## Observed security/contract risks

- ✅ Public test loader select full question records và base policy cho phép public
  select; cần loại `correct_answer` khỏi browser contract
  (`Frontend/src/app/test/[token]/page.tsx:75`,
  `Backend/supabase/migrations/20260310000000_init_schema.sql:73`).
- ✅ Submission dùng admin/service boundary và validation hiện chưa chứng minh
  server-side schedule, capacity hay unique attempt trước insert
  (`Frontend/src/app/api/results/route.ts:10`, `:121`).

## Non-functional requirements quan sát được

- Build production phải nhận toàn bộ assessment pages và route handlers.
- Secret/service-role chỉ chạy server-side.
- Mọi thay đổi schema phải qua migration; không chạy DB utilities trong build.

## Open questions

- **OQ-AS-01:** Share token có expiry/revocation/attempt limit chính thức không?
- **OQ-AS-02:** Rubric manual grading và quyền re-grade được phê duyệt thế nào?
- **OQ-AS-03:** Candidate có được xem correct answer/explanation sau submit không?
- **OQ-AS-04:** Score threshold nào dẫn đến pass/fail và ai có quyền override?
- **OQ-AS-05:** Có bắt buộc một attempt/token/person và server-enforced timing không?
