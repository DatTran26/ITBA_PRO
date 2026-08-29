"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, User, Clock, MessageSquare, Search, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CandidateApplication {
  id: string;
  candidateName: string;
  jdTitle: string;
  pipelineStatus: string;
}

interface ScheduleInterviewDialogProps {
  applicationId?: string; // Optional for global mode
  onSuccess: () => void;
  disabled?: boolean;
  trigger?: React.ReactNode;
}

export default function ScheduleInterviewDialog({
  applicationId: initialApplicationId,
  onSuccess,
  disabled = false,
  trigger,
}: ScheduleInterviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [candidates, setCandidates] = useState<CandidateApplication[]>([]);
  const [selectedAppId, setSelectedAppId] = useState(initialApplicationId || "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [recruiterNote, setRecruiterNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    if (!open || initialApplicationId) return;
    setFetchingData(true);
    setError(null);
    try {
      const data = await fetch("/api/recruitment/applications?status=SHORTLISTED&pageSize=50").then(r => r.json());
      type AppRaw = { id: string; person?: { fullName?: string }; jobDescription?: { title?: string }; pipelineStatus: string };
      setCandidates((data.applications ?? []).map((a: AppRaw) => ({
        id: a.id,
        candidateName: a.person?.fullName ?? "—",
        jdTitle: a.jobDescription?.title ?? "—",
        pipelineStatus: a.pipelineStatus,
      })));
    } catch {
      setError("Unable to load candidate list.");
    } finally {
      setFetchingData(false);
    }
  }, [open, initialApplicationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleOpen() {
    if (disabled) return;
    setSelectedAppId(initialApplicationId || "");
    setScheduledAt("");
    setRecruiterNote("");
    setError(null);
    setOpen(true);
  }

  function handleClose() {
    if (loading) return;
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const targetAppId = initialApplicationId || selectedAppId;

    if (!targetAppId) {
      setError("Please select a candidate.");
      return;
    }
    if (!scheduledAt) {
      setError("Please select an interview time.");
      return;
    }
    if (new Date(scheduledAt).getTime() < Date.now()) {
      setError("Không thể tạo lịch ở thời điểm quá khứ.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/recruitment/applications/${targetAppId}/schedule-interview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduled_at: new Date(scheduledAt).toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            recruiter_note: recruiterNote || undefined,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Đã xảy ra lỗi. Vui lòng thử lại.");
        return;
      }

      setOpen(false);
      onSuccess();
    } catch {
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  const filteredCandidates = candidates.filter(c => {
    const name = c.candidateName || "";
    const jd = c.jdTitle || "";
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || jd.toLowerCase().includes(query);
  });

  return (
    <>
      <div onClick={handleOpen} className="w-fit">
        {trigger || (
          <button
            disabled={disabled}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${disabled
              ? "bg-[#8B99B0]/10 border border-[#8B99B0]/20 text-[#5A6882] cursor-not-allowed"
              : "bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/25"
              }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Lên lịch PV
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 mb-12">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={handleClose}
          />

          <div className="relative bg-[#1B253B] border border-white/10 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 fade-in duration-300">
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5 bg-[#161F35]/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/20 flex items-center justify-center border border-[#F59E0B]/30">
                  <Calendar className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#ECF0F7] tracking-tight">Lên lịch phỏng vấn</h2>
                  <p className="text-[11px] text-[#8B99B0] uppercase font-bold tracking-widest mt-0.5">Scheduling Coordination</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#5A6882] hover:text-[#ECF0F7] hover:bg-white/5 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Candidate Selection (Global Mode) */}
              {!initialApplicationId && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-[#8B99B0] uppercase tracking-wider flex items-center gap-2">
                    <User size={14} className="text-[#7C8FFF]" />
                    Chọn ứng viên <span className="text-[#EF4444]">*</span>
                  </label>

                  <div className="relative group/search mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6882]" />
                    <input
                      type="text"
                      placeholder="Tìm ứng viên trong Pipeline..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#121A2E] border border-white/5 rounded-xl pl-9 pr-3 py-2 text-sm text-[#ECF0F7] focus:border-[#7C8FFF]/50 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {fetchingData ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-[#7C8FFF] animate-spin" />
                      </div>
                    ) : filteredCandidates.length > 0 ? (
                      filteredCandidates.map(app => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => setSelectedAppId(app.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${selectedAppId === app.id
                            ? 'bg-[#7C8FFF]/10 border-[#7C8FFF]/50 ring-1 ring-[#7C8FFF]/30'
                            : 'bg-[#121A2E] border-white/5 hover:border-white/10'
                            }`}
                        >
                          <div>
                            <p className={`text-sm font-bold ${selectedAppId === app.id ? 'text-[#7C8FFF]' : 'text-[#ECF0F7]'}`}>
                              {app.candidateName}
                            </p>
                            <p className="text-[11px] text-[#5A6882] mt-0.5">{app.jdTitle}</p>
                          </div>
                          {selectedAppId === app.id && <CheckCircle2 size={16} className="text-[#7C8FFF]" />}
                        </button>
                      ))
                    ) : (
                      <p className="text-center py-6 text-sm text-[#5A6882]">Không tìm thấy ứng viên phù hợp.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Time Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#8B99B0] uppercase tracking-wider flex items-center gap-2">
                  <Clock size={14} className="text-[#7C8FFF]" />
                  Interview Time <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  disabled={loading}
                  className="w-full h-11 px-4 rounded-xl bg-[#121A2E] border border-white/5 text-[#ECF0F7] text-sm focus:border-[#7C8FFF]/50 outline-none disabled:opacity-50 [color-scheme:dark]"
                />
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#8B99B0] uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare size={14} className="text-[#B48EFF]" />
                  Ghi chú nội bộ
                </label>
                <textarea
                  rows={3}
                  value={recruiterNote}
                  onChange={(e) => setRecruiterNote(e.target.value)}
                  placeholder="Ghi chú cho người phỏng vấn về ứng viên này..."
                  disabled={loading}
                  className="w-full p-4 rounded-2xl bg-[#121A2E] border border-white/5 text-[#ECF0F7] text-sm placeholder-[#5A6882] focus:border-[#7C8FFF]/50 outline-none resize-none disabled:opacity-50"
                />
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-start gap-3 animate-in slide-in-from-top-2">
                  <X className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#EF4444] font-medium">{error}</p>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-white/5 bg-[#161F35]/50 flex gap-3 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={loading}
                className="rounded-xl px-6 text-[#8B99B0] hover:text-[#ECF0F7] hover:bg-white/5"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || fetchingData}
                className="rounded-xl px-8 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold shadow-lg shadow-[#F59E0B]/20 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Đang lưu...
                  </div>
                ) : (
                  "Xác nhận lên lịch"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
