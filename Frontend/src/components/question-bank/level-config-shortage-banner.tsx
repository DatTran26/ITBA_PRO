"use client";

import { AlertTriangle, ArrowRight, Tag, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuestionType } from "./question-bank-types";

interface Shortage {
  type: QuestionType;
  requested: number;
  available: number;
  missing: number;
}

interface SubstitutionPreview {
  next: Record<QuestionType, number>;
  fills: Array<{ type: QuestionType; from: number; to: number }>;
  achievable: number;
  stillShort: number;
}

interface Props {
  shortages: Shortage[];
  substitutionPreview: SubstitutionPreview;
  totalRequested: number;
  totalAvailableForFilter: number;
  broaderAvailable: number;
  selectedTopics: string[];
  availability: { byType: Partial<Record<QuestionType, number>> } | null;
  onApplySubstitution: () => void;
  onExpandToAllTopics: () => void;
}

// Shortage banner with before/after substitution diff. Split out of level-config-step.tsx.
export default function LevelConfigShortageBanner({
  shortages,
  substitutionPreview,
  totalRequested,
  totalAvailableForFilter,
  broaderAvailable,
  selectedTopics,
  availability,
  onApplySubstitution,
  onExpandToAllTopics,
}: Props) {
  return (
    <div className="rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.07] to-orange-500/[0.04] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-amber-500/15 bg-amber-500/[0.04]">
        <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-200">Thiếu câu hỏi theo loại yêu cầu</p>
          <p className="text-[11px] text-amber-400/70 mt-0.5">
            Tổng cần <span className="font-mono text-amber-300">{totalRequested}</span>, bank có{" "}
            <span className="font-mono text-amber-300">{totalAvailableForFilter}</span>
            {selectedTopics.length > 0 && broaderAvailable > 0 && (
              <> · cùng level còn <span className="font-mono text-amber-300">{broaderAvailable}</span> ở topic khác</>
            )}
          </p>
        </div>
      </div>

      {/* Diff table */}
      <div className="px-4 py-3 space-y-2">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 gap-y-1.5 text-[11px] items-center">
          <div className="text-[10px] uppercase tracking-wider text-amber-400/60">Loại câu</div>
          <div className="text-[10px] uppercase tracking-wider text-amber-400/60 text-center">Cần</div>
          <div className="text-[10px] uppercase tracking-wider text-amber-400/60 text-center">Có</div>
          <div className="w-4" />
          <div className="text-[10px] uppercase tracking-wider text-emerald-400/70 text-center">Sau</div>

          {/* Each shortage row */}
          {shortages.map((s) => {
            const after = substitutionPreview.next[s.type] ?? 0;
            return (
              <div key={s.type} className="contents">
                <div className="font-mono text-amber-200">{s.type}</div>
                <div className="text-center text-amber-300 font-mono">{s.requested}</div>
                <div className="text-center text-red-400 font-mono">{s.available}</div>
                <ArrowRight className="w-3 h-3 text-amber-500/50 mx-auto" />
                <div className="text-center font-mono text-amber-300/70">{after}</div>
              </div>
            );
          })}

          {/* Each fill row (where deficit goes) */}
          {substitutionPreview.fills.map((f) => (
            <div key={`fill-${f.type}`} className="contents">
              <div className="font-mono text-emerald-300/90">{f.type}</div>
              <div className="text-center text-muted-foreground font-mono">—</div>
              <div className="text-center text-emerald-400/80 font-mono">{availability?.byType[f.type] ?? 0}</div>
              <ArrowRight className="w-3 h-3 text-emerald-500/50 mx-auto" />
              <div className="text-center font-mono text-emerald-300 font-semibold">
                {f.from} <span className="text-emerald-500/60">→</span> {f.to}
              </div>
            </div>
          ))}
        </div>

        {/* Total summary */}
        <div className="pt-2 mt-1 border-t border-amber-500/10 flex items-center justify-between text-[11px]">
          <span className="text-amber-400/70">Tổng sau khi áp dụng</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-amber-400/50 line-through">{totalRequested}</span>
            <ArrowRight className="w-3 h-3 text-amber-500/60" />
            <span className={`font-mono font-semibold ${substitutionPreview.achievable < totalRequested ? "text-amber-300" : "text-emerald-400"}`}>
              {substitutionPreview.achievable} câu
            </span>
            {substitutionPreview.stillShort > 0 && (
              <span className="text-red-400/80 ml-1">(vẫn thiếu {substitutionPreview.stillShort})</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-amber-500/15 bg-background/30">
        {selectedTopics.length > 0 && broaderAvailable > 0 && (
          <Button
            type="button"
            onClick={onExpandToAllTopics}
            variant="outline"
            className="h-8 px-3 rounded-md border-amber-500/40 bg-transparent text-amber-300 hover:bg-amber-500/10 text-xs gap-1.5"
            title="Drops the topic filter so substitution can pull from other topics at the same level"
          >
            <Tag className="w-3 h-3" />
            Bổ sung từ topic khác (+{broaderAvailable})
          </Button>
        )}
        <div className="flex-1" />
        <Button
          type="button"
          onClick={onApplySubstitution}
          className="h-8 px-4 rounded-md bg-amber-500 hover:bg-amber-600 text-black border-0 text-xs gap-1.5 font-medium shadow-lg shadow-amber-500/20"
        >
          <Wand2 className="w-3.5 h-3.5" />
          Áp dụng phương án này
        </Button>
      </div>
    </div>
  );
}
