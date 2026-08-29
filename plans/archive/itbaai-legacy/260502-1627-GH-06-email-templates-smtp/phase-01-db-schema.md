---
phase: 1
title: DB schema + pgcrypto + seed templates
status: completed
effort: 0.5 day
branch: feat/email-templates/phase-01-db-schema
depends_on: []
---

# Phase 1 — DB Schema + Seed

## Context Links
- Plan: [plan.md](plan.md)
- Brainstorm: [../reports/brainstorm-260502-1526-email-templates-smtp.md](../reports/brainstorm-260502-1526-email-templates-smtp.md)

## Overview

**Priority:** P0 (blocking all subsequent phases)
**Description:** Create migration with 3 tables (`email_provider_config`, `email_templates`, `email_logs`), enable `pgcrypto` extension, seed 8 templates (4 types × vi/en) with placeholder content, RLS policies enforcing permission split.

## Requirements

**Functional:**
- `email_provider_config` singleton row (one config for entire app)
- `email_templates` UNIQUE (type, locale) — exactly 8 rows after seed
- `email_logs` audit trail, indexed by `to_email`, `sent_by`, `(related_entity_type, related_entity_id)`
- pgcrypto extension enabled for `pgp_sym_encrypt`/`pgp_sym_decrypt`
- RLS:
  - `email_provider_config`: SELECT for admin/super_admin/hr/interviewer/recruiter (read sender info); UPDATE for admin/super_admin only
  - `email_templates`: SELECT for all 5 roles; UPDATE for admin/super_admin only
  - `email_logs`: INSERT for all 5 roles (own sends); SELECT for admin/super_admin (all) + others (own sends only)

## Architecture

### File: `supabase/migrations/20260502000000_email_templates_smtp.sql`

