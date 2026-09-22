"use client";

import { useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { BankQuestion, LevelConfig, ShortageProposal } from "./question-bank-types";

interface Props {
  questions: BankQuestion[];
  config: LevelConfig;
  shortageProposal?: ShortageProposal | null;
  onConfirmed: (questions: BankQuestion[]) => void;
  onAcceptSubstitution?: () => void;
  onBack: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
  junior: "bg-blue-500/15 text-blue-400",
  middle: "bg-amber-500/15 text-amber-400",
  senior: "bg-purple-500/15 text-purple-400",
};

export default function QuestionPullPreview({ questions: initial, config, shortageProposal, onConfirmed, onAcceptSubstitution, onBack }: Props) {
  const [questions, setQuestions] = useState<BankQuestion[]>(initial);
  const [swapping, setSwapping] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // Questions list is hidden by default — user confirms by count first, opens to inspect/swap.
  const [showQuestions, setShowQuestions] = useState(false);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSwap(q: BankQuestion) {
    setSwapping(q.id);
    try {
      const excludeIds = questions.map((x) => x.id);
      const body: Record<string, unknown> = { level: q.level, excludeIds };
      if (config.topics && config.topics.length > 0) body.topics = config.topics;

      const res = await fetch("/api/question-bank/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Swap failed");

      if (!json.question) {
        toast.error("No alternative question available for this level");
        return;
      }

      setQuestions((prev) => prev.map((x) => (x.id === q.id ? json.question : x)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Swap failed");
    } finally {
      setSwapping(null);
    }
  }

  const shortage = config.total - questions.length;

  return (
    <div className="space-y-4">
      {/* Warning banner */}
      {shortage > 0 && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 text-sm text-amber-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Only {questions.length} question{questions.length !== 1 ? "s" : ""} available -{" "}
            {shortage} fewer than requested. Add more questions to the bank to fill the gap.
          </span>
        </div>
      )}

      {shortageProposal && shortageProposal.items.length > 0 && (
        <div className="space-y-3 bg-orange-500/10 border border-orange-500/25 rounded-xl px-4 py-3 text-sm text-orange-300">
          <div className="font-medium">Thiếu câu hỏi theo loại yêu cầu.</div>
          {shortageProposal.items.map((item) => (
            <div key={item.question_type} className="text-xs">
              {item.question_type}: cần {item.requested}, có {item.available}, thiếu {item.missing}. Gợi ý thay thế: {item.proposed_substitutes.map((sub) => `${sub.question_type} (+${sub.count})`).join(", ") || "không đủ dữ liệu"}
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Button
              onClick={onAcceptSubstitution}
              disabled={!onAcceptSubstitution}
              className="h-8 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-foreground border-0 text-xs"
            >
              Chấp nhận phương án thay thế
            </Button>
          </div>
        </div>
      )}

      {/* Summary row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground whitespace-nowrap">
          {questions.length} question{questions.length !== 1 ? "s" : ""} ready to add
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setShowQuestions((v) => !v)}
            className="h-8 px-3 rounded-lg border border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5 text-xs"
          >
            {showQuestions ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showQuestions ? "Hide questions" : "Preview questions"}
          </Button>
          <Button
            variant="outline"
            onClick={onBack}
            className="h-8 px-3 rounded-lg border border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5 text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Reconfigure
          </Button>
          <Button
            onClick={() => onConfirmed(questions)}
            disabled={questions.length === 0 || !!shortageProposal}
            className="h-8 px-4 rounded-lg bg-success hover:bg-success text-white border-0 gap-1.5 text-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirm {questions.length} questions
          </Button>
        </div>
      </div>

      {/* Question list — hidden until reviewer opts in via the Preview toggle */}
      {showQuestions && (
      <div className="space-y-2">
        {questions.map((q) => {
          const isExpanded = expanded.has(q.id);
          const isSwapping = swapping === q.id;

          return (
            <div
              key={q.id}
              className="rounded-xl border border-border/10 bg-muted/40"
            >
              <div className="flex items-start gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-foreground leading-snug">{q.question_text}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {q.topic_tag && (
                        <span className="text-xs bg-muted-foreground/10 text-muted-foreground px-2 py-0.5 rounded-full">
                          {q.topic_tag}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[q.level] ?? LEVEL_COLORS.junior}`}>
                        {q.level}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() => toggleExpand(q.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-muted-foreground transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isExpanded ? "Hide" : "Show"} answers
                    </button>

                    <button
                      onClick={() => handleSwap(q)}
                      disabled={isSwapping}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-muted-foreground transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSwapping ? "animate-spin" : ""}`} />
                      {isSwapping ? "Swapping..." : "Swap"}
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(["a", "b", "c", "d"] as const).map((opt) => (
                      <div
                        key={opt}
                        className={`text-xs px-3 py-2 rounded-lg border ${
                          q.correct_answer === opt
                            ? "border-border/40 bg-success/10 text-success"
                            : "border-border/10 bg-background/60 text-muted-foreground"
                        }`}
                      >
                        <span className="font-mono font-bold uppercase mr-2">{opt}.</span>
                        {q[`option_${opt}` as keyof BankQuestion] as string}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="text-xs text-muted-foreground bg-muted-foreground/5 rounded-lg px-3 py-2">
                      {q.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
