"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Calendar, CheckCircle, Clock, XCircle, User, ChevronRight, RefreshCw, Filter, ShieldAlert, List, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const InterviewCalendarView = dynamic(
  () => import("./interview-calendar-view"),
  {
    ssr: false,
    loading: () => (
      <div className="glass-card flex items-center justify-center h-[640px]">
        <div className="w-6 h-6 border-2 border-[#7C8FFF]/30 border-t-[#7C8FFF] rounded-full animate-spin" />
      </div>
    ),
  }
);

type InterviewerStatus = "pending" | "accepted" | "declined" | "reschedule_requested";

interface InterviewItem {
  id: string;
  job_application_id: string;
  scheduled_at: string;
  timezone: string;
  recruiter_note: string | null;
  status: "scheduled" | "completed" | "cancelled";
  interviewer_status: InterviewerStatus;
  interviewer_proposed_at: string | null;
  interviewer_note: string | null;
  job_applications: {
    id: string;
    pipeline_status: string;
    persons: { id: string; full_name: string; email: string } | null;
    job_descriptions: { id: string; title: string; department: string | null } | null;
  } | null;
  interview_results: Array<{ id: string; result: "pass" | "fail"; note: string | null; submitted_at: string }>;
}

interface Props {
  userRole: string;
}

const isInterviewer = (role: string) => role === "interviewer";

const STATUS_CONFIG: Record<InterviewerStatus, { label: string; dot: string; badge: string }> = {
  pending: { label: "Chờ xác nhận", dot: "bg-amber-400", badge: "bg-amber-500/10 text-amber-300 border-amber-500/25" },
  accepted: { label: "Đã xác nhận", dot: "bg-emerald-400", badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25" },
  declined: { label: "Đã từ chối", dot: "bg-rose-400", badge: "bg-rose-500/10 text-rose-300 border-rose-500/25" },
  reschedule_requested: { label: "Đề xuất đổi slot", dot: "bg-indigo-400", badge: "bg-indigo-500/10 text-indigo-300 border-indigo-500/25" },
};

const CARD_ACCENT: Record<InterviewerStatus, string> = {
  pending: "before:bg-amber-400/70",
  accepted: "before:bg-emerald-400/70",
  declined: "before:bg-rose-400/70",
  reschedule_requested: "before:bg-indigo-400/70",
};

function formatDateTime(iso: string, tz: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: tz }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString("vi-VN");
  }
}

function getInitials(name: string) {
  return name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();
}

function getAvatarColor(name: string) {
  const hue = (name.charCodeAt(0) ?? 0) * 37 % 360;
  return { bg: `hsl(${hue}deg 50% 38%)`, border: `hsl(${hue}deg 50% 55% / 0.25)` };
}

