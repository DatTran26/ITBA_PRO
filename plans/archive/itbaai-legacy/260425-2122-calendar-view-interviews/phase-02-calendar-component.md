# Phase 02 — CalendarView Component

## Overview
- **Priority**: P1
- **Status**: Completed
- **Effort**: ~4h
- **Blocked by**: Phase 01

## Context Links

- Parent: `interviews-client.tsx` — shares `InterviewItem[]` type and status configs
- CSS: `globals.css` — `.rbc-calendar` overrides from phase 01
- Status color reference: `src/app/dashboard/interviews/interviews-client.tsx` → `STATUS_CONFIG`

## Requirements

**Functional:**
- Render interview events on Week view (default) and Month view
- Events colored by `interviewer_status`
- Custom toolbar: prev/next navigation, today button, week/month toggle
- Click event → inline detail panel slides in from right (or bottom on mobile)
- Detail panel shows: candidate name, job title, time, status badge, confirm/decline actions (same as list view)
- Close panel on outside click or ESC key

**Non-functional:**
- No SSR (exported as dynamic component — handled in phase 03)
- File stays under 200 lines → split event detail into its own component
- Uses `framer-motion` for panel animation (already installed)

## Architecture

```
interview-calendar-view.tsx          ← main component (~150 lines)
interview-calendar-event-detail.tsx  ← slide-in panel (~80 lines)
```

Data flow:
```
InterviewItem[] → calendarEvents (mapped) → Calendar
                                              ↓ onSelectEvent
                                           selectedEvent state
                                              ↓
                                           EventDetailPanel (AnimatePresence)
```

## Related Code Files

**Create:**
- `src/app/dashboard/interviews/interview-calendar-view.tsx`
- `src/app/dashboard/interviews/interview-calendar-event-detail.tsx`

**Modify:** none (integration happens in phase 03)

## Implementation Steps

### Step 1 — Define event color map

```typescript
// interview-calendar-view.tsx

import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday first
  getDay,
  locales: { 'vi': vi },
});

const EVENT_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  pending:              { bg: '#FFB547', fg: '#0A1120', border: '#F59E0B' },
  accepted:             { bg: '#36DDAB', fg: '#0A1120', border: '#10B981' },
  declined:             { bg: '#FF6B82', fg: '#fff',    border: '#F43F5E' },
  reschedule_requested: { bg: '#7C8FFF', fg: '#fff',    border: '#6366F1' },
  // Completed interviews (status !== 'scheduled')
  completed:            { bg: '#334155', fg: '#8B99B0', border: '#475569' },
};
```

### Step 2 — Map InterviewItem → CalendarEvent

```typescript
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: InterviewItem; // full item attached for detail panel
}

function toCalendarEvents(interviews: InterviewItem[]): CalendarEvent[] {
  return interviews.map((item) => {
    const start = new Date(item.scheduled_at);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // assume 1h default
    const candidate = item.job_applications?.persons?.full_name ?? '—';
    const jd = item.job_applications?.job_descriptions?.title;
    return {
      id: item.id,
      title: jd ? `${candidate} · ${jd}` : candidate,
      start,
      end,
      resource: item,
    };
  });
}
```

### Step 3 — Custom event style getter

```typescript
function eventStyleGetter(event: CalendarEvent) {
  const item = event.resource as InterviewItem;
  const key = item.status !== 'scheduled' ? 'completed' : item.interviewer_status;
  const colors = EVENT_COLORS[key] ?? EVENT_COLORS.pending;
  return {
    style: {
      backgroundColor: colors.bg + '22', // 13% opacity bg
      borderLeft: `3px solid ${colors.border}`,
      color: colors.fg === '#0A1120' ? '#ECF0F7' : colors.fg,
      borderRadius: '4px',
    },
  };
}
```

### Step 4 — Custom toolbar component

Hide default `.rbc-toolbar` via CSS (already done in phase 01). Build a custom one:

