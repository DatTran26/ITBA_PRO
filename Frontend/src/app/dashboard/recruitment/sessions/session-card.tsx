"use client";
import { alpha } from "@/lib/utils";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Building2, Phone, Bell, Loader2, Users, ChevronRight, MapPin } from "lucide-react";
import { toast } from "sonner";

const ROUND = {
    1: { label: "Round 1", color: "var(--primary)" },
    2: { label: "Round 2", color: "var(--warning)" },
    3: { label: "Final",   color: "var(--ai)" },
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
                background: "var(--background)",
                border: `1px solid ${alpha(cfg.color, 13)}`,
                boxShadow: `0 0 0 0 ${alpha(cfg.color, 0)}`,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px ${alpha(cfg.color, 21)}`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${alpha(cfg.color, 0)}`; }}
        >
            {/* Top gradient edge */}
            <div className="absolute top-0 left-0 right-0 h-[1px]"
                 style={{ background: `linear-gradient(90deg, transparent, ${alpha(cfg.color, 38)}, transparent)` }} />

            {/* Right-edge signal bar */}
            <div className="absolute top-0 right-0 w-[2px] h-full"
                 style={{ background: `linear-gradient(180deg, ${alpha(cfg.color, 0)}, ${alpha(cfg.color, 50)}, ${alpha(cfg.color, 0)})` }} />

            {/* ── Header row ── */}
            <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-lg"
                          style={{ background: `${alpha(cfg.color, 8)}`, color: cfg.color, border: `1px solid ${alpha(cfg.color, 19)}` }}>
                        {cfg.label}
                    </span>
                    {isPast && (
                        <span className="text-[10px] text-muted-foreground bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                            Đã qua
                        </span>
                    )}
                </div>
                {session.notification_sent_at ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: "color-mix(in srgb, var(--success) 10%, transparent)", color: "var(--success)", border: "1px solid color-mix(in srgb, var(--success) 20%, transparent)" }}>
                        <Bell className="w-2.5 h-2.5" /> Đã gửi
                    </span>
                ) : session.candidate_count > 0 ? (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: "color-mix(in srgb, var(--warning) 10%, transparent)", color: "var(--warning)", border: "1px solid color-mix(in srgb, var(--warning) 20%, transparent)" }}>
                        <Bell className="w-2.5 h-2.5" /> Chờ gửi
                    </span>
                ) : null}
            </div>

            {/* ── Date / Time ── */}
            <div className="px-4 pb-3">
                <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                     style={{ background: `${alpha(cfg.color, 4)}`, border: `1px solid ${alpha(cfg.color, 9)}` }}>
                    {/* Date stack */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                           style={{ color: `${alpha(cfg.color, 56)}` }}>{weekday}</p>
                        <p className="text-base font-bold text-foreground font-display leading-none">
                            {day}/{month}/{year}
                        </p>
                    </div>
                    {/* Time */}
                    <div className="text-right">
                        <p className="text-3xl font-light font-display leading-none"
                           style={{ color: cfg.color, textShadow: `0 0 24px ${alpha(cfg.color, 38)}` }}>
                            {time}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">{session.duration_minutes} phút</p>
                    </div>
                </div>
            </div>

            {/* ── Meta ── */}
            <div className="px-4 pb-3 flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <LocIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    {loc.label}
                    {session.location_detail && (
                        <span className="text-muted-foreground truncate max-w-[110px]">· {session.location_detail}</span>
                    )}
                </div>
                {session.job_descriptions && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[130px]">{session.job_descriptions.title}</span>
                    </div>
                )}
            </div>

            {/* ── Candidates ── */}
            <div className="px-4 pb-4 flex-1 space-y-2.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{session.candidate_count}</span>
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
                                <div className="h-full rounded-full" style={{ width: `${(session.confirmed_count/session.candidate_count)*100}%`, background: "var(--success)", boxShadow: "0 0 8px color-mix(in srgb, var(--success) 60%, transparent)" }} />
                            )}
                            {session.pending_count > 0 && (
                                <div className="h-full rounded-full opacity-60" style={{ width: `${(session.pending_count/session.candidate_count)*100}%`, background: "var(--warning)" }} />
                            )}
                            {session.declined_count > 0 && (
                                <div className="h-full rounded-full opacity-50" style={{ width: `${(session.declined_count/session.candidate_count)*100}%`, background: "var(--danger)" }} />
                            )}
                        </div>
                        {/* Legend */}
                        <div className="flex items-center gap-3 flex-wrap">
                            {session.confirmed_count > 0 && <Dot color="var(--success)" label={`${session.confirmed_count} xác nhận`} />}
                            {session.pending_count > 0    && <Dot color="var(--warning)" label={`${session.pending_count} chờ`} dim />}
                            {session.declined_count > 0   && <Dot color="var(--danger)" label={`${session.declined_count} từ chối`} dim />}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Footer ── */}
            <div className="px-4 py-3 flex items-center gap-2 border-t border-white/[0.04]">
                {session.candidate_count > 0 && (
                    <button onClick={handleNotify} disabled={notifying}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150 cursor-pointer disabled:opacity-50 hover:opacity-90"
                            style={{ background: "color-mix(in srgb, var(--success) 8%, transparent)", color: "var(--success)", borderColor: "color-mix(in srgb, var(--success) 22%, transparent)" }}>
                        {notifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                        {session.notification_sent_at ? "Gửi lại" : "Gửi thông báo"}
                    </button>
                )}
                <button onClick={e => { e.stopPropagation(); router.push(`/dashboard/recruitment/sessions/${session.id}`); }}
                        className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors cursor-pointer">
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
