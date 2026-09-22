"use client";

import { useEffect, useRef, useMemo } from "react";

type InterviewerStatus = "pending" | "accepted" | "declined" | "reschedule_requested";

export interface InterviewItem {
  id: string;
  job_application_id: string;
  scheduled_at: string;
  duration_minutes?: number;
  timezone: string;
  recruiter_note: string | null;
  status: "scheduled" | "completed" | "cancelled";
  interviewer_status: InterviewerStatus;
  interviewer_proposed_at: string | null;
  interviewer_note: string | null;
  job_applications: {
    id: string; pipeline_status: string;
    persons: { id: string; full_name: string; email: string } | null;
    job_descriptions: { id: string; title: string; department: string | null } | null;
  } | null;
  interview_results: Array<{ id: string; result: "pass" | "fail"; note: string | null; submitted_at: string }>;
}

export interface CalendarEvent {
  id: string; title: string; start: Date; end: Date; resource: InterviewItem;
}

interface Props {
  date: Date;
  events: CalendarEvent[];
  onSelectEvent: (item: InterviewItem, rect: DOMRect) => void;
}

const HOUR_HEIGHT = 52;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
// Short Vietnamese weekday labels — mirrors Google Calendar's compact header
const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const EVENT_COLORS: Record<string, { bg: string; text: string; sub: string }> = {
  pending:              { bg: "color-mix(in srgb, var(--warning) 22%, transparent)",  text: "var(--warning)", sub: "color-mix(in srgb, var(--warning) 60%, transparent)" },
  accepted:             { bg: "color-mix(in srgb, var(--success) 20%, transparent)",  text: "var(--success)", sub: "color-mix(in srgb, var(--success) 60%, transparent)" },
  declined:             { bg: "color-mix(in srgb, var(--danger) 18%, transparent)",   text: "var(--danger)", sub: "color-mix(in srgb, var(--danger) 60%, transparent)" },
  reschedule_requested: { bg: "color-mix(in srgb, var(--primary) 22%, transparent)",  text: "var(--primary)", sub: "color-mix(in srgb, var(--primary) 60%, transparent)" },
  completed:            { bg: "color-mix(in srgb, var(--primary) 38%, transparent)",   text: "var(--foreground)", sub: "color-mix(in srgb, var(--primary) 60%, transparent)" },
};

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getWeekDays(anchor: Date): Date[] {
  const dow = anchor.getDay();
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function EventBlock({ event, onClickWithRect }: { event: CalendarEvent; onClickWithRect: (item: InterviewItem, r: DOMRect) => void }) {
  const item = event.resource;
  const colorKey = item.status !== "scheduled" ? "completed" : item.interviewer_status;
  const { bg, text, sub } = EVENT_COLORS[colorKey] ?? EVENT_COLORS.pending;
  const startFrac = event.start.getHours() + event.start.getMinutes() / 60;
  const endFrac   = event.end.getHours()   + event.end.getMinutes()   / 60;
  const px = Math.max((endFrac - startFrac) * HOUR_HEIGHT, 24);
  const showSub = px >= 42;
  const candidate = item.job_applications?.persons?.full_name ?? "—";

  return (
    <button
      onClick={e => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        onClickWithRect(item, rect);
      }}
      style={{ top: startFrac * HOUR_HEIGHT, height: px, backgroundColor: bg }}
      className="absolute left-0.5 right-0.5 rounded-[6px] px-2 py-1 text-left cursor-pointer hover:brightness-110 hover:scale-[1.01] active:scale-[0.98] transition-all duration-150 overflow-hidden"
    >
      <p style={{ color: text }} className="text-[11px] font-semibold leading-tight truncate">{candidate}</p>
      {showSub && (
        <p style={{ color: sub }} className="text-[10px] leading-tight truncate mt-0.5">
          {fmtTime(event.start)} – {fmtTime(event.end)}
        </p>
      )}
    </button>
  );
}

export default function WeekGrid({ date, events, onSelectEvent }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const days = useMemo(() => getWeekDays(date), [date]);
  const currentTimeTop = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, (now.getHours() - 2) * HOUR_HEIGHT);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    days.forEach(d => map.set(d.toDateString(), []));
    events.forEach(e => { const b = map.get(e.start.toDateString()); if (b) b.push(e); });
    return map;
  }, [days, events]);

  return (
    <div className="glass-card overflow-hidden rounded-2xl border border-border">
      {/* Single scroll container — header lives inside so widths always match */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: 672 }}>
        {/* ── Sticky day header ─────────────────────────────────────── */}
        <div
          className="sticky top-0 z-20 grid bg-background border-b border-border"
          style={{ gridTemplateColumns: "3rem repeat(7, 1fr)" }}
        >
          <div className="border-r border-border h-[72px] bg-background" />
          {days.map((day, i) => {
            const isToday = sameDay(day, now);
            return (
              <div key={i} className={`flex flex-col items-center justify-center h-[72px] border-r border-border last:border-r-0 gap-1 ${isToday ? "bg-primary/[0.05]" : ""}`}>
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{DAY_LABELS[i]}</span>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[18px] font-light transition-all ${isToday ? "bg-primary text-white font-semibold shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_55%,transparent)]" : "text-muted-foreground hover:bg-muted cursor-default"}`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Time grid ─────────────────────────────────────────────── */}
        <div className="flex" style={{ height: 24 * HOUR_HEIGHT }}>
          {/* Time labels */}
          <div className="w-12 shrink-0 relative border-r border-border bg-background">
            {HOURS.map(h => h > 0 && (
              <div key={h} className="absolute right-2 text-[10px] font-medium text-muted-foreground select-none tabular-nums tracking-wide" style={{ top: h * HOUR_HEIGHT - 7 }}>
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="flex-1 relative grid grid-cols-7">
            {/* Hour lines */}
            {HOURS.map(h => (
              <div key={h} className={`absolute left-0 right-0 border-t ${h % 2 === 0 ? "border-white/[0.05]" : "border-white/[0.025]"}`} style={{ top: h * HOUR_HEIGHT }} />
            ))}

            {/* Day columns */}
            {days.map((day, i) => {
              const isToday = sameDay(day, now);
              const dayEvts = eventsByDay.get(day.toDateString()) ?? [];
              return (
                <div key={i} className={`relative border-r border-white/[0.04] last:border-r-0 ${isToday ? "bg-primary/[0.018]" : ""}`}>
                  {/* Current-time indicator — only inside today's column */}
                  {isToday && (
                    <div className="absolute left-0 right-0 z-10 flex items-center pointer-events-none" style={{ top: currentTimeTop }}>
                      <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_color-mix(in_srgb,var(--danger)_90%,transparent)] shrink-0 -ml-[4px]" />
                      <div className="flex-1 h-px bg-gradient-to-r from-red-500/80 to-red-500/20" />
                    </div>
                  )}
                  {dayEvts.map(event => (
                    <EventBlock key={event.id} event={event} onClickWithRect={onSelectEvent} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
