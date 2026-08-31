"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface ShortlistedCandidate {
  id: string;
  fullName: string;
  email: string;
  aiScore: number | null;
  finalScore: number | null;
  jdTitle: string;
}

interface Props {
  sessionId: string;
  assignedApplicationIds?: string[];
  onAssigned: () => void | Promise<void>;
  disabled?: boolean;
  disabledReason?: string;
}

export default function AssignCandidatesPanel({
  sessionId,
  assignedApplicationIds = [],
  onAssigned,
  disabled = false,
  disabledReason,
}: Props) {
  const [candidates, setCandidates] = useState<ShortlistedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/recruitment/applications?status=SHORTLISTED&pageSize=100")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data?.applications) return;
        type AppRaw = {
          id: string;
          person?: { fullName?: string; email?: string };
          jobDescription?: { title?: string };
          screening?: { aiScore?: number | null; finalScore?: number | null };
        };

        setCandidates(
          data.applications.map((application: AppRaw) => ({
            id: application.id,
            fullName: application.person?.fullName ?? "-",
            email: application.person?.email ?? "-",
            aiScore: application.screening?.aiScore ?? null,
            finalScore: application.screening?.finalScore ?? null,
            jdTitle: application.jobDescription?.title ?? "-",
          }))
        );
      })
      .catch(() => toast.error("Không tải được danh sách ứng viên"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const assignedIds = new Set(assignedApplicationIds);
    const normalized = query.toLowerCase().trim();
    const availableCandidates = candidates.filter((candidate) => !assignedIds.has(candidate.id));
    if (!normalized) return availableCandidates;

    return availableCandidates.filter((candidate) => {
      const haystack = [candidate.fullName, candidate.email, candidate.jdTitle].join(" ").toLowerCase();
      return haystack.includes(normalized);
    });
  }, [assignedApplicationIds, candidates, query]);

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAssign = async () => {
    if (disabled) {
      toast.error(disabledReason ?? "Chưa đủ điều kiện để thêm ứng viên");
      return;
    }
    if (selected.size === 0) {
      toast.error("Chưa chọn ứng viên nào");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/recruitment/sessions/${sessionId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationIds: Array.from(selected) }),
      });
      const json = await response.json();
      if (!response.ok) {
        toast.error(json.error ?? "Thêm ứng viên thất bại");
        return;
      }
      toast.success(`Đã thêm ${json.assigned} ứng viên${json.skipped > 0 ? ` (bỏ qua ${json.skipped})` : ""}`);
      setSelected(new Set());
      setCandidates((current) => current.filter((candidate) => !selected.has(candidate.id)));
      await onAssigned();
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  const score = (candidate: ShortlistedCandidate) => candidate.finalScore ?? candidate.aiScore;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A6882]" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm ứng viên SHORTLISTED..."
          className="w-full rounded-lg border border-[#8B99B0]/15 bg-[#0C1422] py-2 pl-9 pr-3 text-sm text-[#ECF0F7] focus:border-[#7C8FFF]/50 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-[#7C8FFF]" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#5A6882]">Không tìm thấy ứng viên đủ điều kiện</p>
      ) : (
        <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
          {filtered.map((candidate) => {
            const isSelected = selected.has(candidate.id);
            const value = score(candidate);
            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => toggle(candidate.id)}
                className={`w-full cursor-pointer rounded-lg border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-[#7C8FFF]/40 bg-[#7C8FFF]/10"
                    : "border-[#8B99B0]/12 bg-[#0C1422] hover:border-[#8B99B0]/25"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-[10px] font-bold ${
                      isSelected ? "border-[#7C8FFF] bg-[#7C8FFF] text-white" : "border-[#8B99B0]/40"
                    }`}
                  >
                    {isSelected ? "✓" : ""}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#ECF0F7]">{candidate.fullName}</p>
                    <p className="truncate text-xs text-[#5A6882]">{candidate.email} · {candidate.jdTitle}</p>
                  </div>
                  {value !== null && (
                    <span className="shrink-0 rounded-full bg-[#7C8FFF]/10 px-2 py-0.5 text-xs font-bold text-[#B6C2FF]">
                      {Math.round(value)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={handleAssign}
        disabled={disabled || submitting || selected.size === 0}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#7C8FFF] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#6B7FEE] disabled:opacity-50"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        {submitting ? "Đang thêm..." : `Thêm ${selected.size > 0 ? selected.size : ""} ứng viên`}
      </button>

      {disabled && (
        <p className="text-xs text-[#F8C56B]">{disabledReason ?? "Cần interviewer accepted trước khi thêm candidate."}</p>
      )}
    </div>
  );
}
