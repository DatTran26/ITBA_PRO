# Interview Session Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm Interview Session model (batch scheduling), candidate confirmation via email token, strict 3-round pass gate trước khi OFFERED, và interview history tab trong candidate detail.

**Architecture:** Tạo bảng `interview_sessions` làm template — khi HR assign ứng viên vào session, hệ thống tạo 1 `interview_schedules` record per candidate (FK session_id). Email notification gửi thủ công qua nút "Gửi thông báo". Candidate xác nhận qua token link trong email (public API, no auth). 3-round gate: async helper kiểm tra DB trước khi cho phép OFFERED transition.

**Tech Stack:** Next.js 14 App Router, Supabase (admin client), TypeScript, Tailwind CSS, Lucide icons, Resend/SMTP email

---

## File Map

### Tạo mới
- `supabase/migrations/20260507000000_interview_sessions.sql` — migration
- `src/app/api/recruitment/sessions/route.ts` — GET list + POST create session
- `src/app/api/recruitment/sessions/[id]/assign/route.ts` — POST assign candidates
- `src/app/api/recruitment/sessions/[id]/notify/route.ts` — POST send emails
- `src/app/api/recruitment/confirm-interview/route.ts` — GET public confirmation
- `src/lib/recruitment/offer-gate.ts` — async 3-round validation
- `src/app/dashboard/recruitment/[id]/_components/interview-history-tab.tsx` — UI tab

### Sửa đổi
- `src/types/recruitment.ts` — thêm InterviewSession type, cập nhật InterviewSchedule
- `src/lib/recruitment/state-machine.ts` — giữ nguyên sync (gate tách riêng)
- `src/app/dashboard/recruitment/schedule/schedule-page-client.tsx` — refactor 2-step flow
- `src/app/dashboard/recruitment/[id]/application-detail-client.tsx` — thêm history tab

---

## Phase 1 — DB Migration + Types

### Task 1: Supabase Migration

**Files:**
- Create: `supabase/migrations/20260507000000_interview_sessions.sql`

- [ ] **Step 1: Tạo migration file**

