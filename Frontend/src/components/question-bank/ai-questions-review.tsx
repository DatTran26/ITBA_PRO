"use client";

import { useState, useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AiQuestionCard } from "./ai-question-card";
import type { AiQuestion } from "./question-bank-types";

interface Props {
  documentId: string;
  questions: AiQuestion[];
  onQuestionsChange: (next: AiQuestion[]) => void;
  onApproved: (insertedCount: number) => void;
}

const LEVELS = ["junior", "middle", "senior"] as const;

export function AiQuestionsReview({
  documentId,
  questions,
  onQuestionsChange,
  onApproved,
}: Props) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(questions.map((_, i) => keyFor(i)))
  );
  const [levelOverride, setLevelOverride] = useState<string>("");
  const [loading, setLoading] = useState(false);

  function toggleAll() {
    setSelectedKeys((prev) =>
      prev.size === questions.length ? new Set() : new Set(questions.map((_, i) => keyFor(i)))
    );
  }

  function toggleOne(idx: number) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const k = keyFor(idx);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }

  function handleEdit(idx: number, patch: Partial<AiQuestion>) {
    onQuestionsChange(questions.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }

  function handleDelete(idx: number) {
    onQuestionsChange(questions.filter((_, i) => i !== idx));
    // Re-key selection: since indices shift, just keep selections by content after delete.
    setSelectedKeys((prev) => {
      const next = new Set<string>();
      questions.forEach((_, i) => {
        if (i !== idx && prev.has(keyFor(i))) {
          const newIdx = i > idx ? i - 1 : i;
          next.add(keyFor(newIdx));
        }
      });
      return next;
    });
  }

  async function approve() {
    if (selectedKeys.size === 0) {
      toast.error("Select at least one question");
      return;
    }
    setLoading(true);
    try {
      const toApprove = questions.filter((_, i) => selectedKeys.has(keyFor(i)));
      const body: Record<string, unknown> = { questions: toApprove };
      if (levelOverride) body.level_override = levelOverride;

      const res = await fetch(`/api/document-sources/${documentId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Approve failed");

      const { inserted, duplicates } = json as { inserted: number; duplicates: number };
      if (duplicates > 0) {
        toast.success(`${inserted} question${inserted !== 1 ? "s" : ""} added (${duplicates} duplicate${duplicates !== 1 ? "s" : ""} skipped)`);
      } else {
        toast.success(`${inserted} question${inserted !== 1 ? "s" : ""} added to Question Bank`);
      }
      onApproved(inserted);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setLoading(false);
    }
  }

  const allSelected = selectedKeys.size === questions.length && questions.length > 0;

  const grouped = useMemo(() => {
    const map = new Map<string, { q: AiQuestion; idx: number }[]>();
    questions.forEach((q, idx) => {
      const key = q.topic_tag ?? "Uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ q, idx });
    });
    return map;
  }, [questions]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={toggleAll}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {allSelected ? "Deselect all" : "Select all"} ({questions.length})
        </button>

        <div className="ml-auto flex items-center gap-3">
          <select
            value={levelOverride}
            onChange={(e) => setLevelOverride(e.target.value)}
            className="h-9 px-3 text-sm rounded-lg bg-muted/80 border border-border/20 text-muted-foreground focus:outline-none focus:border-border/40"
          >
            <option value="">Level from AI</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
            ))}
          </select>

          <Button
            onClick={approve}
            disabled={loading || selectedKeys.size === 0}
            className="bg-success hover:bg-success text-white border-0 h-9 px-5 rounded-xl gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading ? "Adding..." : `Add ${selectedKeys.size} to Bank`}
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {[...grouped.entries()].map(([tag, items]) => (
          <section key={tag} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{tag}</h3>
              <span className="text-xs bg-muted-foreground/10 text-muted-foreground px-2 py-0.5 rounded-full">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map(({ q, idx }) => (
                <AiQuestionCard
                  key={idx}
                  question={q}
                  index={idx}
                  isSelected={selectedKeys.has(keyFor(idx))}
                  onToggleSelect={() => toggleOne(idx)}
                  onChange={(patch) => handleEdit(idx, patch)}
                  onDelete={() => handleDelete(idx)}
                  effectiveLevel={levelOverride || q.level}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function keyFor(idx: number): string {
  return `q-${idx}`;
}
