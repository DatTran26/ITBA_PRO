"use client";

import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "destructive";
}

interface BulkActionBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClear: () => void;
}

export default function BulkActionBar({ selectedCount, actions, onClear }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B253B] border border-[#7C8FFF]/30 shadow-lg shadow-black/40">
      <span className="text-sm text-[#ECF0F7] font-medium mr-1">
        {selectedCount} selected
      </span>

      <div className="w-px h-5 bg-[#8B99B0]/20" />

      {actions.map((action) => (
        <Button
          key={action.label}
          size="sm"
          variant="ghost"
          onClick={action.onClick}
          className={`h-8 gap-1.5 text-xs ${
            action.variant === "destructive"
              ? "text-[#EF4444] hover:text-[#EF4444] hover:bg-[#EF4444]/10"
              : "text-[#ECF0F7] hover:bg-[#222C4A]"
          }`}
        >
          <action.icon className="w-3.5 h-3.5" />
          {action.label}
        </Button>
      ))}

      <div className="w-px h-5 bg-[#8B99B0]/20" />

      <Button
        size="sm"
        variant="ghost"
        onClick={onClear}
        className="h-8 w-8 p-0 text-[#5A6882] hover:text-[#ECF0F7]"
        aria-label="Clear selection"
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
