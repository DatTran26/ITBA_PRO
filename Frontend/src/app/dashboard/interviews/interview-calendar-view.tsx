"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { vi } from "date-fns/locale";
import InterviewEventDetail from "./interview-calendar-event-detail";
import WeekGrid, { type CalendarEvent, type InterviewItem } from "./interview-calendar-week-grid";
import MonthGrid from "./interview-calendar-month-grid";

interface Props {
  interviews: InterviewItem[];
  userRole: string;
  onRefresh: () => void;
}

type ViewMode = "week" | "month";

function toCalendarEvents(interviews: InterviewItem[]): CalendarEvent[] {
  return interviews.map(item => {
    const start = new Date(item.scheduled_at);
    const end = new Date(start.getTime() + (item.duration_minutes ?? 60) * 60 * 1000);
    const candidate = item.job_applications?.persons?.full_name ?? "—";
    const jd = item.job_applications?.job_descriptions?.title;
    return { id: item.id, title: jd ? `${candidate} · ${jd}` : candidate, start, end, resource: item };
  });
}

export default function InterviewCalendarView({ interviews, userRole, onRefresh }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [date, setDate] = useState(new Date());
  const [popup, setPopup] = useState<{ item: InterviewItem; anchorRect: DOMRect } | null>(null);

  const events = useMemo(() => toCalendarEvents(interviews), [interviews]);

  const navigate = (dir: 1 | -1) =>
    setDate(prev =>
      viewMode === "week"
        ? dir === 1 ? addWeeks(prev, 1) : subWeeks(prev, 1)
        : dir === 1 ? addMonths(prev, 1) : subMonths(prev, 1)
    );

  const label = format(date, viewMode === "week" ? "'Tuần' w, MMMM yyyy" : "MMMM yyyy", { locale: vi });

  const btnBase = "w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-[#5A6882] hover:text-[#ECF0F7] hover:bg-white/10 hover:border-white/15 transition-all duration-200 cursor-pointer";
  const tabBase = "inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer";

  return (
    <div className="relative flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className={btnBase}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDate(new Date())}
            className="h-8 px-3 rounded-xl bg-white/5 border border-white/8 text-xs font-medium text-[#5A6882] hover:text-[#ECF0F7] hover:bg-white/10 hover:border-white/15 transition-all duration-200 cursor-pointer"
          >
            Hôm nay
          </button>
          <button onClick={() => navigate(1)} className={btnBase}>
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-[#ECF0F7] ml-1 capitalize tracking-wide">{label}</span>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/4 border border-white/8">
          {(["week", "month"] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`${tabBase} ${viewMode === v
                ? "bg-[#7C8FFF]/15 text-[#B6C2FF] border border-[#7C8FFF]/30"
                : "text-[#5A6882] hover:text-[#8B99B0] border border-transparent"
              }`}
            >
              {v === "week" ? "Tuần" : "Tháng"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {viewMode === "week" ? (
        <WeekGrid date={date} events={events} onSelectEvent={(item, rect) => setPopup({ item, anchorRect: rect })} />
      ) : (
        <MonthGrid date={date} events={events} onSelectEvent={(item, rect) => setPopup({ item, anchorRect: rect })} />
      )}

      {/* Floating detail popup */}
      <AnimatePresence>
        {popup && (
          <InterviewEventDetail
            key={popup.item.id}
            item={popup.item}
            anchorRect={popup.anchorRect}
            userRole={userRole}
            onClose={() => setPopup(null)}
            onRefresh={() => { onRefresh(); setPopup(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
