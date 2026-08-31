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
        <p className="text-xs text-[#8B99B0] font-medium uppercase tracking-wider">
          Question Types
        </p>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs text-[#7C8FFF] hover:text-[#5B6CF0] transition-colors font-medium bg-transparent border-0 cursor-pointer"
          >
            Select All
          </button>
          <span className="text-[#5A6882]">|</span>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-[#8B99B0] hover:text-[#ECF0F7] transition-colors font-medium bg-transparent border-0 cursor-pointer"
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
                  ? "bg-[#5B6CF0]/15 border-[#5B6CF0]/40 text-[#7C8FFF] shadow-[0_2px_8px_rgba(91,108,240,0.15)]"
                  : "bg-[#161E30]/40 border-[#8B99B0]/10 text-[#8B99B0] hover:border-[#8B99B0]/20 hover:text-[#ECF0F7] hover:bg-[#1E2840]/30"
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
