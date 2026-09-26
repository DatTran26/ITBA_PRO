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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted border border-border/30 shadow-lg shadow-black/40">
      <span className="text-sm text-foreground font-medium mr-1">
        {selectedCount} selected
      </span>

      <div className="w-px h-5 bg-muted-foreground/20" />

      {actions.map((action) => (
        <Button
          key={action.label}
          size="sm"
          variant="ghost"
          onClick={action.onClick}
          className={`h-8 gap-1.5 text-xs ${
            action.variant === "destructive"
              ? "text-danger hover:text-danger hover:bg-danger/10"
              : "text-foreground hover:bg-accent"
          }`}
        >
          <action.icon className="w-3.5 h-3.5" />
          {action.label}
        </Button>
      ))}

      <div className="w-px h-5 bg-muted-foreground/20" />

      <Button
        size="sm"
        variant="ghost"
        onClick={onClear}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        aria-label="Clear selection"
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
