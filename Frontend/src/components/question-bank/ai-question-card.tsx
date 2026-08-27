"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Sparkles, Trash2, X, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiQuestionAnswerRenderer } from "./ai-question-answer-renderer";
import type { AiQuestion } from "./question-bank-types";

const LEVELS = ["junior", "middle", "senior"] as const;
const LEVEL_COLORS: Record<string, string> = {
  junior: "bg-blue-500/15 text-blue-400",
  middle: "bg-amber-500/15 text-amber-400",
  senior: "bg-purple-500/15 text-purple-400",
};

interface Props {
  question: AiQuestion;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onChange: (patch: Partial<AiQuestion>) => void;
  onDelete: () => void;
  effectiveLevel: string;
}

export function AiQuestionCard({
  question: q,
  isSelected,
  onToggleSelect,
  onChange,
  onDelete,
  effectiveLevel,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  return (
    <div
      className={`rounded-xl border transition-colors ${
        isSelected
          ? "border-[#10B981]/30 bg-[#10B981]/5"
          : "border-[#8B99B0]/10 bg-[#1E2840]/40"
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <button
          type="button"
          onClick={onToggleSelect}
          className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border transition-colors ${
            isSelected ? "bg-[#10B981] border-[#10B981]" : "border-[#8B99B0]/40"
          }`}
          aria-label={isSelected ? "Deselect" : "Select"}
        >
          {isSelected && (
            <svg viewBox="0 0 16 16" fill="none" className="w-full h-full p-0.5">
              <path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0 space-y-2">
          {editing ? (
            <Textarea
              value={q.question_text}
              onChange={(e) => onChange({ question_text: e.target.value })}
              className="text-sm bg-[#0C1220]/60 border-[#8B99B0]/20"
              rows={2}
            />
          ) : (
            <p className="text-sm text-[#ECF0F7] leading-snug">{q.question_text}</p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#8B99B0]/10 text-[#8B99B0]">
              {q.question_type ?? "single_choice"}
            </span>
            {editing ? (
              <select
                value={q.level}
                onChange={(e) => onChange({ level: e.target.value })}
                className="text-xs h-6 px-2 rounded bg-[#0C1220]/80 border border-[#8B99B0]/20 text-[#ECF0F7]"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            ) : (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[effectiveLevel] ?? LEVEL_COLORS.junior}`}>
                {effectiveLevel}
              </span>
            )}

            <div className="ml-auto flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditing((v) => !v)}
                className="h-7 px-2 text-xs text-[#5A6882] hover:text-[#7C8FFF]"
              >
                {editing ? <X className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                {editing ? "Done" : "Edit"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-7 px-2 text-xs text-[#5A6882] hover:text-red-400"
                aria-label="Delete question"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="h-7 px-2 flex items-center gap-1 text-xs text-[#5A6882] hover:text-[#8B99B0]"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pl-11 space-y-3">
          <AiQuestionAnswerRenderer question={q} editing={editing} onChange={onChange} />

          {q.source_excerpt && (
            <div className="flex gap-2 text-xs text-[#94A3B8] bg-[#7C8FFF]/5 border border-[#7C8FFF]/15 rounded-lg px-3 py-2 italic">
              <Quote className="w-3.5 h-3.5 text-[#7C8FFF] flex-shrink-0 mt-0.5" />
              <span>&ldquo;{q.source_excerpt}&rdquo;</span>
            </div>
          )}

          {(q.explanation || editing) && (
            <div className="flex gap-2 text-xs text-[#5A6882] bg-[#8B99B0]/5 rounded-lg px-3 py-2">
              <Sparkles className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0 mt-0.5" />
              {editing ? (
                <Textarea
                  value={q.explanation ?? ""}
                  onChange={(e) => onChange({ explanation: e.target.value })}
                  className="text-xs bg-transparent border-[#8B99B0]/20"
                  rows={2}
                  placeholder="Explanation (optional)"
                />
              ) : (
                <span>{q.explanation}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