function StatBadge({ label, count, color, icon: Icon, active, onClick }: { label: string; count: number; color: string; icon?: any; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`glass-card relative flex items-center justify-between p-4 flex-1 overflow-hidden transition-all duration-300 ${active ? 'ring-1 ring-[#7C8FFF]/50 scale-[1.02]' : 'hover:bg-white/[0.03]'} cursor-pointer text-left`}
    >
      {active && (
        <div className="absolute inset-0 top-0 h-[2px] bg-gradient-to-r from-[#7C8FFF] to-[#B48EFF]" />
      )}
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.replace('border-', 'bg-').replace('/20', '/10')}`}>
            <Icon className={`w-5 h-5 ${color.replace('border-', 'text-').replace('/20', '')}`} />
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold text-[#8B99B0] uppercase tracking-widest">{label}</span>
          <span className="font-display text-2xl font-light text-[#ECF0F7]">{count}</span>
        </div>
      </div>
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="glass-card p-5 outline-none relative overflow-hidden">
      <div className="flex items-start justify-between gap-3 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 shrink-0" />
          <div className="flex flex-col gap-2">
            <div className="h-3.5 w-32 rounded bg-white/5" />
            <div className="h-3 w-48 rounded bg-white/5" />
          </div>
        </div>
        <div className="h-8 w-24 rounded-lg bg-white/5" />
      </div>
    </div>
  );
}



// ─── Acceptance actions ───────────────────────────────────────────────────────
function InterviewAcceptanceActions({ scheduleId, onResponded }: { scheduleId: string; onResponded: () => void }) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [proposedAt, setProposedAt] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const respond = async (action: "accept" | "decline" | "reschedule") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/recruitment/interviews/${scheduleId}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, proposed_at: proposedAt || undefined, note: note || undefined }),
      });
      if (!res.ok) throw new Error();
      toast.success(action === "accept" ? "Đã xác nhận lịch" : action === "decline" ? "Đã từ chối lịch" : "Đã đề xuất đổi lịch");
      onResponded();
    } catch {
      toast.error("Không thể cập nhật. Thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 pt-3 border-t border-white/6">
      <div className="inline-flex items-center gap-2 text-xs text-amber-300 bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2 w-fit">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        Chờ bạn xác nhận lịch này
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => respond("accept")} disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer disabled:opacity-50"
        >
          <CheckCircle className="w-3.5 h-3.5" /> Xác nhận
        </button>
        <button
          onClick={() => respond("decline")} disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 border border-rose-500/25 text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer disabled:opacity-50"
        >
          <XCircle className="w-3.5 h-3.5" /> Từ chối
        </button>
        <button
          onClick={() => setShowReschedule(!showReschedule)} disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/12 text-[#8B99B0] hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Đề xuất đổi slot
        </button>
      </div>
      {showReschedule && (
        <div className="flex flex-col gap-2 mt-1 p-3 rounded-xl border border-white/8 bg-white/3">
          <input
            type="datetime-local" value={proposedAt} onChange={(e) => setProposedAt(e.target.value)}
            className="h-9 rounded-lg border border-white/10 bg-transparent px-3 text-sm [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-[#7C8FFF]/40"
          />
          <input
            type="text" placeholder="Lý do / ghi chú (tuỳ chọn)" value={note} onChange={(e) => setNote(e.target.value)}
            className="h-9 rounded-lg border border-white/10 bg-transparent px-3 text-sm placeholder:text-[#5A6882] focus:outline-none focus:ring-2 focus:ring-[#7C8FFF]/40"
          />
          <button
            onClick={() => respond("reschedule")} disabled={!proposedAt || loading}
            className="h-9 rounded-lg text-sm font-medium bg-[#5B6CF0] hover:bg-[#4958d6] text-white disabled:opacity-50 transition-colors cursor-pointer"
          >
            Gửi đề xuất
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Interview card ────────────────────────────────────────────────────────────
function InterviewCard({ item, userRole, onResultSubmitted }: { item: InterviewItem; userRole: string; onResultSubmitted: () => void }) {
  const candidate = item.job_applications?.persons;
  const jd = item.job_applications?.job_descriptions;
  const existingResult = item.interview_results?.[0];
  const isPending = item.interviewer_status === "pending" && isInterviewer(userRole);
  const isHrOrAdmin = !isInterviewer(userRole);
  const cfg = STATUS_CONFIG[item.interviewer_status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="glass-card relative overflow-hidden group border border-white/5 hover:border-white/10 transition-all duration-300 cursor-default"
    >
      {/* Decorative top gradient on hover */}
      <div className="absolute inset-0 top-0 h-[2px] bg-gradient-to-r from-[#7C8FFF] to-[#B48EFF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-5 flex flex-col gap-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 text-sm font-semibold text-white border shadow-inner"
              style={candidate?.full_name ? {
                background: `linear-gradient(135deg, ${getAvatarColor(candidate.full_name).bg}, #161F35)`,
                borderColor: getAvatarColor(candidate.full_name).border,
              } : {}}
            >
              {candidate?.full_name ? getInitials(candidate.full_name) : <User className="w-5 h-5 opacity-70" />}
            </div>

            {/* Candidate info */}
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[15px] font-semibold text-[#ECF0F7] group-hover:text-white transition-colors">{candidate?.full_name ?? "—"}</span>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${cfg.badge} uppercase tracking-wider`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shadow-[0_0_8px_currentColor]`} />
                  {cfg.label}
                </span>
                {item.status === "completed" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-emerald-500/10 text-emerald-300 border-emerald-500/25 uppercase tracking-wider">
                    Hoàn thành
                  </span>
                )}
                {item.status === "cancelled" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-rose-500/10 text-rose-300 border-rose-500/25 uppercase tracking-wider">
                    Đã huỷ
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-[#8B99B0]">
                {jd && (
                  <span className="flex items-center gap-1">
                    <span className="text-[#ECF0F7] font-medium">{jd.title}</span>
                    {jd.department && <span className="text-[#5A6882]">・{jd.department}</span>}
                  </span>
                )}
                <span className="w-1 h-1 rounded-full bg-[#5A6882]" />
                <span className="inline-flex items-center gap-1.5 text-[#B48EFF]">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDateTime(item.scheduled_at, item.timezone)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {item.job_applications?.id && (
              <a
                href={`/dashboard/recruitment/${item.job_applications.id}`}
                className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-xs font-medium text-[#ECF0F7] bg-white/5 border border-white/10 hover:border-[#7C8FFF]/30 hover:bg-[#7C8FFF]/10 transition-all duration-200"
              >
                Xem hồ sơ
              </a>
            )}
          </div>
        </div>

        {/* Detail rows */}
        {(existingResult || item.recruiter_note || isPending || (isHrOrAdmin && item.interviewer_status === "reschedule_requested")) && (
          <div className="pl-16 flex flex-col gap-3">
            {/* Result badge */}
            {existingResult && (
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${existingResult.result === "pass" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
                  {existingResult.result === "pass" ? "✓ Đạt" : "✗ Không đạt"}
                </span>
                {existingResult.note && <span className="text-xs text-[#8B99B0] italic bg-black/20 px-3 py-1.5 rounded-md border border-white/5">&quot;{existingResult.note}&quot;</span>}
              </div>
            )}

            {/* Recruiter note */}
            {item.recruiter_note && (
              <p className="text-xs text-[#8B99B0] italic border-l-2 border-white/10 pl-3">&quot;{item.recruiter_note}&quot;</p>
            )}

            {/* Interviewer: pending actions */}
            {isPending && (
              <InterviewAcceptanceActions scheduleId={item.id} onResponded={onResultSubmitted} />
            )}

            {/* HR/Admin: reschedule requested */}
            {isHrOrAdmin && item.interviewer_status === "reschedule_requested" && (
              <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                  <ShieldAlert className="w-4 h-4" /> Interviewer đề xuất đổi slot
                </div>
                {item.interviewer_proposed_at && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#8B99B0]">Giờ mong muốn:</span>
                    <span className="text-[#ECF0F7] bg-black/20 px-2 py-1 rounded border border-white/5">
                      {formatDateTime(item.interviewer_proposed_at, item.timezone)}
                    </span>
                  </div>
                )}
                {item.interviewer_note && (
                  <p className="text-xs text-[#8B99B0] italic bg-black/10 p-2 rounded-md border border-white/5">&quot;{item.interviewer_note}&quot;</p>
                )}
                <a
                  href={`/dashboard/recruitment/sessions?preselect=${item.job_applications?.id}`}
                  className="inline-flex items-center justify-center h-8 gap-2 text-xs font-medium text-white bg-[#5B6CF0] hover:bg-[#4958d6] rounded-lg px-4 transition-colors w-fit shadow-[0_0_15px_rgba(91,108,240,0.3)] shadow-[#5B6CF0]/20"
                >
                  <Calendar className="w-3.5 h-3.5" /> Chuyển đến Scheduling
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ label }: { label: string }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-white/5 border-dashed bg-white/[0.01]">
      <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <Calendar className="w-6 h-6 text-[#5A6882]" />
      </div>
      <h3 className="text-[15px] font-medium text-[#8B99B0]">{label}</h3>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function InterviewsClient({ userRole }: Props) {
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeView = searchParams.get("view") === "calendar" ? "calendar" : "list";

  const setView = (view: "list" | "calendar") => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "calendar") {
      params.set("view", "calendar");
    } else {
      params.delete("view");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recruitment/interviews");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setInterviews(data.interviews ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách phỏng vấn.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInterviews(); }, [fetchInterviews]);

  const [filter, setFilter] = useState<"all" | "upcoming" | "pending" | "completed">("all");

  const upcoming = useMemo(() => interviews.filter((i) => i.status === "scheduled"), [interviews]);
  const completed = useMemo(() => interviews.filter((i) => i.status !== "scheduled"), [interviews]);
  const pending = useMemo(() => upcoming.filter((i) => i.interviewer_status === "pending"), [upcoming]);

  const displayedItems = useMemo(() => {
    switch (filter) {
      case "upcoming": return upcoming;
      case "pending": return pending;
      case "completed": return completed;
      default: return interviews;
    }
  }, [filter, interviews, upcoming, pending, completed]);

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-rose-400">{error}</p>
        <button onClick={fetchInterviews} className="mt-3 text-xs text-[#7C8FFF] hover:underline cursor-pointer">Thử lại</button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row pb-6 justify-between gap-6 border-b border-white/10 mb-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#7C8FFF]/20 to-[#B48EFF]/20 border border-[#7C8FFF]/30 flex items-center justify-center shadow-[0_0_15px_rgba(124,143,255,0.15)]">
            <Calendar className="w-6 h-6 text-[#7C8FFF]" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-light text-[#ECF0F7]">Command Center: <span className="font-medium">Interviews</span></h1>
            <p className="text-sm text-[#8B99B0] mt-1 tracking-wide">Lịch trình & Đánh giá phỏng vấn</p>
          </div>
        </div>

        {/* Global Filter Toggles */}
        <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md self-start">
          {[
            { id: "all", label: "Tất cả" },
            { id: "upcoming", label: "Sắp tới" },
            { id: "pending", label: "Chờ xác nhận" },
            { id: "completed", label: "Đã xong" }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer ${filter === f.id ? "bg-[#1B253B] text-[#7C8FFF] shadow-md border border-[#7C8FFF]/20" : "text-[#8B99B0] hover:text-[#ECF0F7] hover:bg-white/5"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Stats */}
      {!loading && (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <StatBadge active={filter === 'upcoming'} onClick={() => setFilter('upcoming')} label="Sắp diễn ra" count={upcoming.length} color="border-amber-500/20 text-[#ECF0F7] bg-gradient-to-b from-[#1B253B] to-black/20" icon={Clock} />
          <StatBadge active={filter === 'pending'} onClick={() => setFilter('pending')} label="Cần phản hồi" count={pending.length} color="border-rose-500/20 text-[#ECF0F7] bg-gradient-to-b from-[#1B253B] to-black/20" icon={ShieldAlert} />
          <StatBadge active={filter === 'completed'} onClick={() => setFilter('completed')} label="Đã hoàn thành" count={completed.length} color="border-emerald-500/20 text-[#ECF0F7] bg-gradient-to-b from-[#1B253B] to-black/20" icon={CheckCircle} />
        </div>
      )}

      {/* View toggle tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/4 border border-white/8 w-fit mb-6">
        {(["list", "calendar"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
              activeView === v
                ? "bg-[#7C8FFF]/15 text-[#B6C2FF] border border-[#7C8FFF]/30"
                : "text-[#5A6882] hover:text-[#8B99B0] border border-transparent"
            }`}
          >
            {v === "list"
              ? <><List className="w-3.5 h-3.5" /> Danh sách</>
              : <><CalendarDays className="w-3.5 h-3.5" /> Lịch</>
            }
          </button>
        ))}
      </div>

      {activeView === "list" ? (
        /* Main List Section */
        <section className="flex flex-col gap-4 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : displayedItems.length === 0 ? (
            <EmptyState label={`Không có dữ liệu cho trạng thái "${filter}".`} />
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 gap-4">
                {displayedItems.map((item) => (
                  <InterviewCard key={item.id} item={item} userRole={userRole} onResultSubmitted={fetchInterviews} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </section>
      ) : (
        <InterviewCalendarView
          interviews={interviews}
          userRole={userRole}
          onRefresh={fetchInterviews}
        />
      )}
    </div>
  );
}
