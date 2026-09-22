"use client";

import { useMemo } from "react";
import type { CalendarEvent, InterviewItem } from "./interview-calendar-week-grid";

interface Props {
  date: Date;
  events: CalendarEvent[];
  onSelectEvent: (item: InterviewItem, rect: DOMRect) => void;
}

const DAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

const EVENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  pending:              { bg: "color-mix(in srgb, var(--warning) 12%, transparent)",  border: "var(--warning)", text: "var(--warning)" },
  accepted:             { bg: "color-mix(in srgb, var(--success) 12%, transparent)",  border: "var(--success)", text: "var(--success)" },
  declined:             { bg: "color-mix(in srgb, var(--danger) 12%, transparent)",   border: "var(--danger)", text: "var(--danger)" },
  reschedule_requested: { bg: "color-mix(in srgb, var(--primary) 15%, transparent)",  border: "var(--primary)", text: "var(--primary)" },
  completed:            { bg: "color-mix(in srgb, var(--primary) 25%, transparent)",   border: "var(--muted-foreground)", text: "var(--muted-foreground)" },
};

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getMonthGrid(anchor: Date): Date[][] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstDay = new Date(year, month, 1);
  const dow = firstDay.getDay();
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - (dow === 0 ? 6 : dow - 1));
  const cur = new Date(start);
  return Array.from({ length: 6 }, () =>
    Array.from({ length: 7 }, () => { const d = new Date(cur); cur.setDate(cur.getDate() + 1); return d; })
  );
}

export default function MonthGrid({ date, events, onSelectEvent }: Props) {
  const now = new Date();
  const currentMonth = date.getMonth();
  const weeks = useMemo(() => getMonthGrid(date), [date]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(e => {
      const key = e.start.toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return map;
  }, [events]);

  return (
    <div className="glass-card overflow-hidden rounded-2xl border border-border">
      {/* DOW headers */}
      <div className="grid grid-cols-7 bg-background border-b border-border">
        {DAY_LABELS.map(d => (
          <div key={d} className="py-3 text-center text-[9px] font-semibold uppercase tracking-widest text-muted-foreground border-r border-border last:border-r-0">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-white/[0.04] last:border-b-0">
          {week.map((day, di) => {
            const isToday = sameDay(day, now);
            const inMonth = day.getMonth() === currentMonth;
            const dayEvts = eventsByDay.get(day.toDateString()) ?? [];
            const visible = dayEvts.slice(0, 3);
            const overflow = dayEvts.length - 3;

            return (
              <div
                key={di}
                className={[
                  "min-h-[100px] p-2 border-r border-white/[0.04] last:border-r-0 flex flex-col gap-0.5",
                  isToday ? "bg-primary/[0.04]" : "",
                  !inMonth ? "opacity-30" : "",
                ].join(" ")}
              >
                {/* Date number */}
                <div className="flex justify-end mb-0.5">
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium select-none ${isToday ? "bg-primary text-white font-semibold shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_50%,transparent)]" : "text-muted-foreground"}`}>
                    {day.getDate()}
                  </span>
                </div>

                {/* Event pills */}
                {visible.map(event => {
                  const item = event.resource;
                  const colorKey = item.status !== "scheduled" ? "completed" : item.interviewer_status;
                  const { bg, border, text } = EVENT_COLORS[colorKey] ?? EVENT_COLORS.pending;
                  return (
                    <button
                      key={event.id}
                      onClick={e => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        onSelectEvent(item, rect);
                      }}
                      style={{ backgroundColor: bg, borderLeft: `2px solid ${border}` }}
                      className="w-full text-left px-1.5 py-0.5 rounded text-[10px] truncate cursor-pointer hover:brightness-125 transition-all duration-150"
                    >
                      <span style={{ color: text }}>{event.title}</span>
                    </button>
                  );
                })}

                {overflow > 0 && (
                  <span className="text-[9px] text-primary font-semibold pl-1 mt-0.5">+{overflow} nữa</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
