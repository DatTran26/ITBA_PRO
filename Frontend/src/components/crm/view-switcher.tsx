"use client";

import { LayoutList, LayoutGrid, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ViewMode = "table" | "card" | "kanban";

interface ViewSwitcherProps {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
  /** Show only these views. Defaults to all. */
  views?: ViewMode[];
}

const VIEWS: { mode: ViewMode; icon: typeof LayoutList; label: string }[] = [
  { mode: "table", icon: LayoutList, label: "Table view" },
  { mode: "card", icon: LayoutGrid, label: "Card view" },
  { mode: "kanban", icon: Columns3, label: "Kanban view" },
];

export default function ViewSwitcher({ value, onChange, views }: ViewSwitcherProps) {
  const visible = views ? VIEWS.filter((v) => views.includes(v.mode)) : VIEWS;
  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#1B253B]/60 border border-white/5 backdrop-blur-md shadow-inner">
      {visible.map(({ mode, icon: Icon, label }) => (
        <Button
          key={mode}
          size="icon"
          variant="ghost"
          aria-label={label}
          onClick={() => onChange(mode)}
          className={`h-9 w-9 rounded-xl transition-all duration-300 ${
            value === mode
              ? "bg-[#7C8FFF] text-white shadow-lg shadow-[#7C8FFF]/20 scale-105"
              : "text-[#5A6882] hover:text-[#ECF0F7] hover:bg-white/5"
          }`}
        >
          <Icon className="w-4.5 h-4.5" />
        </Button>
      ))}
    </div>
  );
}
