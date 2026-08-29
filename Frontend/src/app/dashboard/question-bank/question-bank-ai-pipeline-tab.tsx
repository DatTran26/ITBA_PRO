"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrainCircuit, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DocumentSourceSelector } from "@/components/question-bank/document-source-selector";
import { DocumentStatusPoller } from "@/components/question-bank/document-status-poller";
import { TopicReviewPanel } from "@/components/question-bank/topic-review-panel";
import { AiQuestionsReview } from "@/components/question-bank/ai-questions-review";
import type { AiQuestion, DocumentSource } from "@/components/question-bank/question-bank-types";

type DocStatus = DocumentSource["status"];
type AiStep = "upload" | "polling_topics" | "topic-review" | "generating" | "question-review" | "done";

const VALID_STEPS = new Set<AiStep>([
  "upload",
  "polling_topics",
  "topic-review",
  "generating",
  "question-review",
  "done",
]);

export type PipelineContext = { scope: "bank" } | { scope: "skill"; skillId: string };

interface Props {
  onApproved: () => void;
  // Scope of generation: global bank (default, unchanged) or a specific skill.
  context?: PipelineContext;
}

export default function QuestionBankAiPipelineTab({ onApproved, context = { scope: "bank" } }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skillId = context.scope === "skill" ? context.skillId : undefined;
  const syncUrl = context.scope === "bank";
  // Skill scope persists progress to sessionStorage (URL is owned by the skill page's
  // own tab state); bank scope persists to the URL. Both survive a tab/route change.
  const storageKey = skillId ? `qb-pipeline:skill:${skillId}` : null;

  // Read persisted progress only on first render — subsequent renders use state of record.
  // Re-reading every render would churn callback identities and reset child timers
  // (DocumentStatusPoller) before they ever fire.
  const initial = (() => {
    if (syncUrl) {
      const s = searchParams.get("step") as AiStep | null;
      return {
        step: s && VALID_STEPS.has(s) ? s : "upload",
        docId: searchParams.get("docId"),
      };
    }
    if (typeof window !== "undefined" && storageKey) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
        if (saved?.step && VALID_STEPS.has(saved.step)) {
          return { step: saved.step as AiStep, docId: saved.docId ?? null };
        }
      } catch {
        /* ignore malformed cache */
      }
    }
    return { step: "upload" as AiStep, docId: null };
  })();
  const initialStep = initial.step;
  const initialDocId = initial.docId;

  const [aiStep, setAiStep] = useState<AiStep>(initialStep);
  const [documentId, setDocumentId] = useState<string | null>(initialDocId);
  const [aiQuestions, setAiQuestions] = useState<AiQuestion[] | null>(null);
  const [approvedCount, setApprovedCount] = useState(0);

  // Sync URL ← state via a side effect. Reading window.location avoids
  // a React-tracked dependency on searchParams, which would invalidate callbacks.
  useEffect(() => {
    if (typeof window === "undefined" || !syncUrl) return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "ai-pipeline");
    if (aiStep === "upload") url.searchParams.delete("step");
    else url.searchParams.set("step", aiStep);
    if (documentId) url.searchParams.set("docId", documentId);
    else url.searchParams.delete("docId");
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  }, [aiStep, documentId, router, syncUrl]);

  // Persist skill-scoped progress to sessionStorage so switching skill tabs
  // (which unmounts this component) does not lose an in-flight extraction/generation.
  useEffect(() => {
    if (syncUrl || !storageKey || typeof window === "undefined") return;
    if (aiStep === "upload" && !documentId) {
      sessionStorage.removeItem(storageKey);
    } else {
      sessionStorage.setItem(storageKey, JSON.stringify({ step: aiStep, docId: documentId }));
    }
  }, [aiStep, documentId, syncUrl, storageKey]);

  function reset() {
    setAiStep("upload");
    setDocumentId(null);
    setAiQuestions(null);
    setApprovedCount(0);
  }

  function handleUploadSuccess(id: string) {
    setDocumentId(id);
    setAiStep("polling_topics");
  }

  const handleTopicPollStatus = useCallback((status: DocStatus) => {
    if (status === "topics_ready") setAiStep("topic-review");
    if (status === "failed") {
      toast.error("Topic extraction failed. Please try again.");
      setAiStep("upload");
      setDocumentId(null);
    }
  }, []);

  async function handleGenerateQuestions(config: {
    approvedTopicIds: string[];
    perTopicCounts: Record<string, number>;
    levelRatio: { junior: number; middle: number; senior: number };
    questionTypes: string[];
  }) {
    if (!documentId) return;
    const res = await fetch(`/api/document-sources/${documentId}/generate-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error ?? "Failed to start question generation");
      return;
    }
    setAiStep("generating");
  }

  const handleGenerationPollStatus = useCallback(
    async (status: DocStatus) => {
      if (status === "done") {
        try {
          const res = await fetch(`/api/document-sources/${documentId}/job`);
          if (!res.ok) throw new Error();
          const job = await res.json();
          const rawResult = job.result_json;
          const qs = Array.isArray(rawResult) ? rawResult : (rawResult?.questions ?? []);
          setAiQuestions(qs);
          setAiStep("question-review");
        } catch {
          toast.error("Could not load generated questions. Please retry.");
          setAiStep("topic-review");
        }
      }
      if (status === "failed") {
        toast.error("Question generation failed. You can retry from the topics screen.");
        setAiStep("topic-review");
      }
    },
    [documentId]
  );

  function handleApproved(insertedCount: number) {
    setApprovedCount(insertedCount);
    setAiStep("done");
    onApproved();
  }

  // ── Upload ──────────────────────────────────────────────────────────────────
  if (aiStep === "upload") {
    return (
      <div className="space-y-6">
        <div className="border border-[#8B99B0]/10 rounded-lg p-6 bg-[#1C2333]/40">
          <div className="flex items-start gap-3">
            <BrainCircuit className="w-5 h-5 text-[#7C8FFF] mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-[#E2E8F0] mb-1">AI Question Generator</h3>
              <p className="text-xs text-[#5A6882] leading-relaxed">
                Upload a document and AI will extract topics for your review. After you approve
                the topics, it will generate interview questions for each one.
              </p>
              <ul className="mt-3 space-y-1 text-xs text-[#5A6882]">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#5A6882]" />
                  Supported: .pdf, .docx, .txt - max 50 MB
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#5A6882]" />
                  Step 1: AI extracts topics - you review and edit them
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#5A6882]" />
                  Step 2: AI generates questions only for approved topics
                </li>
              </ul>
            </div>
          </div>
        </div>
        <DocumentSourceSelector onSuccess={handleUploadSuccess} skillId={skillId} />
      </div>
    );
  }

  // ── Polling topics ──────────────────────────────────────────────────────────
  if (aiStep === "polling_topics") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-8 h-8 text-[#7C8FFF] animate-spin" />
        <p className="text-sm text-[#8B99B0]">Extracting topics from document...</p>
        <DocumentStatusPoller
          documentId={documentId!}
          onStatus={handleTopicPollStatus}
          active
        />
      </div>
    );
  }

  // ── Topic review ────────────────────────────────────────────────────────────
  if (aiStep === "topic-review") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#E2E8F0]">Review Topics</h3>
            <p className="text-xs text-[#5A6882] mt-0.5">
              Edit, approve, or remove topics before generating questions.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="text-xs text-[#5A6882] hover:text-[#8B99B0]"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Start over
          </Button>
        </div>
        <TopicReviewPanel
          documentId={documentId!}
          onGenerateQuestions={handleGenerateQuestions}
        />
      </div>
    );
  }

  // ── Generating questions ────────────────────────────────────────────────────
  if (aiStep === "generating") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-8 h-8 text-[#7C8FFF] animate-spin" />
        <p className="text-sm text-[#8B99B0]">Generating questions from approved topics...</p>
        <DocumentStatusPoller
          documentId={documentId!}
          onStatus={handleGenerationPollStatus}
          active
        />
      </div>
    );
  }

  // ── Question review ─────────────────────────────────────────────────────────
  if (aiStep === "question-review") {
    if (!aiQuestions) {
      return (
        <ReviewHydrator
          documentId={documentId!}
          onLoaded={(qs) => setAiQuestions(qs)}
          onFail={() => setAiStep("topic-review")}
        />
      );
    }
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#5A6882]">
            Review the generated questions and approve the ones you want to save.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="text-xs text-[#5A6882] hover:text-[#8B99B0]"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            New Upload
          </Button>
        </div>
        <AiQuestionsReview
          documentId={documentId!}
          questions={aiQuestions}
          onQuestionsChange={setAiQuestions}
          onApproved={handleApproved}
        />
      </div>
    );
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <CheckCircle2 className="w-12 h-12 text-green-400" />
      <div className="text-center">
        <p className="text-base font-semibold text-[#E2E8F0]">
          {approvedCount} question{approvedCount !== 1 ? "s" : ""} saved successfully
        </p>
        <p className="text-xs text-[#5A6882] mt-1">
          The Questions tab has been refreshed with the new additions.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={reset}
        className="border-[#8B99B0]/20 text-[#8B99B0] hover:text-[#E2E8F0]"
      >
        <RotateCcw className="w-3 h-3 mr-2" />
        Upload Another Document
      </Button>
    </div>
  );
}

// Lazily refetch generated questions when reload lands directly on the review step.
function ReviewHydrator({
  documentId,
  onLoaded,
  onFail,
}: {
  documentId: string;
  onLoaded: (qs: AiQuestion[]) => void;
  onFail: () => void;
}) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/document-sources/${documentId}/job`);
        if (!res.ok) throw new Error();
        const job = await res.json();
        const rawResult = job.result_json;
        const qs = Array.isArray(rawResult) ? rawResult : (rawResult?.questions ?? []);
        if (!cancelled) onLoaded(qs);
      } catch {
        if (!cancelled) {
          toast.error("Could not load generated questions. Returning to topics.");
          onFail();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [documentId, onLoaded, onFail]);

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Loader2 className="w-8 h-8 text-[#7C8FFF] animate-spin" />
      <p className="text-sm text-[#8B99B0]">Loading generated questions...</p>
    </div>
  );
}
