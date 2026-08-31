# Project Changelog

> **Historical release evidence.** Không dùng làm product/architecture authority.

All notable changes to the ITBAAI project are documented here.

Format: `[Type] Feature/Fix title (Date) - Brief description`

Types: `[FEAT]` = New feature, `[FIX]` = Bug fix, `[DOCS]` = Documentation, `[REFACTOR]` = Code restructuring, `[PERF]` = Performance improvement

---

## Phase 1: MVP + Admin (Complete)

### May 2026

**[FEAT] Email Templates + SMTP Sending (May 02–03, 2026)**
- **Compose page** (`/dashboard/emails`): 5-step form — template type + locale → recipient search → entity autofill → variable fields → preview + send. Available to all 5 recruitment roles (super_admin, admin, hr, recruiter, interviewer).
- **4 template types × 2 locales (vi/en):** `schedule_interview`, `interview_reminder`, `offer`, `onboard_confirm`. Templates seeded with professional copy; editable by admin/super_admin via Settings → Templates tab with CodeMirror HTML editor and live preview.
- **SMTP config UI** (`/dashboard/emails/settings`): Admin-only SMTP tab with host/port/from/username/password fields, reveal password toggle, save + test-send to admin's own email.
- **Gmail SMTP dispatch:** nodemailer transport with App Password. Provider abstraction (`EmailProvider` interface) allows Phase 2 swap to Resend without API changes.
- **Email logs** (`/dashboard/emails/logs`): Paginated audit trail with type/status/email filters and detail modal. Admin sees all rows; other roles see own rows (RLS enforced).
- **Nav extension:** Emails group added to sidebar/topnav with role-filtered sub-links (Settings restricted to admin/super_admin only).
- **Rate limiting:** 1 email per user per 60 seconds enforced at API level.
- **Autofill:** Server action resolves sender info, company name, interview schedule, candidate name, and job title from DB given a `persons.id`.

**[SECURITY] pgcrypto SMTP password encryption (May 02, 2026)**
- `pgcrypto` extension enabled on Supabase project.
- SMTP password stored as `bytea` encrypted via `pgp_sym_encrypt(password, SMTP_PASSWORD_ENCRYPTION_KEY)`.
- Decrypt RPC (`decrypt_smtp_password`) is SECURITY DEFINER — only callable server-side; password never exposed to client bundle.
- New required env var: `SMTP_PASSWORD_ENCRYPTION_KEY` (≥32 chars, stored in 1Password + Vercel env).

**Migrations to apply:**
- `supabase/migrations/20260502000000_email_templates_smtp.sql` — 3 tables + RLS + 8 seeded templates + company_name setting seed
- `supabase/migrations/20260502000001_email_smtp_helpers.sql` — pgcrypto encrypt/decrypt RPCs

### April 2026

**[FEAT] Calendar View for Interviews Page (Apr 25, 2026)**
- Added week/month calendar view to `/dashboard/interviews` using `react-big-calendar`
- Components: `InterviewCalendarView` (main calendar with toolbar), `InterviewCalendarEventDetail` (slide-in detail panel)
- Features: Date-based filtering, event color by interviewer_status, Vietnamese locale, confirm/decline/reschedule actions
- UI: Tab toggle (Danh sách / Lịch) with URL-synced state (`?view=calendar`)
- Styling: Dark-theme CSS overrides for react-big-calendar consistency
- Dependencies: `react-big-calendar`, `date-fns`, `@types/react-big-calendar`

**[FEAT] Interviewer Acceptance Flow - Complete 6-phase implementation (Apr 24, 2026)**
- Phase 1: DB migration with `interviewer_status` (pending/accepted/declined/reschedule_requested), timestamps, notes, and RLS policy for interviewer self-read
- Phase 2: API endpoint `PATCH /api/recruitment/interviews/[id]/respond` for accept/decline/propose reschedule with ownership + status guards
- Phase 3: New `InterviewerDashboardClient` at `/dashboard` with role-based routing, pending banner, stats, and upcoming interviews list
- Phase 4: Interviewer-side UI with Accept/Decline/Propose Slot buttons, `interviewer_status` badge on all cards
- Phase 5: HR-side visibility showing `interviewer_status` badge, reschedule details, and quick action links
- Phase 6: In-app notifications via `use-notifications.ts` with `interview_assigned` type and polling detection
- Result: Interviewers now have dedicated dashboard and can respond to interview assignments; HR sees full response status in real time

