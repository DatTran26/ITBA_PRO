"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Clock, CheckCircle, XCircle, RefreshCw, ShieldAlert, Briefcase, ExternalLink, Tag } from "lucide-react";
import { toast } from "sonner";
import type { InterviewItem } from "./interview-calendar-week-grid";

type InterviewerStatus = "pending" | "accepted" | "declined" | "reschedule_requested";

const STATUS_CONFIG: Record<InterviewerStatus, { label: string; dot: string; badge: string }> = {
  pending:              { label: "Chờ xác nhận",    dot: "bg-amber-400",  badge: "bg-amber-500/10 text-amber-300 border-amber-500/25" },
  accepted:             { label: "Đã xác nhận",     dot: "bg-emerald-400", badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25" },
  declined:             { label: "Đã từ chối",      dot: "bg-rose-400",   badge: "bg-rose-500/10 text-rose-300 border-rose-500/25" },
  reschedule_requested: { label: "Đề xuất đổi slot", dot: "bg-indigo-400", badge: "bg-indigo-500/10 text-indigo-300 border-indigo-500/25" },
};

const DOT_COLORS: Record<string, string> = {
  pending: "#F59E0B", accepted: "#10B981",
  declined: "#F43F5E", reschedule_requested: "#6366F1", completed: "#475569",
};

const POPUP_W = 304;

function formatDate(iso: string, tz: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "long", timeZone: tz }).format(new Date(iso));
  } catch { return new Date(iso).toLocaleDateString("vi-VN"); }
}

function formatTimeRange(iso: string, tz: string) {
  try {
    const d = new Date(iso);
    const endD = new Date(d.getTime() + 60 * 60 * 1000);
    const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz };
    return `${new Intl.DateTimeFormat("vi-VN", opts).format(d)} – ${new Intl.DateTimeFormat("vi-VN", opts).format(endD)}`;
  } catch { return ""; }
}

function formatDateTime(iso: string, tz: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: tz }).format(new Date(iso));
  } catch { return new Date(iso).toLocaleString("vi-VN"); }
}

