import StatusBadge from "@/components/crm/status-badge";
import type { PipelineStatus } from "@/types/recruitment";

const PIPELINE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NEW: { label: "New", color: "#3B82F6" },
  SCREENED: { label: "Screened", color: "#8B5CF6" },
  SHORTLISTED: { label: "Pass", color: "#22C55E" },
  INTERVIEW_SCHEDULED: { label: "Interview Scheduled", color: "#F59E0B" },
  INTERVIEWED: { label: "Interviewed", color: "#F97316" },
  PASSED: { label: "Passed", color: "#22C55E" },
  FAILED: { label: "Failed", color: "#EF4444" },
  REJECTED: { label: "Fail", color: "#EF4444" },
  OFFERED: { label: "Offered", color: "#06B6D4" },
  ACCEPTED: { label: "Accepted", color: "#10B981" },
  OFFER_REJECTED: { label: "Offer Rejected", color: "#EF4444" },
  ONBOARDED: { label: "Onboarded", color: "#22C55E" },
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
      <p className="text-sm text-[#5A6882] py-4 text-center">Chưa có lịch sử trạng thái.</p>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {sorted.map((item, idx) => {
        const color = PIPELINE_STATUS_CONFIG[item.toStatus]?.color ?? "#8B99B0";
        return (
          <div key={item.id} className="flex gap-4 relative">
            {/* vertical line */}
            {idx < sorted.length - 1 && (
              <div
                className="absolute left-[7px] top-5 bottom-0 w-px"
                style={{ backgroundColor: `${color}30` }}
              />
            )}
            {/* dot */}
            <div
              className="w-3.5 h-3.5 rounded-full mt-1 shrink-0 ring-2 ring-[#0C1220]"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}50` }}
            />
            <div className="pb-5 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <StatusBadge status={item.toStatus} config={PIPELINE_STATUS_CONFIG} />
                <span className="text-xs text-[#5A6882]">
                  {new Date(item.changedAt).toLocaleString("vi-VN")}
                </span>
              </div>
              {item.fromStatus && (
                <span className="text-xs text-[#5A6882]">
                  Từ: <span className="text-[#8B99B0]">{PIPELINE_STATUS_CONFIG[item.fromStatus]?.label ?? item.fromStatus}</span>
                </span>
              )}
              {item.note && (
                <p className="text-xs text-[#8B99B0] mt-1 italic">{item.note}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
