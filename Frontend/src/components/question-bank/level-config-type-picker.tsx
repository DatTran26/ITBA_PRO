"use client";

import { QUESTION_TYPE_OPTIONS } from "./question-bank-types";
import type { QuestionType } from "./question-bank-types";

interface Props {
  hideTypePicker: boolean;
  typeCounts: Record<QuestionType, number>;
  setTypeCounts: React.Dispatch<React.SetStateAction<Record<QuestionType, number>>>;
  availability: {
    total: number;
    byType: Partial<Record<QuestionType, number>>;
  } | null;
  loadingAvailability: boolean;
}

// Question-type counts picker (with inline availability) of the level-config step.
// Split out of level-config-step.tsx.
export default function LevelConfigTypePicker({
  hideTypePicker,
  typeCounts,
  setTypeCounts,
  availability,
  loadingAvailability,
}: Props) {
  if (hideTypePicker) {
    return (
      <div className="text-xs text-[#8B99B0] bg-[#1E2840]/50 border border-[#8B99B0]/15 rounded-lg px-3 py-2">
        Question type counts are synced from <span className="text-[#7C8FFF]">Format Weights</span> on the right panel.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-[#8B99B0] font-medium uppercase tracking-wider">
          Question types (optional)
        </p>
        {availability && (
          <span className="text-[11px] text-[#5A6882]">
            {loadingAvailability ? "Checking..." : `Bank: ${availability.total} available for current filter`}
          </span>
        )}
      </div>
      <p className="text-xs text-[#5A6882] mb-3">
        Leave empty to let the bank fill any type. Numbers shown next to each input = how many are in the bank for your level + topic filter.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
        {QUESTION_TYPE_OPTIONS.map((type) => {
          const available = availability?.byType[type.value] ?? 0;
          const requested = typeCounts[type.value] ?? 0;
          const isShort = requested > available;
          return (
            <label
              key={type.value}
              className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs ${
                isShort
                  ? "border-amber-500/30 bg-amber-500/5 text-amber-300"
                  : "border-[#8B99B0]/10 bg-[#1E2840]/40 text-[#8B99B0]"
              }`}
            >
              <span className="flex-1 truncate">{type.label}</span>
              {availability && (
                <span className={`text-[10px] font-mono ${isShort ? "text-amber-400" : "text-[#5A6882]"}`}>
                  {requested}/{available}
                </span>
              )}
              <input
                type="number"
                min={0}
                max={200}
                value={requested}
                onChange={(event) => setTypeCounts((prev) => ({
                  ...prev,
                  [type.value]: Math.max(0, parseInt(event.target.value, 10) || 0),
                }))}
                className="w-16 h-7 px-2 text-xs rounded-md bg-[#0C1220]/80 border border-[#8B99B0]/20 text-[#ECF0F7] focus:outline-none focus:border-[#10B981]/40 text-center"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
