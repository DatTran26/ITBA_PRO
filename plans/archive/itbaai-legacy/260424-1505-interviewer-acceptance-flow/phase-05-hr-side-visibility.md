---
phase: 5
title: HR-side Visibility
status: pending
effort: 0.5d
priority: medium
depends: phase-04
---

# Phase 5 — HR-side Visibility

## Overview
HR và admin cần thấy `interviewer_status` trên mỗi interview card, và khi interviewer đề xuất đổi slot (`reschedule_requested`), HR thấy proposed_at + nút reschedule.

## Files to Modify
- `src/app/dashboard/interviews/interviews-client.tsx` — HR view trong cùng file

---

## Context
File `interviews-client.tsx` đã có `isInterviewer(userRole)` check. HR/admin xem cùng page nhưng không thấy acceptance actions. Cần thêm:

1. `interviewer_status` badge (read-only cho HR)
2. Reschedule proposed slot display cho HR
3. Quick reschedule link khi `reschedule_requested`

---

## Changes to `InterviewCard`

### 1. `interviewer_status` Badge (cho HR/admin view)

Sau existing status display, thêm:

```tsx
// Show interviewer response status to HR/admin
const isHrOrAdmin = !isInterviewer(userRole);

{isHrOrAdmin && item.interviewer_status && (
  <div className={`ml-6 inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full border ${
    STATUS_BADGE[item.interviewer_status]?.className ?? 'bg-white/5 border-white/10 text-[#8B99B0]'
  }`}>
    {STATUS_BADGE[item.interviewer_status]?.label ?? item.interviewer_status}
  </div>
)}
```

Reuse `STATUS_BADGE` constant từ Phase 4 (move lên top-level của file).

### 2. Reschedule Requested — HR Action Block

Khi `interviewer_status === 'reschedule_requested'`:

```tsx
{isHrOrAdmin && item.interviewer_status === 'reschedule_requested' && (
  <div className="ml-6 mt-2 rounded-xl border border-[#7C8FFF]/25 bg-[#7C8FFF]/8 p-3 flex flex-col gap-2">
    <p className="text-xs font-semibold text-[#B6C2FF]">
      Interviewer đề xuất đổi slot
    </p>
    {item.interviewer_proposed_at && (
      <p className="text-xs text-[#C8D0DF]">
        Đề xuất: {formatDateTime(item.interviewer_proposed_at, item.timezone)}
      </p>
    )}
    {item.interviewer_note && (
      <p className="text-xs text-[#8B99B0] italic">{item.interviewer_note}</p>
    )}
    <Link
      href={`/dashboard/recruitment/schedule?id=${item.job_applications?.id}`}
      className="inline-flex items-center gap-1.5 text-xs text-[#B6C2FF] border border-[#7C8FFF]/30 bg-[#7C8FFF]/10 rounded-lg px-2.5 py-1.5 hover:bg-[#7C8FFF]/20 transition-colors w-fit"
    >
      <Calendar className="w-3.5 h-3.5" />
      Reschedule
    </Link>
  </div>
)}
```

---

## Move `STATUS_BADGE` to Top-Level

Move constant ra ngoài component để dùng chung:

```typescript
const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: 'Chờ xác nhận', className: 'bg-amber-500/15 border-amber-500/30 text-amber-300' },
  accepted: { label: 'Đã xác nhận', className: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' },
  declined: { label: 'Đã từ chối', className: 'bg-rose-500/10 border-rose-500/25 text-rose-300' },
  reschedule_requested: { label: 'Đề xuất đổi slot', className: 'bg-[#7C8FFF]/15 border-[#7C8FFF]/30 text-[#B6C2FF]' },
};
```

---

## Import thêm
- `Calendar` from `lucide-react` (nếu chưa có)

## Validation
- [ ] HR/admin thấy `interviewer_status` badge trên mỗi card
- [ ] `reschedule_requested` → hiện proposed slot + reschedule link
- [ ] Reschedule link trỏ đúng sang `/dashboard/recruitment/schedule?id=...`
- [ ] Interviewer view: không hiện HR action block
- [ ] TypeScript compile clean
