"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Building2, Phone, Bell, Loader2, Users, ChevronRight, MapPin } from "lucide-react";
import { toast } from "sonner";

const ROUND = {
    1: { label: "Round 1", color: "#7C8FFF" },
    2: { label: "Round 2", color: "#F59E0B" },
    3: { label: "Final",   color: "#B48EFF" },
} as const;

const LOC = {
    online: { icon: Video,     label: "Online"    },
    office: { icon: Building2, label: "Văn phòng" },
    phone:  { icon: Phone,     label: "Điện thoại" },
} as const;

function fmtDate(iso: string) {
    const d = new Date(iso);
    const days = ["CN","T2","T3","T4","T5","T6","T7"];
    return {
        weekday: days[d.getDay()],
        day:     String(d.getDate()).padStart(2,"0"),
        month:   String(d.getMonth()+1).padStart(2,"0"),
        year:    d.getFullYear(),
    };
}

function fmtTime(iso: string) {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

export interface SessionCardData {
    id: string; round: 1|2|3; scheduled_at: string; duration_minutes: number;
    location_type: "online"|"office"|"phone"; location_detail: string|null;
    notification_sent_at: string|null; candidate_count: number;
    confirmed_count: number; pending_count: number; declined_count: number;
    job_descriptions: { title: string }|null;
}

export default function SessionCard({ session, onNotified }: { session: SessionCardData; onNotified: () => void }) {
    const router = useRouter();
    const [notifying, setNotifying] = useState(false);

    const cfg     = ROUND[session.round];
    const loc     = LOC[session.location_type];
    const LocIcon = loc.icon;
    const { weekday, day, month, year } = fmtDate(session.scheduled_at);
    const time      = fmtTime(session.scheduled_at);
    const isPast    = new Date(session.scheduled_at).getTime() <= Date.now();
    const confirmPct = session.candidate_count > 0
        ? Math.round((session.confirmed_count / session.candidate_count) * 100) : 0;

    const handleNotify = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setNotifying(true);
        try {
            const res  = await fetch(`/api/recruitment/sessions/${session.id}/notify`, { method: "POST" });
            const json = await res.json();
            if (!res.ok) { toast.error(json.error ?? "Gửi thất bại"); return; }
            toast.success(`Đã gửi ${json.sent} email`);
            onNotified();
        } catch { toast.error("Lỗi kết nối"); }
        finally   { setNotifying(false); }
    };

    return (
        <div
            onClick={() => router.push(`/dashboard/recruitment/sessions/${session.id}`)}
            className="group relative flex flex-col overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
            style={{
                background: "#090D18",
                border: `1px solid ${cfg.color}20`,
                boxShadow: `0 0 0 0 ${cfg.color}00`,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px ${cfg.color}35`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${cfg.color}00`; }}
        >
            {/* Top gradient edge */}
            <div className="absolute top-0 left-0 right-0 h-[1px]"
                 style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}60, transparent)` }} />

            {/* Right-edge signal bar */}
            <div className="absolute top-0 right-0 w-[2px] h-full"
                 style={{ background: `linear-gradient(180deg, ${cfg.color}00, ${cfg.color}80, ${cfg.color}00)` }} />

            {/* ── Header row ── */}
            <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-lg"
                          style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                        {cfg.label}
                    </span>
                    {isPast && (
                        <span className="text-[10px] text-[#5A6882] bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                            Đã qua
                        </span>
                    )}
                </div>
                {session.notification_sent_at ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(54,221,171,0.1)", color: "#36DDAB", border: "1px solid rgba(54,221,171,0.2)" }}>
                        <Bell className="w-2.5 h-2.5" /> Đã gửi
                    </span>
                ) : session.candidate_count > 0 ? (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <Bell className="w-2.5 h-2.5" /> Chờ gửi
                    </span>
                ) : null}
            </div>

            {/* ── Date / Time ── */}
            <div className="px-4 pb-3">
                <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                     style={{ background: `${cfg.color}0A`, border: `1px solid ${cfg.color}18` }}>
                    {/* Date stack */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                           style={{ color: `${cfg.color}90` }}>{weekday}</p>
                        <p className="text-base font-bold text-[#ECF0F7] font-display leading-none">
                            {day}/{month}/{year}
                        </p>
                    </div>
                    {/* Time */}
                    <div className="text-right">
                        <p className="text-3xl font-light font-display leading-none"
                           style={{ color: cfg.color, textShadow: `0 0 24px ${cfg.color}60` }}>
                            {time}
                        </p>
                        <p className="text-[10px] text-[#5A6882] mt-1">{session.duration_minutes} phút</p>
                    </div>
                </div>
            </div>

            {/* ── Meta ── */}
            <div className="px-4 pb-3 flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-xs text-[#8B99B0]">
                    <LocIcon className="w-3.5 h-3.5 text-[#5A6882]" />
                    {loc.label}
                    {session.location_detail && (
                        <span className="text-[#5A6882] truncate max-w-[110px]">· {session.location_detail}</span>
                    )}
                </div>
                {session.job_descriptions && (
                    <div className="flex items-center gap-1 text-xs text-[#5A6882]">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[130px]">{session.job_descriptions.title}</span>
                    </div>
                )}
            </div>

            {/* ── Candidates ── */}
            <div className="px-4 pb-4 flex-1 space-y-2.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[#8B99B0]">
                        <Users className="w-3.5 h-3.5 text-[#5A6882]" />
                        <span className="font-semibold text-[#ECF0F7]">{session.candidate_count}</span>
                        <span>ứng viên</span>
                    </div>
                    {session.candidate_count > 0 && (
                        <span className="text-[11px] font-bold" style={{ color: cfg.color }}>{confirmPct}% xác nhận</span>
                    )}
                </div>

                {session.candidate_count > 0 && (
                    <div className="space-y-1.5">
                        {/* Segmented bar */}
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex gap-px">
                            {session.confirmed_count > 0 && (
                                <div className="h-full rounded-full" style={{ width: `${(session.confirmed_count/session.candidate_count)*100}%`, background: "#36DDAB", boxShadow: "0 0 8px rgba(54,221,171,0.6)" }} />
                            )}
                            {session.pending_count > 0 && (
                                <div className="h-full rounded-full opacity-60" style={{ width: `${(session.pending_count/session.candidate_count)*100}%`, background: "#F59E0B" }} />
                            )}
                            {session.declined_count > 0 && (
                                <div className="h-full rounded-full opacity-50" style={{ width: `${(session.declined_count/session.candidate_count)*100}%`, background: "#FF6B82" }} />
                            )}
                        </div>
                        {/* Legend */}
                        <div className="flex items-center gap-3 flex-wrap">
                            {session.confirmed_count > 0 && <Dot color="#36DDAB" label={`${session.confirmed_count} xác nhận`} />}
                            {session.pending_count > 0    && <Dot color="#F59E0B" label={`${session.pending_count} chờ`} dim />}
                            {session.declined_count > 0   && <Dot color="#FF6B82" label={`${session.declined_count} từ chối`} dim />}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Footer ── */}
            <div className="px-4 py-3 flex items-center gap-2 border-t border-white/[0.04]">
                {session.candidate_count > 0 && (
                    <button onClick={handleNotify} disabled={notifying}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150 cursor-pointer disabled:opacity-50 hover:opacity-90"
                            style={{ background: "rgba(54,221,171,0.08)", color: "#36DDAB", borderColor: "rgba(54,221,171,0.22)" }}>
                        {notifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                        {session.notification_sent_at ? "Gửi lại" : "Gửi thông báo"}
                    </button>
                )}
                <button onClick={e => { e.stopPropagation(); router.push(`/dashboard/recruitment/sessions/${session.id}`); }}
                        className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#5A6882] hover:text-[#ECF0F7] hover:bg-white/[0.04] transition-colors cursor-pointer">
                    Chi tiết <ChevronRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}

function Dot({ color, label, dim }: { color: string; label: string; dim?: boolean }) {
    return (
        <span className="flex items-center gap-1 text-[10px]" style={{ color, opacity: dim ? 0.7 : 1 }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
            {label}
        </span>
    );
}