**[FIX] Điều hướng nút Lên lịch PV từ Candidate Detail sang Schedule Workspace có preselect (Apr 22, 2026)**
- Thay hành vi mở dialog trực tiếp tại trang chi tiết ứng viên bằng điều hướng sang `/dashboard/recruitment/schedule?id=<applicationId>`
- Trang schedule hỗ trợ đọc query `id` và tự động focus/chọn đúng candidate tương ứng sau khi tải dữ liệu
- Bổ sung thông báo rõ ràng khi `id` không hợp lệ hoặc candidate chưa ở trạng thái SHORTLISTED
- Kết quả: thao tác điều phối từ Candidate Detail đi thẳng vào đúng ngữ cảnh lịch hẹn, tránh lỗi popup cũ

**[FEAT] Nâng cấp mạnh UI màn Điều phối Phỏng vấn theo plan nghiệp vụ (Apr 22, 2026)**
- Refactor toàn bộ UI tại route `/dashboard/recruitment/schedule` để đồng bộ với theme dashboard hiện tại
- Chuẩn hóa toàn bộ nội dung tiếng Việt có dấu cho tiêu đề, form label, trạng thái và thông báo
- Bổ sung candidate context quan trọng trên queue card: email, CV score, test status, stage, số vòng đã có
- Bổ sung Decision Context panel: AI summary, test result snapshot, cảnh báo thiếu test
- Bổ sung quick actions: Xem CV, Xem hồ sơ ứng viên ngay trong workspace
- Tách thời gian phỏng vấn thành Ngày + Giờ + Thời lượng và hiển thị giờ kết thúc dự kiến
- Thêm cảnh báo conflict interviewer theo khung giờ trước khi submit
- Bổ sung lịch sử các vòng phỏng vấn gần nhất cho ứng viên trong cùng màn hình
- Thêm CTA hierarchy rõ ràng: `Lưu nháp` (placeholder), `Hủy`, `Xác nhận lên lịch`
- Validation nâng cao: chặn giờ quá khứ, thiếu dữ liệu bắt buộc, conflict trước submit

