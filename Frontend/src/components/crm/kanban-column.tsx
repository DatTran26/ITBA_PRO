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
    <div className="flex flex-col min-w-[260px] max-w-[300px] bg-[#1B253B] border border-[#8B99B0]/10 rounded-lg">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#8B99B0]/10">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-medium text-[#ECF0F7] truncate">{label}</span>
        <span className="ml-auto text-xs text-[#5A6882] bg-[#222C4A] rounded-full px-2 py-0.5">
          {count}
        </span>
      </div>

      {/* Scrollable card list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[60vh]">
        {count === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs text-[#5A6882]">No items</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
