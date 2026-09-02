"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Plus, Loader2, ChevronRight } from "lucide-react";
import SessionCard from "./session-card";
import SessionCreateForm from "./session-create-form";
import SessionStatCards from "./session-stat-cards";
import SessionsEmptyState from "./sessions-empty-state";

interface Session {
    id: string; round: 1 | 2 | 3; scheduled_at: string; duration_minutes: number;
    location_type: "online" | "office" | "phone"; location_detail: string | null;
    notification_sent_at: string | null; candidate_count: number;
    confirmed_count: number; pending_count: number; declined_count: number;
    job_descriptions: { id: string; title: string } | null;
}

type TabId       = "list" | "create";
type TimeFilter  = "all"  | "upcoming" | "past";
type RoundFilter = 0 | 1 | 2 | 3;
interface Props { userRole: string; }

const ROUND_COLORS: Record<number, string> = { 1: "#7C8FFF", 2: "#F59E0B", 3: "#B48EFF" };

export default function SessionsClient({ userRole }: Props) {
    const router = useRouter();
    const preselect = useSearchParams().get("preselect");

    const [tab,         setTab]         = useState<TabId>("list");
    const [sessions,    setSessions]    = useState<Session[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [timeFilter,  setTimeFilter]  = useState<TimeFilter>("all");
    const [roundFilter, setRoundFilter] = useState<RoundFilter>(0);

    const canManage = ["hr", "admin", "super_admin"].includes(userRole);

    const fetchSessions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/recruitment/sessions");
            if (res.ok) setSessions((await res.json()).sessions ?? []);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);
    useEffect(() => { if (preselect) setTab("create"); }, [preselect]);

    const filtered = useMemo(() => {
        const now = Date.now();
        return sessions.filter((s) => {
            const t = new Date(s.scheduled_at).getTime();
            if (timeFilter === "upcoming" && t <= now) return false;
            if (timeFilter === "past"     && t > now)  return false;
            if (roundFilter !== 0 && s.round !== roundFilter) return false;
            return true;
        });
    }, [sessions, timeFilter, roundFilter]);

    const stats = useMemo(() => {
        const now = Date.now();
        const totalCandidates = sessions.reduce((a, s) => a + s.candidate_count, 0);
        const totalConfirmed  = sessions.reduce((a, s) => a + s.confirmed_count,  0);
        return {
            total:          sessions.length,
            upcoming:       sessions.filter(s => new Date(s.scheduled_at).getTime() > now).length,
            totalCandidates,
            confirmRate:    totalCandidates > 0 ? Math.round((totalConfirmed / totalCandidates) * 100) : 0,
        };
    }, [sessions]);

    return (
        <div className="space-y-5">

            {/* ── Hero Header ─────────────────────────────────────── */}
            <div className="relative pb-4 border-b border-[#8B99B0]/8">
                {/* Atmospheric background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-48 opacity-[0.06]"
                         style={{ background: "radial-gradient(ellipse at 100% 0%, #7C8FFF, transparent 70%)" }} />
                    <div className="absolute bottom-0 left-1/3 w-64 h-24 opacity-[0.04]"
                         style={{ background: "radial-gradient(ellipse, #B48EFF, transparent 70%)" }} />
                </div>

                <div className="relative flex items-end justify-between gap-4">
                    <div>
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-[11px] text-[#5A6882] font-medium">Tuyển dụng</span>
                            <ChevronRight className="w-3 h-3 text-[#3D4F6A]" />
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                  style={{ background: "rgba(124,143,255,0.12)", color: "#7C8FFF", border: "1px solid rgba(124,143,255,0.2)" }}>
                                Schedule
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-xl font-bold leading-tight font-display mb-1"
                            style={{ background: "linear-gradient(135deg, #ECF0F7 0%, #8B99B0 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            Schedule Phỏng vấn
                        </h1>
                        <p className="text-xs text-[#5A6882]">
                            Tạo buổi phỏng vấn theo vòng · Xếp ứng viên · Theo dõi xác nhận
                        </p>
                    </div>

                    {canManage && (
                        <button
                            onClick={() => setTab("create")}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all duration-200 cursor-pointer hover:opacity-90 active:scale-[0.98] shrink-0"
                            style={{ background: "linear-gradient(135deg, #7C8FFF, #5B6CF0)", boxShadow: "0 0 20px rgba(124,143,255,0.3)" }}
                        >
                            <Plus className="w-3.5 h-3.5" /> Tạo mới
                        </button>
                    )}
                </div>
            </div>

            {/* ── Stats ───────────────────────────────────────────── */}
            <SessionStatCards stats={stats} />

            {/* ── Command Bar ─────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3 p-1.5 rounded-2xl"
                 style={{ background: "#080C17", border: "1px solid rgba(139,153,176,0.1)" }}>

                {/* Tabs */}
                <div className="flex items-center gap-0.5">
                    <CmdTab active={tab === "list"} onClick={() => setTab("list")}>
                        <CalendarDays className="w-3.5 h-3.5" /> Danh sách
                    </CmdTab>
                    {canManage && (
                        <CmdTab active={tab === "create"} onClick={() => setTab("create")}>
                            <Plus className="w-3.5 h-3.5" /> Tạo mới
                        </CmdTab>
                    )}
                </div>

                {/* Vertical divider */}
                {tab === "list" && <div className="w-px h-5 bg-[#8B99B0]/15 mx-1" />}

                {/* Filters */}
                {tab === "list" && (
                    <div className="flex items-center gap-1.5 flex-wrap flex-1">
                        {(["all", "upcoming", "past"] as TimeFilter[]).map(f => (
                            <Chip key={f} active={timeFilter === f} onClick={() => setTimeFilter(f)}>
                                {{ all: "Tất cả", upcoming: "Sắp tới", past: "Đã qua" }[f]}
                            </Chip>
                        ))}
                        <div className="w-px h-4 bg-[#8B99B0]/12 mx-0.5" />
                        {([0, 1, 2, 3] as RoundFilter[]).map(r => (
                            <Chip key={r} active={roundFilter === r}
                                  accent={r !== 0 ? ROUND_COLORS[r] : undefined}
                                  onClick={() => setRoundFilter(r)}>
                                {r === 0 ? "Tất cả vòng" : ["","Round 1","Round 2","Final"][r]}
                            </Chip>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Content ─────────────────────────────────────────── */}
            {tab === "list" ? (
                loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                             style={{ background: "rgba(124,143,255,0.1)", border: "1px solid rgba(124,143,255,0.2)", boxShadow: "0 0 24px rgba(124,143,255,0.15)" }}>
                            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#7C8FFF" }} />
                        </div>
                        <p className="text-xs text-[#5A6882]">Đang tải danh sách buổi phỏng vấn...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <SessionsEmptyState
                        hasFilters={timeFilter !== "all" || roundFilter !== 0}
                        canManage={canManage}
                        onReset={() => { setTimeFilter("all"); setRoundFilter(0); }}
                        onCreate={() => setTab("create")}
                    />
                ) : (
                    <div className="space-y-4">
                        {/* Count divider */}
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-[#8B99B0]/8" />
                            <span className="text-[11px] font-semibold text-[#5A6882] tracking-wide">
                                {filtered.length} buổi phỏng vấn{timeFilter !== "all" || roundFilter !== 0 ? " · đã lọc" : ""}
                            </span>
                            <div className="h-px flex-1 bg-[#8B99B0]/8" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filtered.map(s => <SessionCard key={s.id} session={s} onNotified={fetchSessions} />)}
                        </div>
                    </div>
                )
            ) : (
                <div className="max-w-2xl">
                    <div className="relative rounded-2xl overflow-hidden"
                         style={{ background: "#090D18", border: "1px solid rgba(139,153,176,0.12)" }}>
                        <div className="absolute top-0 left-0 right-0 h-[1px]"
                             style={{ background: "linear-gradient(90deg, rgba(124,143,255,0.5), rgba(124,143,255,0.15), transparent)" }} />
                        <div className="px-6 py-4 flex items-center gap-3 border-b border-white/[0.04]">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                 style={{ background: "rgba(124,143,255,0.12)", border: "1px solid rgba(124,143,255,0.22)" }}>
                                <Plus className="w-3.5 h-3.5" style={{ color: "#7C8FFF" }} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[#ECF0F7]">Tạo buổi phỏng vấn mới</p>
                                <p className="text-[11px] text-[#5A6882]">Điền thông tin · Sau đó assign ứng viên</p>
                            </div>
                        </div>
                        <div className="p-6"><SessionCreateForm onCreated={(id) => { fetchSessions(); router.push(`/dashboard/recruitment/sessions/${id}`); }} /></div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Micro-components ──────────────────────────────────────── */

function CmdTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button onClick={onClick} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
                style={active
                    ? { background: "linear-gradient(135deg, #7C8FFF, #5B6CF0)", color: "#fff", boxShadow: "0 0 20px rgba(124,143,255,0.4)" }
                    : { color: "#8B99B0" }
                }
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "#ECF0F7"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "#8B99B0"; }}>
            {children}
        </button>
    );
}

function Chip({ active, accent, onClick, children }: { active: boolean; accent?: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <button onClick={onClick}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer border"
                style={active && accent
                    ? { background: `${accent}18`, color: accent, borderColor: `${accent}40`, boxShadow: `0 0 10px ${accent}25` }
                    : active
                    ? { background: "rgba(124,143,255,0.12)", color: "#ECF0F7", borderColor: "rgba(124,143,255,0.3)", boxShadow: "0 0 10px rgba(124,143,255,0.2)" }
                    : { color: "#5A6882", borderColor: "transparent" }
                }>
            {children}
        </button>
    );
}
