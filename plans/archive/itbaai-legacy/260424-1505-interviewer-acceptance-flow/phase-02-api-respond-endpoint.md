---
phase: 2
title: API Respond Endpoint
status: pending
effort: 0.5d
priority: critical
depends: phase-01
blocks: phase-03, phase-04, phase-06
---

# Phase 2 — API Respond Endpoint

## Overview
Tạo endpoint mới cho interviewer respond đến lịch phỏng vấn được assign.

## New File
**Path:** `src/app/api/recruitment/interviews/[id]/respond/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

type RespondAction = 'accept' | 'decline' | 'reschedule';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, isInterviewer, userId } = ctx;
  if (!isAdmin && !isInterviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const action: RespondAction = body?.action;
  const proposed_at: string | undefined = body?.proposed_at;
  const note: string | undefined = body?.note;

  if (!['accept', 'decline', 'reschedule'].includes(action)) {
    return NextResponse.json({ error: "action must be accept | decline | reschedule" }, { status: 400 });
  }

  if (action === 'reschedule' && !proposed_at) {
    return NextResponse.json({ error: "proposed_at required for reschedule" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch + ownership check
  const { data: schedule, error: schedErr } = await admin
    .from("interview_schedules")
    .select("id, interviewer_id, interviewer_status, status")
    .eq("id", id)
    .single();

  if (schedErr || !schedule) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  // Only the assigned interviewer (or admin) can respond
  if (!isAdmin && schedule.interviewer_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Can't respond to already completed/cancelled interviews
  if (schedule.status !== 'scheduled') {
    return NextResponse.json({ error: "Cannot respond to a completed or cancelled interview" }, { status: 422 });
  }

  const statusMap: Record<RespondAction, string> = {
    accept: 'accepted',
    decline: 'declined',
    reschedule: 'reschedule_requested',
  };

  const { error: updateError } = await admin
    .from("interview_schedules")
    .update({
      interviewer_status: statusMap[action],
      interviewer_note: note ?? null,
      interviewer_proposed_at: action === 'reschedule' ? proposed_at : null,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ success: true, interviewer_status: statusMap[action] });
}
```

## Security Notes
- Chỉ `isInterviewer` hoặc `isAdmin` mới được gọi
- `interviewer_id === userId` check ngăn interviewer respond lịch của người khác
- Admin có thể respond thay (override scenario)

## Validation
- [ ] `PATCH /api/recruitment/interviews/[id]/respond` với `action: 'accept'` → 200 + `interviewer_status: 'accepted'`
- [ ] `action: 'reschedule'` thiếu `proposed_at` → 400
- [ ] Interviewer khác gọi với wrong `id` → 403
- [ ] Completed interview → 422
- [ ] TypeScript compile clean
