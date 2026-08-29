"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface Interviewer {
  id: string;
  name: string;
  email: string;
}

interface SessionInterviewer {
  interviewer_id: string;
  status: string;
}

interface Props {
  sessionId: string;
  currentInterviewers?: SessionInterviewer[];
  onAssigned: () => void | Promise<void>;
}

export default function AssignInterviewerPanel({ sessionId, currentInterviewers = [], onAssigned }: Props) {
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/recruitment/interviewers")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (data?.interviewers) setInterviewers(data.interviewers);
      })
      .catch(() => toast.error("Không tải được danh sách interviewer"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSelected(currentInterviewers.map((item) => item.interviewer_id));
  }, [currentInterviewers]);

  const filteredInterviewers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return interviewers;

    return interviewers.filter((interviewer) => {
      const haystack = `${interviewer.name} ${interviewer.email}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [interviewers, query]);

  const toggleInterviewer = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };

  const handleAssign = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/recruitment/sessions/${sessionId}/assign-interviewer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewerIds: selected }),
      });
      const json = await response.json();
      if (!response.ok) {
        toast.error(json.error ?? "Phân công thất bại");
        return;
      }
      toast.success(`Đã gán ${json.assignedInterviewers} interviewer cho session`);
      await onAssigned();
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#8B99B0]">
        Chọn một hoặc nhiều interviewer. Ứng viên chỉ được thêm sau khi ít nhất một interviewer accepted.
      </p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A6882]" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm interviewer theo tên hoặc email..."
          className="w-full rounded-lg border border-[#8B99B0]/15 bg-[#0C1422] py-2 pl-9 pr-3 text-sm text-[#ECF0F7] focus:border-[#7C8FFF]/50 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-[#7C8FFF]" />
        </div>
      ) : (
        <div className="space-y-2">
          {filteredInterviewers.length === 0 ? (
            <p className="rounded-lg border border-[#8B99B0]/12 bg-[#0A1120] px-3 py-5 text-center text-sm text-[#8B99B0]">
              Không tìm thấy interviewer phù hợp
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {filteredInterviewers.map((interviewer) => {
              const checked = selected.includes(interviewer.id);
              const existingStatus = currentInterviewers.find((item) => item.interviewer_id === interviewer.id)?.status;
              return (
                <label key={interviewer.id} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${checked ? "border-[#7C8FFF]/50 bg-[#7C8FFF]/10" : "border-[#8B99B0]/15 bg-[#0A1120]"}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleInterviewer(interviewer.id)}
                    className="mt-1 accent-[#7C8FFF]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-[#ECF0F7] truncate">{interviewer.name}</span>
                    <span className="block text-xs text-[#8B99B0] truncate">{interviewer.email}</span>
                    {existingStatus && <span className="mt-1 inline-flex text-[10px] uppercase tracking-wide text-[#36DDAB]">{existingStatus}</span>}
                  </span>
                </label>
              );
            })}
            </div>
          )}

          <button
            onClick={handleAssign}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#7C8FFF] hover:bg-[#6B7FEE] text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            {submitting ? "Đang lưu..." : "Lưu phân công"}
          </button>
        </div>
      )}
    </div>
  );
}
