"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { TopicCard } from "./topic-card";
import LevelRatio from "./level-ratio";
import QuestionTypePicker from "./question-type-picker";
import type { DocumentTopic, QuestionType } from "./question-bank-types";

interface Props {
  documentId: string;
  onGenerateQuestions: (config: {
    approvedTopicIds: string[];
    perTopicCounts: Record<string, number>;
    levelRatio: { junior: number; middle: number; senior: number };
    questionTypes: string[];
  }) => Promise<void>;
  generating?: boolean;
}

export function TopicReviewPanel({
  documentId,
  onGenerateQuestions,
  generating = false,
}: Props) {
  const [topics, setTopics] = useState<DocumentTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Phase 2: topic review config states
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [ratios, setRatios] = useState({ junior: 40, middle: 40, senior: 20 });
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(["multiple_choice"]);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/document-sources/${documentId}/topics`);
      if (!res.ok) throw new Error(await res.text());
      const data: DocumentTopic[] = await res.json();
      setTopics(data);
      setCounts((prev) => {
        const next = { ...prev };
        data.forEach((t) => {
          if (next[t.id] === undefined) {
            next[t.id] = 5;
          }
        });
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load topics");
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  async function handleUpdate(
    id: string,
    patch: Partial<Pick<DocumentTopic, "title" | "summary" | "key_points" | "is_approved">>
  ) {
    const res = await fetch(`/api/document-topics/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(await res.text());
    const updated: DocumentTopic = await res.json();
    setTopics((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/document-topics/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    setTopics((prev) => prev.filter((t) => t.id !== id));
  }

  function handleApproveAll(approved: boolean) {
    topics.forEach((t) => {
      if (t.is_approved !== approved) {
        handleUpdate(t.id, { is_approved: approved });
      }
    });
    setTopics((prev) => prev.map((t) => ({ ...t, is_approved: approved })));
  }

  const approvedIds = topics.filter((t) => t.is_approved).map((t) => t.id);
  const allApproved = topics.length > 0 && approvedIds.length === topics.length;

  const totalQuestions = approvedIds.reduce((sum, id) => sum + (counts[id] || 5), 0);
  const isRatioValid = Math.abs(ratios.junior + ratios.middle + ratios.senior - 100) < 0.01;
  const isTypesValid = questionTypes.length > 0;
  const isTotalValid = totalQuestions > 0 && totalQuestions <= 100;
  const canGenerate = approvedIds.length > 0 && isRatioValid && isTypesValid && isTotalValid;

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Loading topics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchTopics}>
          Retry
        </Button>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No topics extracted. Try re-running topic extraction.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">
          {approvedIds.length} / {topics.length} topics approved
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleApproveAll(!allApproved)}
        >
          {allApproved ? "Deselect all" : "Approve all"}
        </Button>
      </div>

      <div className="space-y-3">
        {topics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            count={counts[topic.id] ?? 5}
            onCountChange={(val) => setCounts((prev) => ({ ...prev, [topic.id]: val }))}
          />
        ))}
      </div>

      {/* Global Generation Configuration */}
      <div className="rounded-xl border border-border bg-background/40 p-5 space-y-6 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-muted border-b border-border pb-2">
          Global Generation Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Question Types
            </label>
            <QuestionTypePicker
              value={questionTypes}
              onChange={setQuestionTypes}
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Difficulty Ratios (Sum: 100%)
            </label>
            <div className="bg-background/60 p-4 rounded-lg border border-border/50">
              <LevelRatio
                value={ratios}
                onChange={setRatios}
              />
            </div>
          </div>
        </div>

        {/* Live Generation Summary */}
        <div className="bg-muted/20 border border-border/30 rounded-lg p-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Generation Summary
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-background/40 p-3 rounded border border-border/30 text-center">
              <div className="text-xs text-muted-foreground">Total Questions</div>
              <div className={`text-lg font-bold ${totalQuestions > 100 ? "text-amber-500" : "text-primary"}`}>
                {totalQuestions}
              </div>
            </div>
            <div className="bg-background/40 p-3 rounded border border-border/30 text-center">
              <div className="text-xs text-success">Junior ({ratios.junior}%)</div>
              <div className="text-lg font-bold text-primary">
                {Math.round(totalQuestions * ratios.junior / 100)}
              </div>
            </div>
            <div className="bg-background/40 p-3 rounded border border-border/30 text-center">
              <div className="text-xs text-warning">Middle ({ratios.middle}%)</div>
              <div className="text-lg font-bold text-primary">
                {Math.round(totalQuestions * ratios.middle / 100)}
              </div>
            </div>
            <div className="bg-background/40 p-3 rounded border border-border/30 text-center">
              <div className="text-xs text-primary">Senior ({ratios.senior}%)</div>
              <div className="text-lg font-bold text-primary">
                {Math.round(totalQuestions * ratios.senior / 100)}
              </div>
            </div>
          </div>

          {totalQuestions > 100 && (
            <p className="text-xs text-amber-500 text-center animate-pulse">
              ⚠️ Warning: Total questions exceed the recommended limit of 100.
            </p>
          )}
          {!isTypesValid && (
            <p className="text-xs text-destructive text-center">
              ⚠️ Please select at least one question type.
            </p>
          )}
        </div>
      </div>

      <Button
        className="w-full h-11 text-base font-semibold"
        disabled={!canGenerate || generating}
        onClick={() =>
          onGenerateQuestions({
            approvedTopicIds: approvedIds,
            perTopicCounts: counts,
            levelRatio: ratios,
            questionTypes,
          })
        }
      >
        {generating
          ? "Generating questions..."
          : `Generate ${totalQuestions} questions from ${approvedIds.length} topic${approvedIds.length !== 1 ? "s" : ""}`}
      </Button>
    </div>
  );
}
