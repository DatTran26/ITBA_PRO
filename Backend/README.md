# Backend — schema contract

`Backend/supabase/migrations` là nguồn DDL trong git. Project production
`itba-ai` (`lhvdtmieaplxzqmpmupe`) và staging `itba-ai-staging`
(`notmderpvbafrucqiylc`) dùng cùng bộ object `public` + Storage buckets.

Đồng bộ object (không phải timestamp trong `schema_migrations`) kiểm tra lần
cuối **2026-09-17**.

`docs/downtown/` không inventory từng bảng; file này và
`docs/_reverse/*/erd.md` là chỗ đọc schema.

## Có gì trong thư mục

| Path | Vai trò |
| --- | --- |
| `supabase/migrations/` | DDL theo timestamp file; apply theo thứ tự tên file |
| `supabase/functions/` | Edge Functions (Deno) |
| `scripts/db/` | Utility kiểm tra cột/user (không phải migration) |
| `.env.example` | Tên biến server-only; không chứa secret |

Không có `config.toml` hay `supabase/schemas/` (declarative).

## Object đã khớp local ↔ live ↔ staging

Cả hai project remote và git đều có **46 bảng `public` (RLS bật)** và **3
Storage buckets**: `candidate-cvs`, `document-sources`, `interview-recordings`.

### Assessment

`tests`, `questions`, `results`, `follow_up_sessions`, `answer_grades`,
`favourite_questions`, `assessment_templates`

### Recruitment

`job_descriptions`, `candidate_cvs`, `job_applications`, `candidate_screenings`,
`candidate_status_history`, `interview_schedules`, `interview_results`,
`interview_sessions`, `interview_session_interviewers`

### Knowledge

`question_bank`, `document_sources`, `document_jobs`, `document_topics`,
`documents`, `skill_documents`, `user_oauth_tokens`

### Talent / CRM

`positions`, `persons`, `skills`, `position_skill_requirements`, `groups`,
`group_members`, `skill_evaluations`, `person_skills`, `notes`, `tags`,
`entity_tags`, `crm_tasks`, `skill_categories`, `level_skill_expectations`

### Platform

`users`, `versions`, `user_version_reads`, `activity_logs`, `system_settings`,
`ai_usage`, `email_provider_config`, `email_templates`, `email_logs`

CREATE còn thiếu trên git trước lần đồng bộ này đã được thêm (idempotent
`IF NOT EXISTS`) và apply lên cả hai project:

| File | Object |
| --- | --- |
| `20260325000000_create_versions_table.sql` | `versions` |
| `20260330500000_drop_stub_notes.sql` | bỏ stub `notes` init nếu chưa có `entity_type` |
| `20260506000000_interview_sessions.sql` | `interview_sessions` + `interview_schedules.session_id` |
| `20260516050000_document_sources_bucket.sql` | bucket `document-sources` |
| `20260524173440_skill_documents.sql` | `skill_documents` |
| `20260524180000_favourite_questions.sql` | `favourite_questions` |
| `20260525100000_rls_auto_enable.sql` | `rls_auto_enable()` + event trigger `ensure_rls` |
| `20260525110000_users_updated_at.sql` | `users.updated_at` |

## Lệch còn lại (cố ý / ngoài schema object)

| Mục | Git | Live + staging |
| --- | --- | --- |
| `20260828000000_lock_public_assessment_access.sql` | Có file | **Chưa apply.** Live vẫn còn policy anon (`tests_select_by_token`, `results_insert_anon`). |
| Edge Function `cv-processor` | Có source | **Chưa deploy.** Remote đang có `extract-document-topics`, `generate-questions-from-doc`. |
| Dòng trong `schema_migrations` | Timestamp = tên file | Dashboard / `apply_migration` dùng timestamp khác. Object giống nhau; lịch sử version **không** 1-1. |

Không apply lock assessment lên production trừ khi có quyết định riêng.

## Migrations đã kiểm chứng ngày 2026-09-17

Cả staging `mqwsulanzahqaiecnfwc` và production
`lhvdtmieaplxzqmpmupe` đã có các object từ:

- `20260917145000_create_internal_user_guard.sql` — chỉ thêm helper role/RLS;
  không thay đổi public assessment access.
- `20260917150000_face_reauth_requests.sql` — face re-auth request + policy.
- `20260917160000_seed_openai_api_key.sql` — write-only OpenAI setting.
- `20260917170000_ai_provider_settings.sql` — AI provider/Gemini settings và
  thay policy select để API key không thể đọc qua role `anon`.
- `20260917180000_face_reauth_active_request_guard.sql` — đảm bảo mỗi tài khoản
  chỉ có một link Face ID re-auth còn hiệu lực tại một thời điểm.

Trước khi áp các migration trên, snapshot custom-format đã được tạo và kiểm
chứng bằng `pg_restore --list` cho từng environment. Production đã được kiểm
tra lại bằng transaction read-only dưới role `anon`: không trả về API-key
settings. Ledger `supabase_migrations` vẫn có thể khác với tên/timestamp file
nguồn; đối chiếu object và policy trước khi replay bất kỳ migration nào.

## Tài liệu liên quan

| Bộ | Path |
| --- | --- |
| Canonical (WHY/WHERE) | `docs/downtown/` |
| Reverse SRS + ERD | `docs/_reverse/` |
| Archive | `docs/archive/itbaai-legacy/` |

## Env (không commit giá trị)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`.
