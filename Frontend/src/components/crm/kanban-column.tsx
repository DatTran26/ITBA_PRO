"use client";

import type { ReactNode } from "react";

interface KanbanColumnProps {
  label: string;
  color: string;
  count: number;
  children: ReactNode;
}

/** Làn kanban theo ngôn ngữ HR: nền làn nhạt, vạch màu trạng thái trên đầu, đếm pill. */
export default function KanbanColumn({ label, color, count, children }: KanbanColumnProps) {
  return (
    <div className={`flex flex-col shrink-0 rounded-2xl border overflow-hidden ${count ? "w-[280px]" : "w-[200px]"}`}
         style={{ backgroundColor: `color-mix(in srgb, ${color} 7%, var(--card))`, borderColor: `color-mix(in srgb, ${color} 22%, var(--card))` }}>
      <span className="h-1" style={{ backgroundColor: color }} />
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-sm font-extrabold text-foreground truncate">{label}</span>
        <span className="ml-auto rounded-full bg-card px-2 py-0.5 text-xs font-bold tabular-nums text-muted-foreground">
          {count}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-2.5 pb-2.5 space-y-2 max-h-[68vh]">
        {count === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Trống</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