function AcceptanceSection({ scheduleId, onRefresh }: { scheduleId: string; onRefresh: () => void }) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [proposedAt, setProposedAt] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const respond = async (action: "accept" | "decline" | "reschedule") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/recruitment/interviews/${scheduleId}/respond`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, proposed_at: proposedAt || undefined, note: note || undefined }),
      });
      if (!res.ok) throw new Error();
      toast.success(action === "accept" ? "Đã xác nhận lịch" : action === "decline" ? "Đã từ chối lịch" : "Đã đề xuất đổi lịch");
      onRefresh();
    } catch { toast.error("Không thể cập nhật. Thử lại."); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex items-center gap-2 text-xs text-amber-300 bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2">
        <Clock className="w-3.5 h-3.5 shrink-0" /> Chờ bạn xác nhận
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={() => respond("accept")} disabled={loading}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer disabled:opacity-50">
          <CheckCircle className="w-3.5 h-3.5" /> Xác nhận
        </button>
        <button onClick={() => respond("decline")} disabled={loading}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-rose-500/10 border border-rose-500/25 text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer disabled:opacity-50">
          <XCircle className="w-3.5 h-3.5" /> Từ chối
        </button>
        <button onClick={() => setShowReschedule(!showReschedule)} disabled={loading}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-white/5 border border-white/12 text-[#8B99B0] hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50">
          <RefreshCw className="w-3.5 h-3.5" /> Đổi slot
        </button>
      </div>
      {showReschedule && (
        <div className="flex flex-col gap-2 p-3 rounded-xl border border-white/8 bg-white/3">
          <input type="datetime-local" value={proposedAt} onChange={e => setProposedAt(e.target.value)}
            className="h-8 rounded-lg border border-white/10 bg-transparent px-3 text-xs [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-[#7C8FFF]/40" />
          <input type="text" placeholder="Lý do (tuỳ chọn)" value={note} onChange={e => setNote(e.target.value)}
            className="h-8 rounded-lg border border-white/10 bg-transparent px-3 text-xs placeholder:text-[#5A6882] focus:outline-none focus:ring-2 focus:ring-[#7C8FFF]/40" />
          <button onClick={() => respond("reschedule")} disabled={!proposedAt || loading}
            className="h-8 rounded-lg text-xs font-medium bg-[#5B6CF0] hover:bg-[#4958d6] text-white disabled:opacity-50 transition-colors cursor-pointer">
            Gửi đề xuất
          </button>
        </div>
      )}
    </div>
  );
}

interface Props {
  item: InterviewItem;
  anchorRect: DOMRect;
  userRole: string;
  onClose: () => void;
  onRefresh: () => void;
}

export default function InterviewEventDetail({ item, anchorRect, userRole, onClose, onRefresh }: Props) {
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = anchorRect.right + 12 + POPUP_W > vw
      ? Math.max(8, anchorRect.left - POPUP_W - 12)
      : anchorRect.right + 12;
    const top = Math.min(Math.max(8, anchorRect.top - 8), vh - 400);
    const frame = requestAnimationFrame(() => setPos({ left, top }));
    return () => cancelAnimationFrame(frame);
  }, [anchorRect]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const candidate = item.job_applications?.persons?.full_name ?? "—";
  const jd = item.job_applications?.job_descriptions;
  const colorKey = item.status !== "scheduled" ? "completed" : item.interviewer_status;
  const dotColor = DOT_COLORS[colorKey] ?? "#475569";
  const cfg = STATUS_CONFIG[item.interviewer_status];
  const isPending = item.interviewer_status === "pending" && userRole === "interviewer";
  const isHrOrAdmin = userRole !== "interviewer";
  const showActions = isPending || (isHrOrAdmin && item.interviewer_status === "reschedule_requested");

  const iconBtn = "w-8 h-8 rounded-lg flex items-center justify-center text-[#5A6882] hover:text-[#8B99B0] hover:bg-white/8 transition-all cursor-pointer";

  return (
    <>
      <div className="fixed inset-0 z-[998]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: -6 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "fixed", left: pos.left, top: pos.top, width: POPUP_W, zIndex: 999 }}
        className="bg-[#1A2440] border border-white/[0.12] rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden"
      >
        {/* Action bar */}
        <div className="flex items-center justify-end gap-0.5 px-2 pt-2.5 pb-0">
          {item.job_applications?.id && (
            <a href={`/dashboard/recruitment/${item.job_applications.id}`} className={iconBtn} title="Xem hồ sơ">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button onClick={onClose} className={iconBtn}><X className="w-4 h-4" /></button>
        </div>

        {/* Body */}
        <div className="px-4 pb-4 pt-2 flex flex-col gap-3">
          {/* Title + datetime */}
          <div className="flex items-start gap-3">
            <div className="w-3.5 h-3.5 rounded-[3px] mt-0.5 shrink-0" style={{ backgroundColor: dotColor }} />
            <div>
              <p className="text-[15px] font-semibold text-[#ECF0F7] leading-snug">{candidate}</p>
              <p className="text-xs text-[#8B99B0] mt-0.5 capitalize">
                {formatDate(item.scheduled_at, item.timezone)} · {formatTimeRange(item.scheduled_at, item.timezone)}
              </p>
            </div>
          </div>

          {/* Job info */}
          {jd && (
            <div className="flex items-center gap-2.5">
              <Briefcase className="w-4 h-4 shrink-0 text-[#4A5568]" />
              <span className="text-[13px] text-[#8B99B0]">{jd.title}{jd.department ? ` · ${jd.department}` : ""}</span>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-2.5">
            <Tag className="w-4 h-4 shrink-0 text-[#4A5568]" />
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-wider ${cfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            {item.status === "completed" && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-emerald-500/10 text-emerald-300 border-emerald-500/25 uppercase tracking-wider">Hoàn thành</span>
            )}
          </div>

          {/* Reschedule proposed time */}
          {item.interviewer_proposed_at && (
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 shrink-0 text-[#4A5568]" />
              <span className="text-[13px] text-[#8B99B0]">Đề xuất: <span className="text-[#ECF0F7]">{formatDateTime(item.interviewer_proposed_at, item.timezone)}</span></span>
            </div>
          )}

          {/* Actions section */}
          {showActions && <div className="border-t border-white/6 pt-3" />}
          {isPending && <AcceptanceSection scheduleId={item.id} onRefresh={onRefresh} />}
          {isHrOrAdmin && item.interviewer_status === "reschedule_requested" && (
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/8 p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                <ShieldAlert className="w-3.5 h-3.5" /> Interviewer đề xuất đổi slot
              </div>
              {item.interviewer_note && (
                <p className="text-xs text-[#8B99B0] italic">&quot;{item.interviewer_note}&quot;</p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
