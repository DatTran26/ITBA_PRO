# Sources — Platform, communications và governance

- `Frontend/src/middleware.ts:4` — session middleware.
- `Frontend/src/middleware.ts:67` — role-aware route filtering.
- `Frontend/src/app/api/settings/route.ts:11` — settings read.
- `Frontend/src/app/api/settings/route.ts:22` — masked response.
- `Frontend/src/app/api/emails/send/route.ts:51` — send.
- `Frontend/src/app/api/emails/send-bulk/route.ts:31` — bulk send.
- `Frontend/src/app/api/emails/smtp-config/route.ts:46` — password encryption call.
- `Frontend/src/app/api/versions/route.ts:17` — version create.
- `Frontend/src/app/api/versions/unread/route.ts:39` — read marker.
- `Frontend/src/app/api/activity-logs/route.ts:4` — activity read.
- `Backend/supabase/migrations/20260502000000_email_templates_smtp.sql:27` — templates.
- `Backend/supabase/migrations/20260502000000_email_templates_smtp.sql:64` — email RLS.
- `Backend/supabase/migrations/20260329000000_admin_role_and_version_management.sql:24` — settings RLS.
- `Backend/supabase/migrations/20260325000000_create_versions_table.sql:4` — versions.
- `Backend/supabase/migrations/20260525100000_rls_auto_enable.sql:1` — auto-RLS trigger.
- `Backend/supabase/migrations/20260525110000_users_updated_at.sql:1` — `users.updated_at`.
- `.gitlab-ci.yml:14` — Frontend manifest version.
- `Frontend/Dockerfile:21` — lockfile-first build.
