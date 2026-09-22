"use client";

import type { ReactNode } from "react";

interface KanbanColumnProps {
  label: string;
  color: string;
  count: number;
  children: ReactNode;
}

export default function KanbanColumn({ label, color, count, children }: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[260px] max-w-[300px] bg-muted border border-border/10 rounded-lg">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/10">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-medium text-foreground truncate">{label}</span>
        <span className="ml-auto text-xs text-muted-foreground bg-accent rounded-full px-2 py-0.5">
          {count}
        </span>
      </div>

      {/* Scrollable card list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[60vh]">
        {count === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs text-muted-foreground">No items</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
