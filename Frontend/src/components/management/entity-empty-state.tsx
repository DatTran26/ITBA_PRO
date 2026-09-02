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
      <div className="w-16 h-16 rounded-2xl bg-[#1E2840] border border-[#8B99B0]/10 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-[#5A6882]" />
      </div>
      <h3 className="text-lg font-semibold text-[#ECF0F7] mb-2">{title}</h3>
      <p className="text-sm text-[#5A6882] max-w-xs mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-[#7C8FFF] hover:bg-[#6B7FEF] text-white"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
