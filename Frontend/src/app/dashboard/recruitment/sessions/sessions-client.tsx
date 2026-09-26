"use client";
import { alpha } from "@/lib/utils";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Plus, Loader2 } from "lucide-react";
import SessionAgendaRow, { ROUND } from "./session-agenda-row";
import SessionCreateForm from "./session-create-form";
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

const ROUND_COLORS: Record<number, string> = { 1: ROUND[1].tone.mark, 2: ROUND[2].tone.mark, 3: ROUND[3].tone.mark };

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


    /* Agenda: nhóm theo mốc thời gian; sắp tới tăng dần, đã qua giảm dần. */
    const buckets = useMemo(() => {
        const now = new Date();
        const endToday = new Date(now); endToday.setHours(23, 59, 59, 999);
        const endWeek = new Date(endToday); endWeek.setDate(endWeek.getDate() + ((7 - endWeek.getDay()) % 7));
        const groups: { key: string; label: string; items: Session[] }[] = [
            { key: "today", label: "Hôm nay", items: [] },
            { key: "week", label: "Còn lại tuần này", items: [] },
            { key: "later", label: "Sắp tới", items: [] },
            { key: "past", label: "Đã diễn ra", items: [] },
        ];
        for (const s of filtered) {
            const t = new Date(s.scheduled_at).getTime();
            const g = t <= now.getTime() ? 3 : t <= endToday.getTime() ? 0 : t <= endWeek.getTime() ? 1 : 2;
            groups[g].items.push(s);
        }
        for (const g of groups) g.items.sort((a, b) => (g.key === "past" ? -1 : 1) * (new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()));
        return groups.filter((g) => g.items.length);
    }, [filtered]);

    return (
        <div className="space-y-5">

            <SharedDashboardPageHeader
                className="mb-0"
                title="Lịch phỏng vấn"
                icon={CalendarDays}
                badge={{ label: `${stats.upcoming} sắp tới · ${stats.totalCandidates} ứng viên · ${stats.confirmRate}% xác nhận` }}
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
                    <div className="space-y-6">
                        {buckets.map((g) => (
                            <section key={g.key}>
                                <h2 className="mb-2 flex items-baseline gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                                    {g.label} <span className="tabular-nums text-foreground">{g.items.length}</span>
                                </h2>
                                <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]">
                                    {g.items.map((s) => <SessionAgendaRow key={s.id} session={s} onNotified={fetchSessions} />)}
                                </div>
                            </section>
                        ))}
                    </div>
                )
            ) : (
                <div className="max-w-2xl">
                    <div className="relative rounded-2xl overflow-hidden"
                         style={{ background: "var(--background)", border: "1px solid color-mix(in srgb, var(--primary) 12%, transparent)" }}>
                        <div className="absolute top-0 left-0 right-0 h-[1px]"
                             style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--primary) 50%, transparent), color-mix(in srgb, var(--primary) 15%, transparent), transparent)" }} />
                        <div className="px-6 py-4 flex items-center gap-3 border-b border-border">
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
