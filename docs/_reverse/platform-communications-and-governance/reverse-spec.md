# Reverse SRS — Platform, communications và governance

## Scope

✅ Cluster gồm authentication/session routing, role-aware navigation, user admin,
system settings, AI usage, email templates/SMTP/send/logs, activity logs và app
version announcements. Đây là cross-cutting platform layer cho các domain khác.

## Actors

- Anonymous user: login/reset-password và public test entry.
- Authenticated user: dashboard/profile/version notifications.
- HR/recruiter/interviewer: domain email actions theo role matrix.
- Admin/super admin: user, settings, SMTP, templates và version governance.
- External providers: Supabase Auth, SMTP và AI providers.

## Functional requirements

- **FR-PL-01 ✅** Middleware refresh session, chuyển unauthenticated dashboard
  request về login và giới hạn một số route theo role
  (`Frontend/src/middleware.ts:4`, `:59`, `:67`).
- **FR-PL-02 ✅** System settings GET mask secret-like values trước khi trả và PATCH
  update setting (`Frontend/src/app/api/settings/route.ts:11`, `:22`, `:40`).
- **FR-PL-03 ✅** Email module hỗ trợ template, recipient lookup, single/bulk send,
  SMTP config/test và logs (`Frontend/src/app/api/emails/templates/route.ts:4`,
  `Frontend/src/app/api/emails/send/route.ts:51`,
  `Frontend/src/app/api/emails/send-bulk/route.ts:31`,
  `Frontend/src/app/api/emails/logs/route.ts:6`).
- **FR-PL-04 ✅** SMTP password được gửi vào RPC encryption và public read không
  trả plaintext (`Frontend/src/app/api/emails/smtp-config/route.ts:46`,
  `Backend/supabase/migrations/20260502000001_email_smtp_helpers.sql:4`).
- **FR-PL-05 ✅** Super admin tạo/cập nhật/xoá draft version; user đọc notification
  approved và ghi read markers (`Frontend/src/app/api/versions/route.ts:17`,
  `:66`, `:156`, `Frontend/src/app/api/versions/unread/route.ts:4`, `:39`).
- **FR-PL-06 ✅** Activity log API đọc `activity_logs`; DB layer có RLS
  (`Frontend/src/app/api/activity-logs/route.ts:4`,
  `Backend/supabase/migrations/20260331000000_crm_layer_schema.sql:88`, `:98`).

## Architecture boundary

- `Frontend` là Next.js deployable, gồm browser UI, Server Components và same-origin
  BFF `/api/*`; tên Frontend không đồng nghĩa browser-only.
- `Backend` là Supabase platform: migrations, RLS, RPC, storage policy và Edge
  Functions. DB utilities nằm tại `Backend/scripts/db` và không chạy tự động.
- CI/Docker build duy nhất Next image từ `Frontend`; Compose và environment file
  ở application root.

## Security rules

1. `NEXT_PUBLIC_*` có thể xuất hiện trong browser bundle; service-role, DB, SMTP
   master key và AI secret chỉ server/runtime.
2. Middleware/UI role check không thay authorization trong BFF và RLS.
3. Email recipient/template variables phải được validate và delivery được log.
4. AI usage/output phải parse, redact và không tự quyết định nhân sự cuối.
5. Version/audit records là governance evidence, không phải executable release.

## Open questions

- **OQ-PL-01:** Role/permission matrix chính thức cho từng route là gì?
- **OQ-PL-02:** SMTP key rotation và credential recovery procedure là gì?
- **OQ-PL-03:** Email retry/idempotency/bounce handling/SLA được yêu cầu ra sao?
- **OQ-PL-04:** Activity log retention, PII redaction và tamper resistance là gì?
- **OQ-PL-05:** Version record liên hệ thế nào với Git tag/image release?
