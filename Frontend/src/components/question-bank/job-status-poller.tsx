"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { DocumentJob } from "./question-bank-types";

interface Props {
  documentId: string;
  onDone: (job: DocumentJob) => void;
  onFailed: (message: string) => void;
}

const POLL_INTERVAL_MS = 3000;

export default function JobStatusPoller({ documentId, onDone, onFailed }: Props) {
  const [status, setStatus] = useState<string>("pending");
  const [dots, setDots] = useState(".");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    // Animate dots while processing
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 600);

    async function poll() {
      if (doneRef.current) return;
      try {
        const res = await fetch(`/api/document-sources/${documentId}/job`);
        if (!res.ok) return;
        const job = (await res.json()) as DocumentJob;
        setStatus(job.status);

        if (job.status === "done") {
          doneRef.current = true;
          clearInterval(intervalRef.current!);
          clearInterval(dotInterval);
          onDone(job);
        } else if (job.status === "failed") {
          doneRef.current = true;
          clearInterval(intervalRef.current!);
          clearInterval(dotInterval);
          onFailed(job.error_message ?? "Processing failed");
        }
      } catch {
        // Network error - keep polling
      }
    }

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalRef.current!);
      clearInterval(dotInterval);
    };
  }, [documentId, onDone, onFailed]);

  const isProcessing = status === "pending" || status === "processing";
  const isDone = status === "done";
  const isFailed = status === "failed";

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
        isDone ? "bg-[#10B981]/20" : isFailed ? "bg-red-500/20" : "bg-[#8B99B0]/10"
      }`}>
        {isProcessing && <Loader2 className="w-8 h-8 text-[#10B981] animate-spin" />}
        {isDone && <CheckCircle2 className="w-8 h-8 text-[#10B981]" />}
        {isFailed && <XCircle className="w-8 h-8 text-red-400" />}
      </div>

      <div className="text-center space-y-1">
        {isProcessing && (
          <>
            <p className="text-base font-medium text-[#ECF0F7]">
              {status === "pending" ? "Queued" : "Generating questions"}{dots}
            </p>
            <p className="text-sm text-[#5A6882]">This may take up to a minute depending on document size</p>
          </>
        )}
        {isDone && (
          <p className="text-base font-medium text-[#10B981]">Questions ready - loading review...</p>
        )}
        {isFailed && (
          <p className="text-base font-medium text-red-400">Processing failed</p>
        )}
      </div>

      {isProcessing && (
        <div className="flex items-center gap-2 text-xs text-[#5A6882] bg-[#1E2840]/60 border border-[#8B99B0]/10 rounded-lg px-4 py-2">
          <Clock className="w-3.5 h-3.5" />
          Checking every {POLL_INTERVAL_MS / 1000}s
        </div>
      )}
    </div>
  );
}