```sql
-- interview_sessions: template buổi phỏng vấn
create table if not exists interview_sessions (
  id uuid primary key default gen_random_uuid(),
  job_description_id uuid references job_descriptions(id) on delete set null,
  round smallint not null check (round in (1, 2, 3)),
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,
  location_type text not null default 'online' check (location_type in ('online', 'office', 'phone')),
  location_detail text,
  recruiter_note text,
  notification_sent_at timestamptz,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Thêm columns vào interview_schedules
alter table interview_schedules
  add column if not exists session_id uuid references interview_sessions(id) on delete set null,
  add column if not exists candidate_confirmation text not null default 'pending'
    check (candidate_confirmation in ('pending', 'confirmed', 'declined')),
  add column if not exists candidate_confirmed_at timestamptz,
  add column if not exists confirmation_token uuid default gen_random_uuid() unique,
  add column if not exists test_link text;

-- Index
create index if not exists idx_interview_schedules_session_id on interview_schedules(session_id);
create index if not exists idx_interview_schedules_confirmation_token on interview_schedules(confirmation_token);

-- RLS: admin/hr có thể thấy tất cả sessions
alter table interview_sessions enable row level security;

create policy "hr_admin_all_sessions" on interview_sessions
  for all using (
    exists (
      select 1 from users u where u.auth_id = auth.uid()
      and u.role in ('hr', 'admin', 'super_admin')
    )
  );
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```
Expected: Migration applied successfully.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260507000000_interview_sessions.sql
git commit -m "feat(db): add interview_sessions table + extend interview_schedules"
```

---

### Task 2: TypeScript Types

**Files:**
- Modify: `src/types/recruitment.ts`

- [ ] **Step 1: Thêm InterviewSession interface và cập nhật InterviewSchedule**

Thêm vào cuối file (sau `CandidateStatusHistory`):

```typescript
export interface InterviewSession {
  id: string;
  job_description_id: string | null;
  round: 1 | 2 | 3;
  scheduled_at: string;
  duration_minutes: number;
  location_type: 'online' | 'office' | 'phone';
  location_detail: string | null;
  recruiter_note: string | null;
  notification_sent_at: string | null;
  created_by: string | null;
  created_at: string;
}
```

Cập nhật `InterviewSchedule` (thêm các fields mới):

```typescript
export interface InterviewSchedule {
  id: string;
  job_application_id: string;
  session_id: string | null;          // NEW
  interviewer_id: string | null;
  scheduled_at: string;
  timezone: string;
  recruiter_note: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  interviewer_status: 'pending' | 'accepted' | 'declined' | 'reschedule_requested';
  interviewer_proposed_at: string | null;
  interviewer_note: string | null;
  candidate_confirmation: 'pending' | 'confirmed' | 'declined'; // NEW
  candidate_confirmed_at: string | null;                         // NEW
  confirmation_token: string | null;                             // NEW
  test_link: string | null;                                      // NEW
  created_by: string | null;
  created_at: string;
  duration_minutes: number;
  location_type: 'online' | 'office' | 'phone';
  location_detail: string | null;
  interview_round: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/recruitment.ts
git commit -m "feat(types): add InterviewSession + extend InterviewSchedule"
```

---

## Phase 2 — Core APIs

### Task 3: Session CRUD API

**Files:**
- Create: `src/app/api/recruitment/sessions/route.ts`

- [ ] **Step 1: Tạo GET + POST handler**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/recruitment/sessions — list all sessions
export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!ctx.isAdmin && !ctx.isHr) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("interview_sessions")
    .select(`
      *,
      job_descriptions(title),
      interview_schedules(id, candidate_confirmation, job_applications(person_id, persons(name)))
    `)
    .order("scheduled_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data });
}

// POST /api/recruitment/sessions — create session
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!ctx.isAdmin && !ctx.isHr) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const { job_description_id, round, scheduled_at, duration_minutes, location_type, location_detail, recruiter_note } = body ?? {};

  if (!round || !scheduled_at) {
    return NextResponse.json({ error: "round và scheduled_at là bắt buộc" }, { status: 400 });
  }
  if (![1, 2, 3].includes(round)) {
    return NextResponse.json({ error: "round phải là 1, 2, hoặc 3" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("interview_sessions")
    .insert({
      job_description_id: job_description_id ?? null,
      round,
      scheduled_at,
      duration_minutes: duration_minutes ?? 60,
      location_type: location_type ?? "online",
      location_detail: location_detail ?? null,
      recruiter_note: recruiter_note ?? null,
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error || !data) return NextResponse.json({ error: "Không thể tạo session" }, { status: 500 });
  return NextResponse.json({ success: true, sessionId: data.id }, { status: 201 });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/recruitment/sessions/route.ts
git commit -m "feat(api): POST/GET interview sessions"
```

---

### Task 4: Assign Candidates to Session API

**Files:**
- Create: `src/app/api/recruitment/sessions/[id]/assign/route.ts`

- [ ] **Step 1: Tạo assign endpoint**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { logStatusChange } from "@/lib/recruitment/pipeline-helpers";

// POST /api/recruitment/sessions/[id]/assign
// Body: { applicationIds: string[] }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!ctx.isAdmin && !ctx.isHr) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: sessionId } = await params;
  const body = await req.json().catch(() => null);
  const applicationIds: string[] = body?.applicationIds ?? [];

