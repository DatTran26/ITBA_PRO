---
phase: 4
title: Acceptance UI
status: pending
effort: 1d
priority: high
depends: phase-01, phase-02
---

# Phase 4 — Acceptance UI on `/dashboard/interviews`

## Overview
Thêm Accept / Decline / Propose Slot UI vào màn hình interviews hiện có. Chỉ hiện khi `interviewer_status === 'pending'` và user là interviewer của lịch đó.

## File to Modify
- `src/app/dashboard/interviews/interviews-client.tsx`

---

## Changes to `InterviewItem` interface
```typescript
interface InterviewItem {
  // ...existing fields...
  interviewer_status: 'pending' | 'accepted' | 'declined' | 'reschedule_requested';
  interviewer_proposed_at: string | null;
  interviewer_note: string | null;
}
```

---

## New Component: `InterviewAcceptanceActions`

Extract thành component nhỏ trong cùng file (dưới 50 lines):

```tsx
function InterviewAcceptanceActions({
  scheduleId,
  onResponded,
}: {
  scheduleId: string;
  onResponded: () => void;
}) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [proposedAt, setProposedAt] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const respond = async (action: 'accept' | 'decline' | 'reschedule') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/recruitment/interviews/${scheduleId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, proposed_at: proposedAt || undefined, note: note || undefined }),
      });
      if (!res.ok) throw new Error();
      toast.success(action === 'accept' ? 'Đã xác nhận lịch' : action === 'decline' ? 'Đã từ chối lịch' : 'Đã đề xuất đổi lịch');
      onResponded();
    } catch {
      toast.error('Không thể cập nhật. Thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 ml-6 flex flex-col gap-2">
      {/* Amber pending banner */}
      <div className="inline-flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-1.5">
        <Clock className="w-3.5 h-3.5" />
        Chờ bạn xác nhận lịch này
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => respond('accept')} disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-colors">
          Xác nhận
        </button>
        <button onClick={() => respond('decline')} disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs bg-rose-500/10 border border-rose-500/25 text-rose-300 hover:bg-rose-500/20 transition-colors">
          Từ chối
        </button>
        <button onClick={() => setShowReschedule(!showReschedule)} disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/15 text-[#8B99B0] hover:bg-white/10 transition-colors">
          Đề xuất đổi slot
        </button>
      </div>
      {showReschedule && (
        <div className="flex flex-col gap-2 p-3 rounded-xl border border-white/10 bg-[#0A0F1D]">
          <input type="datetime-local"
            value={proposedAt}
            onChange={e => setProposedAt(e.target.value)}
            className="h-10 rounded-lg border border-white/10 bg-transparent px-3 text-sm scheme-dark focus:outline-none focus:ring-2 focus:ring-[#7C8FFF]/40" />
          <input type="text" placeholder="Lý do / ghi chú (tuỳ chọn)"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="h-10 rounded-lg border border-white/10 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C8FFF]/40" />
          <button onClick={() => respond('reschedule')} disabled={!proposedAt || loading}
            className="h-9 rounded-lg text-sm bg-[#5B6CF0] hover:bg-[#4958d6] text-white disabled:opacity-50">
            Gửi đề xuất
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Modify `InterviewCard`

Thêm sau existing result display block:

```tsx
// Show acceptance actions for pending items (only for the assigned interviewer)
const isPending = item.interviewer_status === 'pending';

{isPending && (
  <InterviewAcceptanceActions
    scheduleId={item.id}
    onResponded={onResultSubmitted}
  />
)}
```

---

## `interviewer_status` Badge

Hiện badge status trên mỗi card (kể cả accepted/declined/reschedule_requested) để interviewer biết trạng thái hiện tại:

```tsx
const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: 'Chờ xác nhận', className: 'bg-amber-500/15 border-amber-500/30 text-amber-300' },
  accepted: { label: 'Đã xác nhận', className: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' },
  declined: { label: 'Đã từ chối', className: 'bg-rose-500/10 border-rose-500/25 text-rose-300' },
  reschedule_requested: { label: 'Đề xuất đổi slot', className: 'bg-[#7C8FFF]/15 border-[#7C8FFF]/30 text-[#B6C2FF]' },
};
```

---

## Import thêm
- `toast` from `sonner`
- `useState` (đã có)
- `Clock` from `lucide-react` (check nếu chưa import)

## Validation
- [ ] Pending item hiện 3 buttons + amber banner
- [ ] Accept → card cập nhật live (refetch), badge đổi → "Đã xác nhận"
- [ ] Decline → badge đổi → "Đã từ chối"
- [ ] Reschedule: thiếu proposed_at → button disabled
- [ ] Non-pending items: không hiện acceptance actions
- [ ] TypeScript compile clean
