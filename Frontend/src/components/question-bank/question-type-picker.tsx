"use client";

import { cn } from "@/lib/utils";
import { QuestionType, QUESTION_TYPE_OPTIONS } from "./question-bank-types";

interface QuestionTypePickerProps {
  value: QuestionType[];
  onChange: (value: QuestionType[]) => void;
  className?: string;
}

export default function QuestionTypePicker({
  value,
  onChange,
  className,
}: QuestionTypePickerProps) {
  const toggleType = (type: QuestionType) => {
    if (value.includes(type)) {
      onChange(value.filter((v) => v !== type));
    } else {
      onChange([...value, type]);
    }
  };

  const handleSelectAll = () => {
    onChange(QUESTION_TYPE_OPTIONS.map((opt) => opt.value));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Question Types
        </p>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs text-primary hover:text-primary transition-colors font-medium bg-transparent border-0 cursor-pointer"
          >
            Select All
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium bg-transparent border-0 cursor-pointer"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUESTION_TYPE_OPTIONS.map((opt) => {
          const isSelected = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleType(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer select-none",
                isSelected
                  ? "bg-primary/15 border-border/40 text-primary shadow-[0_2px_8px_color-mix(in_srgb,var(--primary)_15%,transparent)]"
                  : "bg-card/40 border-border/10 text-muted-foreground hover:border-border/20 hover:text-foreground hover:bg-muted/30"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
