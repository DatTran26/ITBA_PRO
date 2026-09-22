"use client";
import { alpha } from "@/lib/utils";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Plus, Loader2, ChevronRight, CalendarClock, Users, UserCheck, Clock, Percent } from "lucide-react";
import SessionCard from "./session-card";
import SessionCreateForm from "./session-create-form";
import KpiCardGrid from "@/components/crm/kpi-card-grid";
import OverviewBand from "@/components/shares/overview-band";
import { DonutStat, MiniBar } from "@/components/charts";
import { SharedDashboardPageHeader } from "@/components/shares";

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

const ROUND_COLORS: Record<number, string> = { 1: "var(--primary)", 2: "var(--warning)", 3: "var(--ai)" };

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


    /* Sáu thẻ và dải biểu đồ, tất cả suy từ `sessions` đã tải. */
    const sessionKpis = useMemo(() => {
        const confirmed = sessions.reduce((a, s) => a + s.confirmed_count, 0);
        const pending   = sessions.reduce((a, s) => a + s.pending_count, 0);
        return [
            { label: "Buổi phỏng vấn", value: stats.total, icon: CalendarDays },
            { label: "Sắp tới", value: stats.upcoming, icon: CalendarClock },
            { label: "Ứng viên", value: stats.totalCandidates, icon: Users },
            { label: "Đã xác nhận", value: confirmed, icon: UserCheck },
            { label: "Chờ xác nhận", value: pending, icon: Clock },
            { label: "Tỉ lệ xác nhận", value: `${stats.confirmRate}%`, icon: Percent },
        ];
    }, [sessions, stats]);

    const byConfirmation = useMemo(() => [
        { label: "Đã xác nhận", value: sessions.reduce((a, s) => a + s.confirmed_count, 0), color: "var(--success)" },
        { label: "Chờ xác nhận", value: sessions.reduce((a, s) => a + s.pending_count, 0), color: "var(--warning)" },
        { label: "Đã từ chối",  value: sessions.reduce((a, s) => a + s.declined_count, 0), color: "var(--danger)" },
    ], [sessions]);

    const byRound = useMemo(() => ([1, 2, 3] as const).map((r) => ({
        label: `Vòng ${r}`,
        value: sessions.filter((s) => s.round === r).length,
        color: r === 1 ? "var(--primary)" : r === 2 ? "var(--ai)" : "var(--success)",
    })), [sessions]);

    // Buổi phỏng vấn theo tuần, 8 tuần gần nhất.
    const byWeek = useMemo(() => {
        const weeks: { label: string; values: number[] }[] = [];
        for (let i = 7; i >= 0; i--) {
            const end = new Date(); end.setDate(end.getDate() - i * 7);
            const start = new Date(end); start.setDate(start.getDate() - 6);
            weeks.push({
                label: `${start.getDate()}/${start.getMonth() + 1}`,
                values: [sessions.filter((s) => {
                    const t = new Date(s.scheduled_at).getTime();
                    return t >= start.setHours(0, 0, 0, 0) && t <= end.setHours(23, 59, 59, 999);
                }).length],
            });
        }
        return weeks;
    }, [sessions]);

    return (
        <div className="space-y-5">

            <SharedDashboardPageHeader
                className="mb-0"
                title="Lịch phỏng vấn"
                description="Tạo buổi phỏng vấn theo vòng, xếp ứng viên và theo dõi xác nhận"
                actions={canManage ? (
                    <button
                        onClick={() => setTab("create")}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold transition-opacity hover:opacity-90 active:scale-[0.98] shrink-0 cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" /> Tạo mới
                    </button>
                ) : undefined}
            />

            <KpiCardGrid items={sessionKpis} />

            <OverviewBand className="mb-0">
                <DonutStat title="Xác nhận của ứng viên" slices={byConfirmation} centerLabel="Ứng viên" />
                <DonutStat title="Theo vòng phỏng vấn" slices={byRound} centerLabel="Buổi" />
                <MiniBar title="Buổi phỏng vấn 8 tuần qua" groups={byWeek}
                         series={[{ label: "Buổi", color: "var(--primary)" }]} />
            </OverviewBand>

            {/* ── Command Bar ─────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3 p-1.5 rounded-2xl"
                 style={{ background: "var(--background)", border: "1px solid color-mix(in srgb, var(--primary) 10%, transparent)" }}>

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
                {tab === "list" && <div className="w-px h-5 bg-muted-foreground/15 mx-1" />}

                {/* Filters */}
                {tab === "list" && (
                    <div className="flex items-center gap-1.5 flex-wrap flex-1">
                        {(["all", "upcoming", "past"] as TimeFilter[]).map(f => (
                            <Chip key={f} active={timeFilter === f} onClick={() => setTimeFilter(f)}>
                                {{ all: "Tất cả", upcoming: "Sắp tới", past: "Đã qua" }[f]}
                            </Chip>
                        ))}
                        <div className="w-px h-4 bg-muted-foreground/12 mx-0.5" />
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
                             style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)", boxShadow: "0 0 24px color-mix(in srgb, var(--primary) 15%, transparent)" }}>
                            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--primary)" }} />
                        </div>
                        <p className="text-xs text-muted-foreground">Đang tải danh sách buổi phỏng vấn...</p>
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
                            <div className="h-px flex-1 bg-muted-foreground/8" />
                            <span className="text-[11px] font-semibold text-muted-foreground tracking-wide">
                                {filtered.length} buổi phỏng vấn{timeFilter !== "all" || roundFilter !== 0 ? " · đã lọc" : ""}
                            </span>
                            <div className="h-px flex-1 bg-muted-foreground/8" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filtered.map(s => <SessionCard key={s.id} session={s} onNotified={fetchSessions} />)}
                        </div>
                    </div>
                )
            ) : (
                <div className="max-w-2xl">
                    <div className="relative rounded-2xl overflow-hidden"
                         style={{ background: "var(--background)", border: "1px solid color-mix(in srgb, var(--primary) 12%, transparent)" }}>
                        <div className="absolute top-0 left-0 right-0 h-[1px]"
                             style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--primary) 50%, transparent), color-mix(in srgb, var(--primary) 15%, transparent), transparent)" }} />
                        <div className="px-6 py-4 flex items-center gap-3 border-b border-white/[0.04]">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                 style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 22%, transparent)" }}>
                                <Plus className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Tạo buổi phỏng vấn mới</p>
                                <p className="text-[11px] text-muted-foreground">Điền thông tin · Sau đó assign ứng viên</p>
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
                    ? { background: "linear-gradient(135deg, var(--primary), var(--primary))", color: "var(--primary-foreground)", boxShadow: "0 0 20px color-mix(in srgb, var(--primary) 40%, transparent)" }
                    : { color: "var(--muted-foreground)" }
                }
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}>
            {children}
        </button>
    );
}

function Chip({ active, accent, onClick, children }: { active: boolean; accent?: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <button onClick={onClick}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer border"
                style={active && accent
                    ? { background: `${alpha(accent, 9)}`, color: accent, borderColor: `${alpha(accent, 25)}`, boxShadow: `0 0 10px ${alpha(accent, 15)}` }
                    : active
                    ? { background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--foreground)", borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)", boxShadow: "0 0 10px color-mix(in srgb, var(--primary) 20%, transparent)" }
                    : { color: "var(--muted-foreground)", borderColor: "transparent" }
                }>
            {children}
        </button>
    );
}