  if (!applicationIds.length) {
    return NextResponse.json({ error: "applicationIds không được rỗng" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify session exists
  const { data: session } = await admin
    .from("interview_sessions")
    .select("id, round, scheduled_at, duration_minutes, location_type, location_detail, recruiter_note")
    .eq("id", sessionId)
    .single();

  if (!session) return NextResponse.json({ error: "Session không tồn tại" }, { status: 404 });

  const roundLabel = `Round ${session.round}` as string;

  // Fetch valid applications (must be SHORTLISTED)
  const { data: applications } = await admin
    .from("job_applications")
    .select("id, pipeline_status")
    .in("id", applicationIds);

  const valid = (applications ?? []).filter(a => a.pipeline_status === "SHORTLISTED");
  if (!valid.length) {
    return NextResponse.json({ error: "Không có ứng viên hợp lệ (cần trạng thái SHORTLISTED)" }, { status: 422 });
  }

  // Create interview_schedules per candidate
  const schedules = valid.map(app => ({
    job_application_id: app.id,
    session_id: sessionId,
    scheduled_at: session.scheduled_at,
    duration_minutes: session.duration_minutes,
    location_type: session.location_type,
    location_detail: session.location_detail,
    recruiter_note: session.recruiter_note,
    interview_round: roundLabel,
    timezone: "Asia/Bangkok",
    status: "scheduled",
    interviewer_status: "pending",
    candidate_confirmation: "pending",
    created_by: ctx.userId,
  }));

  const { error: insertErr } = await admin.from("interview_schedules").insert(schedules);
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Transition each application to INTERVIEW_SCHEDULED
  await Promise.all(
    valid.map(async (app) => {
      await admin
        .from("job_applications")
        .update({ pipeline_status: "INTERVIEW_SCHEDULED", updated_at: new Date().toISOString() })
        .eq("id", app.id);
      await logStatusChange({
        jobApplicationId: app.id,
        fromStatus: app.pipeline_status,
        toStatus: "INTERVIEW_SCHEDULED",
        changedBy: ctx.userId,
        note: `Assigned to session ${sessionId}`,
      });
    })
  );

  return NextResponse.json({ success: true, assigned: valid.length }, { status: 201 });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/recruitment/sessions/[id]/assign/route.ts
git commit -m "feat(api): assign candidates to interview session"
```

---

### Task 5: Send Notification API

**Files:**
- Create: `src/app/api/recruitment/sessions/[id]/notify/route.ts`

- [ ] **Step 1: Tạo notify endpoint**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send-email"; // existing email helper

// POST /api/recruitment/sessions/[id]/notify
// Gửi email thông báo lịch phỏng vấn cho tất cả ứng viên trong session
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!ctx.isAdmin && !ctx.isHr) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: sessionId } = await params;
  const admin = createAdminClient();

  // Fetch session + all schedules with candidate email
  const { data: session } = await admin
    .from("interview_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) return NextResponse.json({ error: "Session không tồn tại" }, { status: 404 });

  const { data: schedules } = await admin
    .from("interview_schedules")
    .select(`
      id, confirmation_token, interview_round, scheduled_at, location_type, location_detail,
      job_applications(
        persons(name, email)
      )
    `)
    .eq("session_id", sessionId);

  if (!schedules?.length) {
    return NextResponse.json({ error: "Không có ứng viên nào trong session" }, { status: 422 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  let sent = 0;
  const errors: string[] = [];

  for (const schedule of schedules) {
    const person = (schedule.job_applications as any)?.persons;
    if (!person?.email) continue;

    const confirmUrl = `${baseUrl}/api/recruitment/confirm-interview?token=${schedule.confirmation_token}`;

    try {
      await sendEmail({
        to: person.email,
        subject: `Thư mời phỏng vấn — ${schedule.interview_round}`,
        templateKey: "schedule_interview",
        variables: {
          candidate_name: person.name ?? "Ứng viên",
          interview_date: new Date(schedule.scheduled_at).toLocaleDateString("vi-VN"),
          interview_time: new Date(schedule.scheduled_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          interview_type: schedule.location_type,
          interview_location: schedule.location_detail ?? schedule.location_type,
          confirm_url: confirmUrl,
        },
      });
      sent++;
    } catch (e) {
      errors.push(`${person.email}: ${(e as Error).message}`);
    }
  }

  // Mark session notification_sent_at
  await admin
    .from("interview_sessions")
    .update({ notification_sent_at: new Date().toISOString() })
    .eq("id", sessionId);

  return NextResponse.json({ success: true, sent, errors });
}
```

**Lưu ý:** `sendEmail` là helper hiện tại trong codebase. Kiểm tra path thực tế bằng `grep -r "sendEmail" src/lib/email/`.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/recruitment/sessions/[id]/notify/route.ts
git commit -m "feat(api): send interview notification emails for session"
```

---

### Task 6: Public Candidate Confirmation API

**Files:**
- Create: `src/app/api/recruitment/confirm-interview/route.ts`

- [ ] **Step 1: Tạo public confirmation endpoint**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/recruitment/confirm-interview?token={uuid}
// Public — không cần auth. Ứng viên click từ email.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token không hợp lệ" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: schedule, error } = await admin
    .from("interview_schedules")
    .select("id, candidate_confirmation, status")
    .eq("confirmation_token", token)
    .single();

  if (error || !schedule) {
    return NextResponse.json({ error: "Không tìm thấy lịch phỏng vấn" }, { status: 404 });
  }

  if (schedule.status !== "scheduled") {
    return NextResponse.json({ message: "Buổi phỏng vấn này đã kết thúc hoặc bị huỷ." });
  }

  if (schedule.candidate_confirmation === "confirmed") {
    return NextResponse.json({ message: "Bạn đã xác nhận tham gia trước đó." });
  }

  await admin
    .from("interview_schedules")
    .update({
      candidate_confirmation: "confirmed",
      candidate_confirmed_at: new Date().toISOString(),
    })
    .eq("id", schedule.id);

  return NextResponse.json({ message: "Xác nhận tham gia thành công! Chúng tôi sẽ gặp bạn vào ngày phỏng vấn." });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/recruitment/confirm-interview/route.ts
git commit -m "feat(api): public candidate interview confirmation via token"
```

---

## Phase 3 — 3-Round Offer Gate

### Task 7: Offer Gate Helper

**Files:**
- Create: `src/lib/recruitment/offer-gate.ts`

- [ ] **Step 1: Tạo async gate function**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";

const REQUIRED_ROUNDS = [1, 2, 3] as const;

/**
 * Kiểm tra ứng viên đã pass đủ 3 vòng phỏng vấn chưa.
 * Trả về { eligible: true } nếu đủ điều kiện nhận offer.
 * Trả về { eligible: false, reason: string } nếu chưa đủ.
 */
export async function checkOfferEligibility(
  jobApplicationId: string
): Promise<{ eligible: true } | { eligible: false; reason: string }> {
  const admin = createAdminClient();

  // Lấy tất cả interview_schedules đã completed với kết quả
  const { data: schedules, error } = await admin
    .from("interview_schedules")
    .select(`
      id,
      interview_round,
      interview_results(result)
    `)
    .eq("job_application_id", jobApplicationId)
    .eq("status", "completed");

  if (error) return { eligible: false, reason: "Không thể kiểm tra kết quả phỏng vấn" };

  // Map round label → result
  const roundResults = new Map<number, 'pass' | 'fail'>();
  for (const s of schedules ?? []) {
    const roundNum = extractRoundNumber(s.interview_round);
    const result = (s.interview_results as any)?.[0]?.result;
    if (roundNum && result) roundResults.set(roundNum, result);
  }

  // Kiểm tra đủ 3 vòng và tất cả đều pass
  for (const round of REQUIRED_ROUNDS) {
    if (!roundResults.has(round)) {
      return { eligible: false, reason: `Chưa có kết quả vòng ${round}` };
    }
    if (roundResults.get(round) !== 'pass') {
      return { eligible: false, reason: `Ứng viên không pass vòng ${round}` };
    }
  }

  return { eligible: true };
}

function extractRoundNumber(roundLabel: string): number | null {
  // Hỗ trợ: "Round 1", "Round 2", "Final" (Final = vòng 3)
  const match = roundLabel?.match(/(\d+)/);
  if (match) return parseInt(match[1], 10);
  if (roundLabel?.toLowerCase().includes("final")) return 3;
  return null;
}
```

- [ ] **Step 2: Tích hợp gate vào API chuyển trạng thái OFFERED**

Tìm API endpoint nơi HR trigger chuyển pipeline_status → OFFERED (thường trong candidate detail hoặc pipeline actions). Tìm bằng:

```bash
grep -r "OFFERED" src/app/api --include="*.ts" -l
```

Trong mỗi endpoint xử lý chuyển sang OFFERED, thêm gate check:

```typescript
import { checkOfferEligibility } from "@/lib/recruitment/offer-gate";

// Trước khi update pipeline_status → OFFERED:
const eligibility = await checkOfferEligibility(applicationId);
if (!eligibility.eligible) {
  return NextResponse.json(
    { error: `Chưa đủ điều kiện nhận offer: ${eligibility.reason}` },
    { status: 422 }
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/recruitment/offer-gate.ts
git commit -m "feat(recruitment): add 3-round offer gate validation"
```

---

## Phase 4 — Schedule Page Refactor

### Task 8: Refactor Schedule Page (2-step flow)

**Files:**
- Modify: `src/app/dashboard/recruitment/schedule/schedule-page-client.tsx`

- [ ] **Step 1: Đọc file hiện tại và xác định phần cần giữ**

```bash
wc -l "src/app/dashboard/recruitment/schedule/schedule-page-client.tsx"
```

File hiện tại ~1398 dòng. Refactor thành 2 bước rõ ràng:
- **Step A — Tạo Session**: Form nhập thông tin buổi phỏng vấn (round, ngày giờ, thời lượng, hình thức, ghi chú)
- **Step B — Assign Candidates**: Danh sách ứng viên SHORTLISTED, checkbox chọn nhiều, nút "Assign" + "Gửi thông báo"

- [ ] **Step 2: Thêm state quản lý step**

Tại đầu component, thêm:

```typescript
type ScheduleStep = 'create-session' | 'assign-candidates';
const [step, setStep] = useState<ScheduleStep>('create-session');
const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);
const [selectedApplicationIds, setSelectedApplicationIds] = useState<Set<string>>(new Set());
const [isSendingNotification, setIsSendingNotification] = useState(false);
```

- [ ] **Step 3: Thêm form tạo session và submit handler**

```typescript
async function handleCreateSession(formData: {
  round: 1 | 2 | 3;
  scheduled_at: string;
  duration_minutes: number;
  location_type: 'online' | 'office' | 'phone';
  location_detail: string;
  recruiter_note: string;
  job_description_id?: string;
}) {
  const res = await fetch("/api/recruitment/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  const json = await res.json();
  if (!res.ok) { setError(json.error); return; }
  setCreatedSessionId(json.sessionId);
  setStep('assign-candidates');
}
```

- [ ] **Step 4: Thêm assign + notify handlers**

```typescript
async function handleAssign() {
  if (!createdSessionId || !selectedApplicationIds.size) return;
  const res = await fetch(`/api/recruitment/sessions/${createdSessionId}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applicationIds: Array.from(selectedApplicationIds) }),
  });
  const json = await res.json();
  if (!res.ok) { setError(json.error); return; }
  setAssignedCount(json.assigned);
}

async function handleSendNotification() {
  if (!createdSessionId) return;
  setIsSendingNotification(true);
  const res = await fetch(`/api/recruitment/sessions/${createdSessionId}/notify`, {
    method: "POST",
  });
  const json = await res.json();
  setIsSendingNotification(false);
  if (!res.ok) { setError(json.error); return; }
  setNotificationSent(true);
}
```

- [ ] **Step 5: Render 2-step UI**

Giữ nguyên candidate list logic hiện tại (filter SHORTLISTED). Bọc nội dung trong step switcher:

```tsx
{step === 'create-session' && (
  <SessionForm onSubmit={handleCreateSession} />
)}
{step === 'assign-candidates' && (
  <div>
    {/* Candidate list với checkbox */}
    {/* Nút Assign + Send Notification */}
    <button onClick={handleAssign} disabled={!selectedApplicationIds.size}>
      Assign {selectedApplicationIds.size} ứng viên
    </button>
    <button
      onClick={handleSendNotification}
      disabled={isSendingNotification || !assignedCount}
    >
      {isSendingNotification ? "Đang gửi..." : "Gửi thông báo email"}
    </button>
  </div>
)}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/recruitment/schedule/schedule-page-client.tsx
git commit -m "feat(schedule): refactor to 2-step session creation + candidate assignment"
```

---

## Phase 5 — Interview History Tab

### Task 9: Interview History Tab Component

**Files:**
- Create: `src/app/dashboard/recruitment/[id]/_components/interview-history-tab.tsx`
- Modify: `src/app/dashboard/recruitment/[id]/application-detail-client.tsx`

- [ ] **Step 1: Tạo interview-history-tab.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, Link2, FileText } from "lucide-react";

interface InterviewRound {
  id: string;
  interview_round: string;
  scheduled_at: string;
  status: string;
  candidate_confirmation: string;
  interviewer_status: string;
  location_type: string;
  location_detail: string | null;
  test_link: string | null;
  recruiter_note: string | null;
  interviewer_note: string | null;
  interview_results: { result: 'pass' | 'fail'; note: string | null; submitted_at: string } | null;
}

interface InterviewHistoryTabProps {
  applicationId: string;
}

export function InterviewHistoryTab({ applicationId }: InterviewHistoryTabProps) {
  const [rounds, setRounds] = useState<InterviewRound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/recruitment/applications/${applicationId}/interviews`)
      .then(r => r.json())
      .then(d => { setRounds(d.interviews ?? []); setLoading(false); });
  }, [applicationId]);

  if (loading) return <div className="text-[#8B99B0] text-sm py-6 text-center">Đang tải lịch sử...</div>;
  if (!rounds.length) return <div className="text-[#5A6882] text-sm py-6 text-center">Chưa có vòng phỏng vấn nào.</div>;

  return (
    <div className="space-y-4">
      {rounds.map((round) => (
        <div key={round.id} className="rounded-xl border border-[#8B99B0]/12 bg-[#0C1422] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#ECF0F7]">{round.interview_round}</span>
              <ConfirmationBadge status={round.candidate_confirmation} />
            </div>
            <ResultBadge result={round.interview_results?.result} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-[#8B99B0] mb-3">
            <span>📅 {new Date(round.scheduled_at).toLocaleString("vi-VN")}</span>
            <span>📍 {round.location_detail || round.location_type}</span>
          </div>

          {round.test_link && (
            <a href={round.test_link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#7C8FFF] hover:underline mb-2">
              <Link2 className="w-3 h-3" /> Bài test
            </a>
          )}

          {round.interview_results?.note && (
            <div className="mt-2 rounded-lg bg-[#1A2236] p-3 text-xs text-[#B6C2FF]">
              <div className="flex items-center gap-1.5 mb-1 text-[#5A6882]">
                <FileText className="w-3 h-3" /> Nhận xét
              </div>
              {round.interview_results.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ResultBadge({ result }: { result?: 'pass' | 'fail' }) {
  if (!result) return <span className="text-xs text-[#5A6882]">Chưa có kết quả</span>;
  if (result === 'pass') return (
    <span className="flex items-center gap-1 text-xs font-medium text-[#36DDAB]">
      <CheckCircle className="w-3.5 h-3.5" /> Pass
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-[#FF6B7A]">
      <XCircle className="w-3.5 h-3.5" /> Fail
    </span>
  );
}

function ConfirmationBadge({ status }: { status: string }) {
  const map = {
    confirmed: { label: "Đã xác nhận", color: "text-[#36DDAB]" },
    declined: { label: "Từ chối", color: "text-[#FF6B7A]" },
    pending: { label: "Chờ xác nhận", color: "text-[#F59E0B]" },
  } as const;
  const s = map[status as keyof typeof map] ?? map.pending;
  return <span className={`text-[10px] ${s.color}`}>{s.label}</span>;
}
```

- [ ] **Step 2: Thêm API endpoint lấy interview history**

Tạo `src/app/api/recruitment/applications/[id]/interviews/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("interview_schedules")
    .select(`
      id, interview_round, scheduled_at, status, candidate_confirmation,
      candidate_confirmed_at, interviewer_status, location_type, location_detail,
      test_link, recruiter_note, interviewer_note,
      interview_results(result, note, submitted_at)
    `)
    .eq("job_application_id", id)
    .order("scheduled_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ interviews: data });
}
```

- [ ] **Step 3: Thêm tab vào application-detail-client.tsx**

Tìm phần tabs hiện tại trong file. Thêm tab "Lịch sử PV":

```typescript
// Trong tab list:
{ id: 'interview-history', label: 'Lịch sử PV' }

// Trong tab content render:
{activeTab === 'interview-history' && (
  <InterviewHistoryTab applicationId={applicationId} />
)}
```

Import component:
```typescript
import { InterviewHistoryTab } from "./_components/interview-history-tab";
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/recruitment/[id]/_components/interview-history-tab.tsx
git add src/app/api/recruitment/applications/[id]/interviews/route.ts
git add src/app/dashboard/recruitment/[id]/application-detail-client.tsx
git commit -m "feat(candidate): add interview history tab with round results"
```

---

## Phase 6 — Update Interviews Page

### Task 10: Show Candidate Confirmation Status

**Files:**
- Modify: `src/app/dashboard/interviews/interviews-client.tsx`

- [ ] **Step 1: Cập nhật InterviewCard để hiển thị confirmation status**

Trong InterviewCard component (hoặc nơi render thẻ phỏng vấn), thêm hiển thị `candidate_confirmation`:

```tsx
{/* Thêm vào header row của card */}
<span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
  interview.candidate_confirmation === 'confirmed'
    ? 'text-[#36DDAB] border-[#36DDAB]/30 bg-[#36DDAB]/10'
    : interview.candidate_confirmation === 'declined'
    ? 'text-[#FF6B7A] border-[#FF6B7A]/30 bg-[#FF6B7A]/10'
    : 'text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/10'
}`}>
  {interview.candidate_confirmation === 'confirmed' ? 'Đã xác nhận'
   : interview.candidate_confirmation === 'declined' ? 'Từ chối'
   : 'Chờ xác nhận'}
</span>
```

- [ ] **Step 2: Đảm bảo GET /api/recruitment/interviews trả về candidate_confirmation**

Kiểm tra query trong `src/app/api/recruitment/interviews/route.ts`. Thêm `candidate_confirmation` vào select nếu chưa có:

```bash
grep -n "candidate_confirmation" src/app/api/recruitment/interviews/route.ts
```

Nếu chưa có, thêm vào select string.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/interviews/interviews-client.tsx
git add src/app/api/recruitment/interviews/route.ts
git commit -m "feat(interviews): show candidate confirmation status in interview list"
```

---

## Checklist tổng

- [ ] Phase 1: DB migration applied + TypeScript types updated
- [ ] Phase 2: 4 API endpoints hoạt động (sessions CRUD, assign, notify, confirm)
- [ ] Phase 3: Offer gate integrated vào pipeline status transition
- [ ] Phase 4: Schedule page 2-step flow hoạt động
- [ ] Phase 5: Interview history tab hiển thị đúng per candidate
- [ ] Phase 6: Confirmation status hiển thị trong danh sách phỏng vấn

## Verify sau khi hoàn thành

```bash
# Build check
npm run build

# Smoke test flow:
# 1. Tạo session tại /dashboard/recruitment/schedule
# 2. Assign ứng viên SHORTLISTED vào session
# 3. Gửi thông báo → kiểm tra email
# 4. Click confirm link trong email → kiểm tra DB candidate_confirmation = 'confirmed'
# 5. Hoàn thành 3 vòng phỏng vấn với kết quả pass
# 6. Kiểm tra OFFERED transition có bị block khi chưa đủ 3 vòng
# 7. Kiểm tra interview history tab trong candidate detail
```