```sql
-- Enable pgcrypto for SMTP password encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. email_provider_config (singleton)
CREATE TABLE public.email_provider_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  provider_type varchar NOT NULL DEFAULT 'gmail_smtp'
    CHECK (provider_type IN ('gmail_smtp', 'resend')),
  sender_email varchar NOT NULL DEFAULT '',
  sender_name varchar NOT NULL DEFAULT '',
  smtp_host varchar,
  smtp_port int DEFAULT 465,
  smtp_username varchar,
  smtp_password_encrypted bytea,
  min_interval_seconds int DEFAULT 60,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now()
);

-- Seed singleton row (idempotent)
INSERT INTO public.email_provider_config (enabled, provider_type, sender_email, sender_name)
VALUES (false, 'gmail_smtp', '', '')
ON CONFLICT DO NOTHING;

-- 2. email_templates
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type varchar NOT NULL
    CHECK (type IN ('schedule_interview', 'interview_reminder', 'offer', 'onboard_confirm')),
  locale varchar NOT NULL CHECK (locale IN ('vi', 'en')),
  subject varchar NOT NULL,
  body_html text NOT NULL,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (type, locale)
);

-- 3. email_logs (audit trail, retention forever per brainstorm dep #5)
CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type varchar NOT NULL,
  locale varchar NOT NULL,
  to_email varchar NOT NULL,
  to_name varchar,
  subject varchar NOT NULL,
  rendered_body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  related_entity_type varchar,
  related_entity_id uuid,
  sent_by uuid REFERENCES users(id) NOT NULL,
  sent_at timestamptz DEFAULT now(),
  status varchar NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  error_message text
);

CREATE INDEX idx_email_logs_to ON public.email_logs(to_email);
CREATE INDEX idx_email_logs_sent_by ON public.email_logs(sent_by);
CREATE INDEX idx_email_logs_related ON public.email_logs(related_entity_type, related_entity_id);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at DESC);

-- RLS
ALTER TABLE public.email_provider_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- email_provider_config: read by all 5 roles, write by admin/super_admin
CREATE POLICY email_provider_config_select ON public.email_provider_config
  FOR SELECT TO public USING (
    EXISTS (SELECT 1 FROM public.users
            WHERE auth_id = auth.uid()
              AND role IN ('admin', 'super_admin', 'hr', 'interviewer', 'recruiter'))
  );

CREATE POLICY email_provider_config_update ON public.email_provider_config
  FOR UPDATE TO public USING (
    EXISTS (SELECT 1 FROM public.users
            WHERE auth_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- email_templates: read by all 5 roles, write by admin/super_admin
CREATE POLICY email_templates_select ON public.email_templates
  FOR SELECT TO public USING (
    EXISTS (SELECT 1 FROM public.users
            WHERE auth_id = auth.uid()
              AND role IN ('admin', 'super_admin', 'hr', 'interviewer', 'recruiter'))
  );

CREATE POLICY email_templates_update ON public.email_templates
  FOR UPDATE TO public USING (
    EXISTS (SELECT 1 FROM public.users
            WHERE auth_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- email_logs: insert by all senders, select by admin/super_admin (all) + others (own)
CREATE POLICY email_logs_insert ON public.email_logs
  FOR INSERT TO public WITH CHECK (
    EXISTS (SELECT 1 FROM public.users
            WHERE auth_id = auth.uid()
              AND id = sent_by
              AND role IN ('admin', 'super_admin', 'hr', 'interviewer', 'recruiter'))
  );

CREATE POLICY email_logs_select ON public.email_logs
  FOR SELECT TO public USING (
    EXISTS (SELECT 1 FROM public.users
            WHERE auth_id = auth.uid()
              AND (role IN ('admin', 'super_admin') OR id = sent_by))
  );

-- Seed 8 templates: 4 types × 2 locales with placeholder content
INSERT INTO public.email_templates (type, locale, subject, body_html) VALUES
  ('schedule_interview', 'vi', 'Lịch phỏng vấn vị trí {{position_name}}',
    '<p>Chào {{candidate_name}},</p><p>Chúng tôi xin gửi lịch phỏng vấn:</p><ul><li>Vị trí: {{position_name}}</li><li>Thời gian: {{interview_date}} {{interview_time}}</li><li>Hình thức: {{interview_type}}</li><li>Địa điểm: {{interview_location}}</li><li>Link: {{meeting_link}}</li></ul><p>Trân trọng,<br>{{hr_name}}<br>{{company_name}}</p>'),
  ('schedule_interview', 'en', 'Interview Schedule for {{position_name}}',
    '<p>Hello {{candidate_name}},</p><p>Your interview is scheduled:</p><ul><li>Position: {{position_name}}</li><li>Time: {{interview_date}} {{interview_time}}</li><li>Type: {{interview_type}}</li><li>Location: {{interview_location}}</li><li>Link: {{meeting_link}}</li></ul><p>Best regards,<br>{{hr_name}}<br>{{company_name}}</p>'),
  ('interview_reminder', 'vi', 'Nhắc lịch phỏng vấn {{candidate_name}} - {{position_name}}',
    '<p>Chào {{interviewer_name}},</p><p>Nhắc bạn về lịch phỏng vấn:</p><ul><li>Ứng viên: {{candidate_name}}</li><li>Vị trí: {{position_name}}</li><li>Thời gian: {{interview_date}} {{interview_time}}</li><li>Địa điểm: {{interview_location}}</li><li>Link: {{meeting_link}}</li><li>CV: {{candidate_cv_link}}</li></ul>'),
  ('interview_reminder', 'en', 'Interview Reminder: {{candidate_name}} - {{position_name}}',
    '<p>Hello {{interviewer_name}},</p><p>Reminder of your upcoming interview:</p><ul><li>Candidate: {{candidate_name}}</li><li>Position: {{position_name}}</li><li>Time: {{interview_date}} {{interview_time}}</li><li>Location: {{interview_location}}</li><li>Link: {{meeting_link}}</li><li>CV: {{candidate_cv_link}}</li></ul>'),
  ('offer', 'vi', 'Thư mời nhận việc - {{position_name}}',
    '<p>Chào {{candidate_name}},</p><p>{{company_name}} hân hạnh gửi đến bạn thư mời:</p><ul><li>Vị trí: {{position_name}}</li><li>Mức lương: {{salary}}</li><li>Ngày bắt đầu: {{start_date}}</li><li>Hạn phản hồi: {{response_deadline}}</li></ul><p>Hợp đồng: {{contract_link}}</p><p>{{hr_name}}</p>'),
  ('offer', 'en', 'Job Offer - {{position_name}}',
    '<p>Hello {{candidate_name}},</p><p>{{company_name}} is pleased to offer you:</p><ul><li>Position: {{position_name}}</li><li>Salary: {{salary}}</li><li>Start date: {{start_date}}</li><li>Response deadline: {{response_deadline}}</li></ul><p>Contract: {{contract_link}}</p><p>{{hr_name}}</p>'),
  ('onboard_confirm', 'vi', 'Xác nhận onboard - {{position_name}}',
    '<p>Chào {{candidate_name}},</p><p>Xác nhận onboard:</p><ul><li>Vị trí: {{position_name}}</li><li>Ngày bắt đầu: {{start_date}}</li><li>Địa điểm: {{work_location}}</li><li>Quản lý: {{manager_name}}</li><li>Mang theo: {{items_to_bring}}</li></ul><p>Liên hệ: {{contact_email}}<br>{{hr_name}}</p>'),
  ('onboard_confirm', 'en', 'Onboarding Confirmation - {{position_name}}',
    '<p>Hello {{candidate_name}},</p><p>Confirming your onboarding:</p><ul><li>Position: {{position_name}}</li><li>Start date: {{start_date}}</li><li>Location: {{work_location}}</li><li>Manager: {{manager_name}}</li><li>Items to bring: {{items_to_bring}}</li></ul><p>Contact: {{contact_email}}<br>{{hr_name}}</p>')
ON CONFLICT (type, locale) DO NOTHING;

-- Seed company_name in system_settings (used as default {{company_name}} variable)
INSERT INTO public.system_settings (key, value, category, label, description, input_type)
VALUES ('company_name', '"ITBA"'::jsonb, 'general', 'Company Name', 'Used in email templates', 'text')
ON CONFLICT (key) DO NOTHING;
```

