"use client";

import { Button } from "@/components/ui/button";
import { type LucideIcon } from "lucide-react";

interface EntityEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EntityEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EntityEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted border border-border/10 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-primary hover:bg-primary text-white"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