```tsx
function CalendarToolbar({ date, view, onNavigate, onView }: ToolbarProps<CalendarEvent>) {
  const label = format(date, view === Views.WEEK ? "'Tuần' w, MMMM yyyy" : 'MMMM yyyy', { locale: vi });
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <button onClick={() => onNavigate('PREV')} className="...">‹</button>
        <button onClick={() => onNavigate('TODAY')} className="...">Hôm nay</button>
        <button onClick={() => onNavigate('NEXT')} className="...">›</button>
        <span className="text-sm font-medium text-[#ECF0F7] ml-2">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onView(Views.WEEK)} className={view === Views.WEEK ? 'active' : ''}>Tuần</button>
        <button onClick={() => onView(Views.MONTH)} className={view === Views.MONTH ? 'active' : ''}>Tháng</button>
      </div>
    </div>
  );
}
```

### Step 5 — Main calendar render

```tsx
export default function InterviewCalendarView({ interviews, userRole, onRefresh }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<InterviewItem | null>(null);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const events = useMemo(() => toCalendarEvents(interviews), [interviews]);

  return (
    <div className="relative">
      <Calendar
        localizer={localizer}
        events={events}
        view={view}
        date={date}
        onView={setView}
        onNavigate={setDate}
        onSelectEvent={(e) => setSelectedEvent(e.resource)}
        eventPropGetter={eventStyleGetter}
        components={{ toolbar: CalendarToolbar }}
        style={{ height: 640 }}
        culture="vi"
        messages={{ /* Vietnamese labels */ }}
      />
      <AnimatePresence>
        {selectedEvent && (
          <InterviewEventDetail
            item={selectedEvent}
            userRole={userRole}
            onClose={() => setSelectedEvent(null)}
            onRefresh={() => { onRefresh(); setSelectedEvent(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
```

### Step 6 — Event detail panel (`interview-calendar-event-detail.tsx`)

Slide-in panel from the right (desktop) or bottom (mobile). Reuses:
- `STATUS_CONFIG` (status badge + colors)
- `InterviewAcceptanceActions` (extracted to shared util if needed, or duplicated temporarily)
- `formatDateTime` helper

```tsx
// Framer Motion slide-in
<motion.div
  initial={{ x: '100%' }}
  animate={{ x: 0 }}
  exit={{ x: '100%' }}
  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
  className="absolute right-0 top-0 bottom-0 w-80 glass-card border-l border-white/8 p-5 z-20 flex flex-col gap-4 overflow-y-auto"
>
```

### Step 7 — Vietnamese messages config

```typescript
const messages = {
  today: 'Hôm nay',
  previous: '‹',
  next: '›',
  month: 'Tháng',
  week: 'Tuần',
  day: 'Ngày',
  agenda: 'Danh sách',
  date: 'Ngày',
  time: 'Giờ',
  event: 'Sự kiện',
  noEventsInRange: 'Không có lịch phỏng vấn trong khoảng thời gian này.',
  showMore: (total: number) => `+${total} nữa`,
};
```

## Todo

- [x] Create `interview-calendar-view.tsx` with localizer, event mapper, style getter, main render
- [x] Create `interview-calendar-event-detail.tsx` with framer-motion slide-in panel
- [x] Build custom toolbar component (prev/next/today + week/month toggle)
- [x] Wire `onSelectEvent` → detail panel open
- [x] Add Vietnamese `messages` config
- [x] Add `onClose` on ESC keydown + backdrop click
- [x] `npx tsc --noEmit` — no errors

## Success Criteria

- Calendar renders with dark theme
- Events show with correct status colors
- Clicking event opens detail panel
- Confirm/decline actions call API and refresh calendar
- Week and Month views both work
- Panel closes on ESC or outside click
- No TypeScript errors

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `InterviewAcceptanceActions` duplication | Low | Low | Extract to `interview-acceptance-actions.tsx` shared component if needed |
| Timezone display mismatch | Medium | Medium | Always use `item.timezone` via `Intl.DateTimeFormat` in detail panel, not Calendar's built-in |
| react-big-calendar month cell overflow on small screens | Medium | Low | `style={{ height: 600 }}` + `overflow: hidden` on month; week view handles better |
| date-fns locale import size | Low | Low | Only `vi` locale imported, minimal impact |