## Implementation Steps

1. Branch from `dev`: `git checkout dev && git pull && git checkout -b feat/email-templates/phase-01-db-schema`
2. Write migration file
3. Apply via Supabase MCP `apply_migration` (or `supabase db push`)
4. Verify: 3 tables exist, 8 templates rows, RLS policies, pgcrypto extension
5. Test pgcrypto: `SELECT pgp_sym_encrypt('test', 'key');` returns bytea
6. Test RLS: as admin can update templates; as hr cannot

## Todo List

- [ ] Branch from dev
- [ ] Write migration file
- [ ] Apply migration via MCP
- [ ] Verify 3 tables created
- [ ] Verify pgcrypto extension enabled
- [ ] Verify 8 templates seeded
- [ ] Verify company_name seeded in system_settings
- [ ] Test RLS: admin can UPDATE templates
- [ ] Test RLS: hr cannot UPDATE templates
- [ ] Test RLS: hr can SELECT templates + provider_config
- [ ] Commit + push branch

## Success Criteria

- Migration applies cleanly
- `SELECT count(*) FROM email_templates` = 8
- pgcrypto extension visible in `pg_extension`
- RLS policies enforce edit/send split correctly

## Risk Assessment

| Risk | L | I | Mitigation |
|------|---|---|------------|
| RLS blocks legitimate writes | M | H | Test with each role manually post-apply |
| pgcrypto extension missing on Supabase | L | H | Supabase has pgcrypto installed by default; verify post-apply |
| Seed conflict if rerun | L | L | `ON CONFLICT DO NOTHING` everywhere |

## Next Steps

Phase 2 — SMTP config UI + encryption helpers + test-send endpoint.
