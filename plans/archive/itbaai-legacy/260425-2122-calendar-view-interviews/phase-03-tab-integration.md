# Phase 03 — Tab Toggle Integration

## Overview
- **Priority**: P1
- **Status**: Completed
- **Effort**: ~2h
- **Blocked by**: Phase 02

## Context Links

- Target file: `src/app/dashboard/interviews/interviews-client.tsx`
- Calendar component: `src/app/dashboard/interviews/interview-calendar-view.tsx` (from phase 02)

## Requirements

- Add `[Danh sách]` / `[Lịch]` tab toggle below the header
- Both tabs share the same `interviews` data array (no double-fetch)
- Calendar view loaded via `next/dynamic` with `ssr: false` (avoid SSR errors)
- Tab state persists in URL search param (`?view=calendar`) so browser back works
- Stat strip visible in both views
- Skeleton loading works for both views

## Related Code Files

**Modify:**
- `src/app/dashboard/interviews/interviews-client.tsx` — add tab state, dynamic import, tab UI

**Create:** none (calendar component already created in phase 02)

## Implementation Steps

### Step 1 — Dynamic import at top of `interviews-client.tsx`

Add after existing imports:

```typescript
import dynamic from 'next/dynamic';

const InterviewCalendarView = dynamic(
  () => import('./interview-calendar-view'),
  {
    ssr: false,
    loading: () => (
      <div className="glass-card flex items-center justify-center h-[640px]">
        <div className="w-6 h-6 border-2 border-[#7C8FFF]/30 border-t-[#7C8FFF] rounded-full animate-spin" />
      </div>
    ),
  }
);
```

### Step 2 — Tab state with URL sync

```typescript
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

// Inside InterviewsClient component:
const searchParams = useSearchParams();
const router = useRouter();
const pathname = usePathname();

const activeView = (searchParams.get('view') === 'calendar') ? 'calendar' : 'list';

const setView = (view: 'list' | 'calendar') => {
  const params = new URLSearchParams(searchParams.toString());
  if (view === 'calendar') {
    params.set('view', 'calendar');
  } else {
    params.delete('view');
  }
  router.replace(`${pathname}?${params.toString()}`, { scroll: false });
};
```

### Step 3 — Tab toggle UI

Insert between stat strip and section content, inside the existing `<div className="py-6 flex flex-col gap-8">`:

```tsx
{/* View toggle tabs */}
<div className="flex items-center gap-1 p-1 rounded-xl bg-white/4 border border-white/8 w-fit">
  {(['list', 'calendar'] as const).map((v) => (
    <button
      key={v}
      onClick={() => setView(v)}
      className={`
        inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer
        ${activeView === v
          ? 'bg-[#7C8FFF]/15 text-[#B6C2FF] border border-[#7C8FFF]/30'
          : 'text-[#5A6882] hover:text-[#8B99B0]'
        }
      `}
    >
      {v === 'list'
        ? <><List className="w-3.5 h-3.5" /> Danh sách</>
        : <><CalendarDays className="w-3.5 h-3.5" /> Lịch</>
      }
    </button>
  ))}
</div>
```

Add `List` and `CalendarDays` to lucide-react imports.

### Step 4 — Conditional render

Replace the existing two `<section>` blocks with a conditional:

```tsx
{activeView === 'list' ? (
  <>
    {/* Upcoming section — existing JSX unchanged */}
    <section className="flex flex-col gap-3"> ... </section>

    {/* Completed section — existing JSX unchanged */}
    {(loading || completed.length > 0) && (
      <section className="flex flex-col gap-3"> ... </section>
    )}
  </>
) : (
  <InterviewCalendarView
    interviews={interviews}
    userRole={userRole}
    onRefresh={fetchInterviews}
  />
)}
```

### Step 5 — Wrap component with Suspense (required for useSearchParams)

In `page.tsx`, `InterviewsClient` uses `useSearchParams` which needs Suspense boundary:

```tsx
// src/app/dashboard/interviews/page.tsx
import { Suspense } from 'react';

// Wrap in page return:
<Suspense fallback={<div className="pt-20 px-4" />}>
  <InterviewsClient userRole={userRole} />
</Suspense>
```

### Step 6 — Final TypeScript + build check

```bash
npx tsc --noEmit
npm run build 2>&1 | tail -20
```

## Todo

- [x] Add `dynamic()` import for `InterviewCalendarView` at top of `interviews-client.tsx`
- [x] Add `useSearchParams` + `useRouter` + `usePathname` for URL-synced tab state
- [x] Add tab toggle UI (Danh sách / Lịch) with `List` + `CalendarDays` icons
- [x] Add conditional render: list sections vs `<InterviewCalendarView />`
- [x] Wrap `InterviewsClient` in `<Suspense>` in `page.tsx`
- [x] `npx tsc --noEmit` — no errors
- [x] `npm run build` — no errors

## Success Criteria

- Tabs switch between list and calendar view
- URL updates to `?view=calendar` on tab switch
- Browser back/forward preserves selected tab
- Calendar loads without SSR errors
- List view unchanged and still functional
- Stat strip visible in both views
- No TypeScript or build errors

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `useSearchParams` CSR-only error in Next.js | High | High | Wrap with `<Suspense>` in page.tsx (step 5) |
| Dynamic import flash on first calendar load | Low | Low | `loading:` spinner in `dynamic()` config |
| Tab state lost on page refresh | None | None | URL param persists across refresh |
| Calendar view fighting stat strip for space | Low | Low | Calendar `height: 640px` + page scroll is fine |

## Next Steps (v2 ideas, do not implement now)

- Drag-drop reschedule (optimistic update + API rollback)
- Day view
- Click-to-create new interview slot from calendar empty cell
- Export to `.ics` / Google Calendar sync