**[FEAT] HR Dashboard - Dedicated recruitment-focused dashboard (Apr 20, 2026)**
- New component: HrDashboardClient with KPI cards, stage funnel, recent applications table
- Route: `/dashboard` returns different component based on user role (HR vs Recruiter vs Admin)
- Middleware enforcement: HR access to /dashboard and /dashboard/recruitment/*, blocked from /create, /skills, /settings
- Features: Upload CV button, quick action links (Full Pipeline, Analytics, Job Descriptions)
- Roles extended: Added `hr` role alongside `recruiter` and `admin`
- Impact: Streamlined HR workflow with recruitment-specific metrics and navigation

**[FIX] Allow HR role in recruitment dashboard API and optimize middleware (Apr 20, 2026)**
- Middleware: Reduced redundant database calls during role-based routing
- API: Recruitment endpoints now accept `hr` role in authorization checks
- Result: Faster middleware execution and consistent HR role support across routes

**[FEAT] AI CV Screening & Recruitment Feature - Complete 8-phase implementation (Apr 19, 2026)**
- Phase 1 (Apr 4): RLS policies, schema migration, auth context extension (hr/interviewer roles)
- Phase 2 (Apr 6): CV upload API route, shared recruitment TypeScript types
- Phase 3 (Apr 8): Recruitment dashboard page, state machine, activity logs migration
- Phase 4 (Apr 11): Candidate detail page, pipeline status timeline UI
- Phase 5 (Apr 13): Interview scheduling and result submission workflows
- Phase 6 (Apr 15): Offer state updates and onboarding flow
- Phase 7 (Apr 17): Job Description (JD) management and recruitment settings
- Phase 8 (Apr 19): Recruitment dashboard metrics, KPI aggregations
- Scope: CV intake → AI screening → interview scheduling → offer → onboarding pipeline
- Database: Added recruitment_applications, recruitment_interactions, recruitment_activity_logs tables
- New routes: /dashboard/recruitment*, /api/recruitment/*

**[FEAT] CV Upload Dialog for HR (Apr 19, 2026)**
- Component: CvUploadDialog integrated into recruitment pages
- Functionality: File upload (PDF/DOCX), candidate info capture, AI parsing trigger
- Location: Available on recruitment page and prominently in HR dashboard header

**[FIX] Enforce HR recruitment-only access and remove application scope restriction (Apr 18, 2026)**
- Middleware: HR role now restricted to recruitment routes only
- API: Removed overly broad application scope, enforce endpoint-level auth
- Result: Tighter security model, HR can't access non-recruitment features

**[FIX] Restrict HR role to recruitment-only views (Apr 17, 2026)**
- Middleware: Early return for HR on /dashboard (prevents test creation page access)
- Navigation: HR cannot see test creation, skills, or settings tabs
- Result: Simplified HR UI, focused workflow

**[FEAT] Add CV upload dialog for HR on recruitment page (Apr 10, 2026)**
- Component: Modal dialog for CV file upload
- Trigger: "Upload CV" button on recruitment dashboard
- Fields: Candidate name, email, file (PDF/DOCX), optional JD selection
- Integration: POST /api/recruitment/upload handles file + metadata

**[FIX] Hide create-test button for HR role on dashboard header (Apr 9, 2026)**
- Conditional rendering: Button hidden when user.role === 'hr'
- Result: Cleaner UI, prevents navigation to forbidden routes

---

### March 2026

**[FEAT] Add recruitment dashboard metrics (Phase 8 - Apr 19)**
- Endpoints: GET /api/recruitment/dashboard for KPI aggregations
- Metrics: Total CVs, pipeline stage breakdown, avg AI score, pass/offer rates
- Components: KpiCardGrid integration with recruitment data
- Database: Aggregation queries on recruitment_applications table

**[FEAT] Add JD management and recruitment settings (Phase 7 - Apr 17)**
- UI: /dashboard/recruitment/jd page for job description CRUD
- Settings: /dashboard/recruitment/settings for workflow configuration
- Features: Create/edit/delete JDs, configure auto-reject thresholds
- Database: recruitment_jd_templates table

**[FEAT] Add offer and onboarding flow (Phase 6 - Apr 15)**
- State transitions: Offer sent → accepted/rejected → onboarding started → completed
- Components: Offer state update dialog, onboarding progress tracker
- Endpoints: PATCH /api/recruitment/applications/[id]/offer
- Email: Optional notification template to candidate

**[FEAT] Add interview scheduling and result submission (Phase 5 - Apr 13)**
- Interview scheduling: Calendar selection, interviewer assignment
- Result submission: Interview outcome (pass/fail/pending), notes, rating
- Endpoints: POST /api/recruitment/interviews, PATCH /api/recruitment/results/[id]
- Database: recruitment_interviews, recruitment_interview_results tables

**[FEAT] Add recruitment dashboard page and nav link (Phase 3 - Apr 8)**
- Route: /dashboard/recruitment with full pipeline view
- Table: Candidate list with filtering, sorting, bulk actions
- Components: CandidateDetailDrawer, status timeline visualization
- Navigation: Added "Recruitment" tab to main dashboard navigation

**[FEAT] Add state machine, pipeline helpers, activity_logs migration (Phase 3 - Apr 8)**
- Utilities: Pipeline state machine for valid status transitions
- Logging: Activity logs for all recruitment actions (audit trail)
- Database: recruitment_activity_logs table with action history
- Helpers: Candidate status validators, pipeline progression functions

**[FEAT] Add CV upload API route (Phase 2 - Apr 6)**
- Endpoint: POST /api/recruitment/upload
- Features: File handling (PDF/DOCX), metadata capture
- Processing: Trigger CV parsing via AI service
- Response: Upload confirmation with candidate_id, parsed data

**[FEAT] Add shared recruitment TypeScript types (Phase 2 - Apr 6)**
- File: `@/types/recruitment.ts`
- Types: PipelineStatus, RecruitmentApplication, InterviewSchedule, OfferState
- Enums: Valid status values, interview types, onboarding stages
- Usage: Shared across all recruitment-related routes and components

**[FEAT] Extend AuthContext with role, isHr, isInterviewer (Phase 1 - Apr 4)**
- AuthContext: Added role field, computed flags (isHr, isInterviewer)
- Usage: Client-side role checks for rendering UI elements
- Validation: Matches Supabase user metadata role

**[FEAT] Add recruitment RLS policies (Phase 1 - Apr 4)**
- Policies: recruitment_applications, recruitment_interactions tables
- HR access: Can view/edit own organization's recruitment data
- Recruiter access: Can manage applications, schedule interviews
- Interviewer access: Read-only interview schedules and results

**[FEAT] Add recruitment schema migration (Phase 1 - Apr 4)**
- Tables: recruitment_applications, recruitment_jd_templates, recruitment_interviews, recruitment_interview_results, recruitment_activity_logs
- Schema: Full data model for CV-to-onboarding pipeline
- Relationships: Foreign keys to users, tests, results tables

---

**[FEAT] Automated Version Management (Mar 29, 2026)**
- Scripts relocated from `scripts/` to `.claude/scripts/` directory
- Command: `npm run version` for interactive versioning workflow
- Features: Semantic versioning, changelog updates, git tagging
- Validation: Enforced tagging policy (forbidden on `dev`, mandatory on `release/*`)
- Multi-remote: Support for GitHub + GitLab simultaneous push

**[FEAT] Admin Dashboard Tab (Mar 29, 2026)**
- New tab: "Admin" in dashboard (3rd tab alongside Recruiter, Assessor)
- KPI Cards: Tests created, average score, active recruiters, token usage
- Charts: Daily token usage line chart, feature breakdown pie chart
- Lists: Active recruiters list with real-time status
- Quick Links: Settings, Templates, Versions, Export

**[FEAT] Token Monitoring & Cost Tracking (Mar 29, 2026)**
- Utility: `logAiUsage()` fire-and-forget pattern in all 8 AI routes
- Tracking: user_id, feature, tokens_in/out, cost_estimate, model
- Admin API: `GET /api/ai-usage` with aggregations by day, feature, top users
- Database: ai_usage table with cost estimation

**[FEAT] Assessment Templates (Mar 29, 2026)**
- Global templates: Admin-created, visible to all recruiters
- Personal templates: User-created, private to owner
- Reuse: "Use Template" button auto-fills test creation form
- Fields: job_role, level, question_count, time_limit, job_description
- CRUD: Full management at `/api/templates`

**[FEAT] Skill Framework Tables (Mar 29, 2026)**
- Categories: 5 seeded defaults (Technical, Business Analysis, Communication, etc.)
- Expectations: Level-skill mappings with expected scores (1-5)
- Mandatory flag: Mark critical skills for positions
- Admin-only: Management at `/dashboard/settings/skills`

**[FEAT] System Settings Management (Mar 29, 2026)**
- Admin-only page: `/dashboard/settings`
- Auto-save: PATCH endpoints for each setting (no form submission)
- Categories: AI (model, temperature, token pricing), Assessment (defaults), Scoring
- Type system: text, number, select, toggle, json input types
- Defaults: 10 seeded settings for instant configuration

**[FEAT] Version Management Workflow (Mar 29, 2026)**
- Lifecycle: draft → pending → approved → rejected → archived
- Categories: platform, assessment, etc.
- Creator tracking: Records who created each version
- Admin approval: `/dashboard/versions` page with status filters
- Feature comparison: Side-by-side view of version differences

---

**[FEAT] Export PDF Report (Mar 20, 2026)**
- Client-side generation: jspdf library
- Content: Candidate info, score, AI analysis, notes, status, question breakdown
- Format: Professional layout suitable for internal reporting
- Button: Export in result header

**[FEAT] Edit AI Summary (Mar 20, 2026)**
- Inline editing: overall_assessment, strengths, weaknesses, recommendation
- Endpoint: PATCH /api/results/[id] with ai_analysis field
- Toast feedback: Save/cancel notifications
- Real-time update: Changes visible immediately after save

**[FEAT] Realtime Updates (Mar 20, 2026)**
- Technology: Supabase Realtime subscriptions
- Trigger: Test detail page subscribes to results table INSERT/UPDATE
- Behavior: Auto-refresh when candidate submits test
- No page reload: Recruiters see new results immediately

**[FEAT] Result Detail UI Redesign (Mar 20, 2026)**
- Layout: 5-section design (Header → AI Assessment → Quick Hints → Note → Tabs)
- Header: Score + Pass/Fail status segmented control
- Quick Hints: Blue/white cards with numbered badges
- Follow-up Qs: Two-column layout with category filtering
- Tabs: All, Strength Validation, Weakness Probe, etc.

**[FEAT] Candidate Status (Pass/Fail) (Mar 20, 2026)**
- Column: status added to results table
- UI: Segmented control in result header for quick selection
- Endpoint: PATCH /api/results/[id] supports status field
- Visual: Status indicator in result analysis page

**[FEAT] Interviewer Notes (Mar 20, 2026)**
- Capacity: Up to 5000 characters per result
- UI: Warm gradient section in result detail
- Endpoint: PATCH /api/results/[id] supports note field
- Auth: Recruiters only can add/edit notes

---

**[FEAT] Follow-up Sessions (Mar 19, 2026)**
- Workflow: Generate follow-up questions based on candidate result
- Tracking: Separate session record with open/closed status
- Endpoint: POST /api/ai/generate-followup
- Recruiter interface: View and share follow-up link with candidate

**[FEAT] Assessment Templates (Mar 29, 2026)**
- Reusable configurations for test creation
- Global (admin) and personal (user) templates
- "Use Template" button in create flow
- Includes: job_role, level, question_count, time_limit, job_description

---

## Phase 1: Core MVP (Completed - January-March 2026)

### Core Features (✓)
- User authentication (email/password, JWT)
- Admin and recruiter roles
- Test creation and management
- Question generation (OpenAI GPT-4o + Google fallback)
- Test taking interface (candidate)
- Result analysis and AI insights
- Recruiter dashboard
- Follow-up question generation
- Interviewer notes and candidate status tracking
- PDF report export
- Real-time result updates

### Admin Features (✓)
- System settings management (auto-save)
- Version management (draft→approved workflow)
- Assessment templates (reusable configs)
- Token monitoring and cost tracking
- Skill framework (categories, expectations)
- CSV export (results, candidates, skills)
- Admin dashboard (KPIs, charts, quick links)

---

## Known Issues & Deprecations

### Code Quality
- `create/page.tsx` (796 LOC) - Target Phase 2 refactoring
- `dashboard-client.tsx` (402 LOC) - Component extraction recommended
- `users-client.tsx` (521 LOC) - Logic splitting in progress

### Planned for Phase 2
- Automated testing (unit + E2E)
- Rate limiting on API endpoints
- Error boundary components
- Request validation middleware
- Performance monitoring (Sentry)

---

## Version History

| Version | Date | Highlights |
|---------|------|-----------|
| v1.3.0 | Pending | HR Dashboard, AI CV Screening & Recruitment complete |
| v1.2.0 | Mar 29 | Admin Dashboard, Token Monitoring, Assessment Templates |
| v1.1.0 | Mar 20 | Realtime Updates, PDF Export, Interviewer Notes |
| v1.0.0 | Mar 1 | MVP Launch: Core testing & assessment platform |

---

## Contribution Guidelines

When updating this changelog:
1. Add entries to the current section at the top
2. Use the format: `[TYPE] Title (Date) - Description`
3. Group by feature area or phase
4. Link to related commits or PRs when relevant
5. Update Phase/Version summary sections after major milestones
