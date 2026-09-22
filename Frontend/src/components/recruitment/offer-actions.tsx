"use client";

import { useState } from "react";
import OnboardDialog from "@/components/recruitment/onboard-dialog";
import type { PipelineStatus } from "@/types/recruitment";

interface OfferActionsProps {
  applicationId: string;
  pipelineStatus: PipelineStatus;
  onSuccess: () => void;
}

type SimpleAction = "make_offer" | "accept" | "reject";

const SIMPLE_ACTIONS: Record<
  PipelineStatus,
  { action: SimpleAction; label: string; color: string }[]
> = {
  PASSED: [
    { action: "make_offer", label: "Gửi offer", color: "bg-primary/15 border-primary/30 text-primary hover:bg-primary/25" },
  ],
  OFFERED: [
    { action: "accept", label: "Chấp nhận", color: "bg-success/15 border-success/30 text-success hover:bg-success/25" },
    { action: "reject", label: "Từ chối offer", color: "bg-danger/15 border-danger/30 text-danger hover:bg-danger/25" },
  ],
  ACCEPTED: [],
  // All other statuses: no offer actions
  NEW: [], SCREENED: [], SHORTLISTED: [], INTERVIEW_SCHEDULED: [],
  INTERVIEWED: [], FAILED: [], REJECTED: [], OFFER_REJECTED: [], ONBOARDED: [],
};

export default function OfferActions({ applicationId, pipelineStatus, onSuccess }: OfferActionsProps) {
  const [loading, setLoading] = useState<SimpleAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const simpleActions = SIMPLE_ACTIONS[pipelineStatus] ?? [];
  const showOnboard = pipelineStatus === "ACCEPTED";

  if (simpleActions.length === 0 && !showOnboard) return null;

  async function handleSimpleAction(action: SimpleAction) {
    setError(null);
    setLoading(action);
    try {
      const res = await fetch(`/api/recruitment/applications/${applicationId}/offer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Đã xảy ra lỗi.");
        return;
      }
      onSuccess();
    } catch {
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {simpleActions.map(({ action, label, color }) => (
          <button
            key={action}
            onClick={() => handleSimpleAction(action)}
            disabled={loading !== null}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${color}`}
          >
            {loading === action ? "Đang xử lý..." : label}
          </button>
        ))}
        {showOnboard && <OnboardDialog applicationId={applicationId} onSuccess={onSuccess} />}
      </div>
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  );
}
