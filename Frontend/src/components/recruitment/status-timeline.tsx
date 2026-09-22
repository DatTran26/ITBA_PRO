import { alpha } from "@/lib/utils";
import StatusBadge from "@/components/crm/status-badge";
import type { PipelineStatus } from "@/types/recruitment";

const PIPELINE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NEW: { label: "New", color: "var(--primary)" },
  SCREENED: { label: "Screened", color: "var(--ai)" },
  SHORTLISTED: { label: "Pass", color: "var(--success)" },
  INTERVIEW_SCHEDULED: { label: "Interview Scheduled", color: "var(--warning)" },
  INTERVIEWED: { label: "Interviewed", color: "var(--warning)" },
  PASSED: { label: "Passed", color: "var(--success)" },
  FAILED: { label: "Failed", color: "var(--danger)" },
  REJECTED: { label: "Fail", color: "var(--danger)" },
  OFFERED: { label: "Offered", color: "var(--primary)" },
  ACCEPTED: { label: "Accepted", color: "var(--success)" },
  OFFER_REJECTED: { label: "Offer Rejected", color: "var(--danger)" },
  ONBOARDED: { label: "Onboarded", color: "var(--success)" },
};

interface HistoryItem {
  id: string;
  fromStatus: PipelineStatus | null;
  toStatus: PipelineStatus;
  changedBy: string | null;
  changedAt: string;
  note: string | null;
}

interface StatusTimelineProps {
  history: HistoryItem[];
}

export default function StatusTimeline({ history }: StatusTimelineProps) {
  const sorted = [...history].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">Chưa có lịch sử trạng thái.</p>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {sorted.map((item, idx) => {
        const color = PIPELINE_STATUS_CONFIG[item.toStatus]?.color ?? "var(--muted-foreground)";
        return (
          <div key={item.id} className="flex gap-4 relative">
            {/* vertical line */}
            {idx < sorted.length - 1 && (
              <div
                className="absolute left-[7px] top-5 bottom-0 w-px"
                style={{ backgroundColor: `${alpha(color, 19)}` }}
              />
            )}
            {/* dot */}
            <div
              className="w-3.5 h-3.5 rounded-full mt-1 shrink-0 ring-2 ring-card"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${alpha(color, 31)}` }}
            />
            <div className="pb-5 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <StatusBadge status={item.toStatus} config={PIPELINE_STATUS_CONFIG} />
                <span className="text-xs text-muted-foreground">
                  {new Date(item.changedAt).toLocaleString("vi-VN")}
                </span>
              </div>
              {item.fromStatus && (
                <span className="text-xs text-muted-foreground">
                  Từ: <span className="text-muted-foreground">{PIPELINE_STATUS_CONFIG[item.fromStatus]?.label ?? item.fromStatus}</span>
                </span>
              )}
              {item.note && (
                <p className="text-xs text-muted-foreground mt-1 italic">{item.note}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
