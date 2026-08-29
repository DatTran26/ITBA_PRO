"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useRouter } from "next/navigation";
import {
    Users, TrendingUp, Clock,
    Upload, FileText,
    ArrowRight, Target, UserPlus, Search, MoreVertical,
    ChevronRight, Eye, Sparkles, Activity, Calendar,
    CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import StageFunnel from "@/components/recruitment/stage-funnel";
import DataTable from "@/components/crm/data-table";
import ScheduleInterviewDialog from "@/components/recruitment/schedule-interview-dialog";
import type { ColumnDef } from "@/lib/crm/types";
import type { PipelineStatus } from "@/types/recruitment";

interface HrUser { name: string; email: string; role: string }
interface DashboardStats {
    totalCvsUploaded: number;
    byStatus: Record<string, number>;
    avgAiScore: number;
    passRate: number;
    offerAcceptanceRate: number;
    processingQueue: number;
    funnel: Array<{ stage: string; count: number }>;
}
interface AppRow {
    id: string; candidateName: string; jdTitle: string;
    pipelineStatus: PipelineStatus; aiScore: number | null; createdAt: string;
}

/* ───── Stats Config ───── */
const STATS_CONFIG = [
    {
        key: "cvs",
        label: "Hồ Sơ Đã Tiếp Nhận",
        icon: FileText,
        color: "#7C8FFF",
        getValue: (s: DashboardStats) => s.totalCvsUploaded
    },
    {
        key: "apps",
        label: "Tổng Số Ứng Viên",
        icon: Users,
        color: "#B48EFF",
        getValue: (s: DashboardStats) => Object.values(s.byStatus ?? {}).reduce((a, b) => a + b, 0)
    },
    {
        key: "queue",
        label: "Hồ Sơ Đang Chờ",
        icon: Clock,
        color: "#FFB547",
        getValue: (s: DashboardStats) => s.processingQueue
    },
    {
        key: "pass",
        label: "Tỷ Lệ Đạt PV",
        icon: Target,
        color: "#36DDAB",
        getValue: (s: DashboardStats) => `${s.passRate ?? 0}%`
    }
];

/* ───── Status Badge Colors ───── */
const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
    'NEW': { bg: 'bg-[#7C8FFF]/10', text: 'text-[#7C8FFF]', border: 'border-[#7C8FFF]/20', label: 'New' },
    'SCREENED': { bg: 'bg-[#B48EFF]/10', text: 'text-[#B48EFF]', border: 'border-[#B48EFF]/20', label: 'Screened' },
    'SHORTLISTED': { bg: 'bg-[#06B6D4]/10', text: 'text-[#06B6D4]', border: 'border-[#06B6D4]/20', label: 'Shortlisted' },
    'INTERVIEW_SCHEDULED': { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20', label: 'Interview' },
    'INTERVIEWED': { bg: 'bg-[#FFB547]/10', text: 'text-[#FFB547]', border: 'border-[#FFB547]/20', label: 'Interviewed' },
    'PASSED': { bg: 'bg-[#36DDAB]/10', text: 'text-[#36DDAB]', border: 'border-[#36DDAB]/20', label: 'Passed' },
    'REJECTED': { bg: 'bg-[#FF6B82]/10', text: 'text-[#FF6B82]', border: 'border-[#FF6B82]/20', label: 'Rejected' },
    'OFFERED': { bg: 'bg-[#22C55E]/10', text: 'text-[#22C55E]', border: 'border-[#22C55E]/20', label: 'Offered' },
    'ONBOARDED': { bg: 'bg-[#36DDAB]/10', text: 'text-[#36DDAB]', border: 'border-[#36DDAB]/30', label: 'Onboarded' },
};

/* ───── AI Score Label ───── */
function getScoreLabel(score: number | null): { label: string; color: string } {
    if (!score) return { label: "—", color: "#5A6882" };
    if (score >= 80) return { label: "Excellent", color: "#36DDAB" };
    if (score >= 60) return { label: "Good", color: "#7C8FFF" };
    if (score >= 40) return { label: "Fair", color: "#FFB547" };
    return { label: "Low", color: "#FF6B82" };
}

/* ───── Avatar Color Hash ───── */
function nameToColor(name: string): string {
    const colors = [
        "from-[#5B6CF0] to-[#7C8FFF]",
        "from-[#8B5CF6] to-[#B48EFF]",
        "from-[#06B6D4] to-[#22D3EE]",
        "from-[#F59E0B] to-[#FBBF24]",
        "from-[#36DDAB] to-[#6EE7B7]",
        "from-[#FF6B82] to-[#FDA4AF]",
        "from-[#EC4899] to-[#F472B6]",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

/* ───── Table Tab Filters ───── */
const TABLE_TABS = [
    { key: "all", label: "Tất cả" },
    { key: "NEW", label: "Mới" },
    { key: "SCREENED", label: "Đã sàng lọc" },
    { key: "SHORTLISTED", label: "Tiềm năng" },
    { key: "PASSED", label: "Đã đạt" },
];

/* ───── Activity Feed ───── */
type ActivityEvent = {
  type: "cv_analyzed" | "cv_uploaded" | "status_changed" | "interview_scheduled";
  text: string; sub: string; createdAt: string;
};
function activityMeta(type: ActivityEvent["type"]) {
  switch (type) {
    case "cv_analyzed":        return { icon: CheckCircle2, color: "#36DDAB" };
    case "cv_uploaded":        return { icon: Upload,       color: "#7C8FFF" };
    case "status_changed":     return { icon: Sparkles,     color: "#B48EFF" };
    case "interview_scheduled": return { icon: Calendar,    color: "#F59E0B" };
    default:                   return { icon: Activity,     color: "#5A6882" };
  }
}

/* ───── Columns Definition ───── */
const COLUMNS: ColumnDef<AppRow>[] = [
    {
        key: "candidateName",
        label: "Ứng viên",
        render: (v, row) => {
            const name = v as string;
            const gradient = nameToColor(name);
            return (
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[10px] font-bold shadow-lg`}>
                        {name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <span className="font-semibold text-[#ECF0F7] group-hover:text-[#7C8FFF] transition-colors block truncate">{name}</span>
                        <span className="text-[10px] text-[#5A6882] truncate block">{(row as AppRow).jdTitle}</span>
                    </div>
                </div>
            );
        }
    },
    { key: "jdTitle", label: "Vị trí", render: (v) => <span className="text-[#8B99B0] text-sm">{v as string}</span> },
    {
        key: "pipelineStatus",
        label: "Trạng thái",
        render: (v: unknown) => {
            const status = v as string;
            const s = STATUS_CONFIG[status] || { bg: 'bg-[#8B99B0]/10', text: 'text-[#8B99B0]', border: 'border-[#8B99B0]/20', label: status };
            return (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${s.bg} ${s.text} ${s.border}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${s.text.replace('text-', 'bg-')} animate-pulse`} />
                    {s.label}
                </div>
            );
        }
    },
    {
        key: "aiScore",
        label: "Đánh giá AI",
        render: (v) => {
            const score = v as number;
            const { label, color } = getScoreLabel(score);
            const pct = score ?? 0;
            const r = 18;
            const circ = 2 * Math.PI * r;
            const offset = circ - (pct / 100) * circ;
            return (
                <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 44 44">
                            <circle cx="22" cy="22" r={r} stroke="rgba(255,255,255,0.05)" strokeWidth="3" fill="transparent" />
                            <circle
                                cx="22" cy="22" r={r}
                                stroke={color}
                                strokeWidth="3"
                                fill="transparent"
                                strokeDasharray={circ}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <span className="absolute text-xs font-mono font-bold" style={{ color: score ? color : '#5A6882' }}>{score ?? '—'}</span>
                    </div>
                    <div className="hidden xl:flex flex-col gap-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
                        <div className="h-1 w-16 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                    </div>
                </div>
            );
        }
    },
    { key: "createdAt", label: "Ngày nhận", render: (v) => <span className="text-xs font-mono text-[#8B99B0]">{v as string}</span> },
    {
        key: "id",
        label: "",
        render: (v, row) => (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {row.pipelineStatus === "SHORTLISTED" && (
                    <ScheduleInterviewDialog
                        applicationId={row.id}
                        onSuccess={() => { }} // Local refresh handled by parent periodicity/fetchData
                        trigger={
                            <button className="p-1.5 rounded-lg hover:bg-[#F59E0B]/10 text-[#5A6882] hover:text-[#F59E0B] transition-colors" title="Lên lịch PV">
                                <Calendar size={14} />
                            </button>
                        }
                    />
                )}
                <button
                    onClick={() => { window.location.href = `/dashboard/recruitment/${row.id}`; }}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-[#5A6882] hover:text-[#7C8FFF] transition-colors" title="Xem chi tiết"
                >
                    <Eye size={14} />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-white/5 text-[#5A6882] hover:text-[#7C8FFF] transition-colors" title="Khác">
                    <MoreVertical size={14} />
                </button>
            </div>
        )
    }
];

export default function HrDashboardClient({ user }: { user: HrUser }) {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [apps, setApps] = useState<AppRow[]>([]);
    const [activities, setActivities] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, appsRes, activityRes] = await Promise.all([
                fetch("/api/recruitment/dashboard"),
                fetch("/api/recruitment/applications?pageSize=20"),
                fetch("/api/recruitment/activity"),
            ]);

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
            }

            if (appsRes.ok) {
                const d = await appsRes.json();
                type AppRaw = { id: string; person?: { fullName?: string }; jobDescription?: { title?: string }; pipelineStatus: string; screening?: { aiScore?: number | null }; createdAt: string };
                setApps((d.applications ?? []).map((a: AppRaw) => ({
                    id: a.id,
                    candidateName: a.person?.fullName ?? "—",
                    jdTitle: a.jobDescription?.title ?? "—",
                    pipelineStatus: a.pipelineStatus,
                    aiScore: a.screening?.aiScore ?? null,
                    createdAt: new Date(a.createdAt).toLocaleDateString("vi-VN"),
                })));
            }
            if (activityRes.ok) {
                const d = await activityRes.json();
                setActivities(d.activities ?? []);
            }
        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    /* Filter apps by tab and search query */
    const filteredApps = useMemo(() => {
        let result = apps;
        if (activeTab !== "all") {
            result = result.filter(a => a.pipelineStatus === activeTab);
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(a =>
                a.candidateName.toLowerCase().includes(query) ||
                a.jdTitle.toLowerCase().includes(query)
            );
        }
        return result;
    }, [apps, activeTab, searchQuery]);

    /* Tab counts */
    const tabCounts = useMemo(() => {
        const counts: Record<string, number> = { all: apps.length };
        for (const app of apps) {
            counts[app.pipelineStatus] = (counts[app.pipelineStatus] ?? 0) + 1;
        }
        return counts;
    }, [apps]);

    /* Compute New→Offer conversion rate from funnel */
    const conversionRate = useMemo(() => {
        if (!stats?.funnel?.length) return null;
        const byStage = Object.fromEntries(stats.funnel.map(f => [f.stage, f.count]));
        const newCount = byStage["NEW"] ?? 0;
        const offerCount = (byStage["OFFERED"] ?? 0) + (byStage["ONBOARDED"] ?? 0);
        if (newCount === 0) return null;
        return Math.round((offerCount / newCount) * 1000) / 10;
    }, [stats?.funnel]);

    return (
        <div className="pb-12 space-y-8">
                {/* ═══ STATS GRID ═══ */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-36 bg-[#1B253B] border border-[#8B99B0]/12 rounded-2xl animate-pulse" />
                        ))
                    ) : (
                        STATS_CONFIG.map((stat, idx) => (
                            <motion.div
                                key={stat.key}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                className="bg-[#1B253B] border border-[#8B99B0]/12 p-6 rounded-2xl relative overflow-hidden group transition-all hover:shadow-lg cursor-default"
                                style={{ '--glow': stat.color } as React.CSSProperties}
                            >
                                {/* Hover glow border */}
                                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                    style={{ boxShadow: `inset 0 0 0 1px ${stat.color}30, 0 0 20px ${stat.color}08` }}
                                />

                                <div className="relative z-10 flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-[#5A6882] uppercase tracking-[0.15em]">{stat.label}</p>
                                        <p className="text-4xl font-display font-light text-[#ECF0F7]">
                                            {stats ? stat.getValue(stats) : "—"}
                                        </p>
                                        <p className="text-[9px] text-[#5A6882] mt-1">30 ngày gần nhất</p>
                                    </div>
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#121A2E] border border-white/5 group-hover:scale-110 transition-transform duration-300"
                                        style={{ color: stat.color }}
                                    >
                                        <stat.icon size={22} />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* ═══ MAIN LAYOUT ═══ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* ─── LEFT: Table + Activity ─── */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        {/* Table Section */}
                        <section className="bg-[#1B253B] border border-[#8B99B0]/12 rounded-2xl overflow-hidden shadow-xl">
                            {/* Compact Unified Toolbar */}
                            <div className="px-4 py-3 border-b border-[#8B99B0]/12 bg-[#161F35]/30">
                                {/* Row 1: Title + Search */}
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <h2 className="text-base font-display font-semibold text-[#ECF0F7] shrink-0">Hồ sơ ứng tuyển</h2>
                                    <div className="relative group/search">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6882] pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder="Tìm ứng viên..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-[#121A2E] border border-white/5 rounded-lg pl-8 pr-3 py-2 text-xs text-[#ECF0F7] placeholder:text-[#5A6882] outline-none w-36 focus:w-52 transition-all duration-300 focus:border-[#5B6CF0]/40 focus:ring-1 focus:ring-[#5B6CF0]/20"
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Tab Chips */}
                                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                                    {TABLE_TABS.map(tab => {
                                        const count = tabCounts[tab.key] ?? 0;
                                        const isActive = activeTab === tab.key;
                                        return (
                                            <button
                                                key={tab.key}
                                                onClick={() => setActiveTab(tab.key)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${isActive
                                                    ? 'bg-[#5B6CF0] text-white shadow-lg shadow-[#5B6CF0]/20'
                                                    : 'bg-white/5 text-[#8B99B0] hover:bg-white/10 hover:text-[#ECF0F7]'
                                                    }`}
                                            >
                                                {tab.label}
                                                {count > 0 && (
                                                    <span className={`min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-black ${isActive
                                                        ? 'bg-white/25 text-white'
                                                        : 'bg-white/5 text-[#5A6882]'
                                                        }`}>
                                                        {count}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-2 min-h-[360px]">
                                <DataTable
                                    columns={COLUMNS}
                                    data={filteredApps}
                                    loading={loading}
                                    onRowClick={(row) => router.push(`/dashboard/recruitment/${row.id}`)}
                                />
                            </div>
                        </section>

                        {/* Activity Feed */}
                        <section className="bg-[#1B253B] border border-[#8B99B0]/12 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#5B6CF0]/10 border border-[#5B6CF0]/20 flex items-center justify-center text-[#7C8FFF]">
                                        <Activity size={16} />
                                    </div>
                                    <h3 className="text-sm font-display font-semibold text-[#ECF0F7]">Hoạt động gần đây</h3>
                                </div>
                                <button className="text-[10px] text-[#5A6882] font-bold uppercase tracking-widest hover:text-[#7C8FFF] transition-colors flex items-center gap-1">
                                    Xem tất cả <ChevronRight size={12} />
                                </button>
                            </div>

                            <div className="space-y-0">
                                {activities.length === 0 ? (
                                    <p className="text-xs text-[#5A6882] text-center py-4">Chưa có hoạt động nào</p>
                                ) : activities.map((act, i) => {
                                    const { icon: Icon, color } = activityMeta(act.type);
                                    const timeAgo = formatDistanceToNow(new Date(act.createdAt), { addSuffix: true, locale: vi });
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + i * 0.1 }}
                                            className="flex items-start gap-4 py-3 group relative"
                                        >
                                            {i < activities.length - 1 && (
                                                <div className="absolute left-[15px] top-[40px] w-px h-[calc(100%-16px)] bg-white/5" />
                                            )}
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative z-10"
                                                style={{ backgroundColor: `${color}12` }}>
                                                <Icon size={14} style={{ color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[#ECF0F7] group-hover:text-[#7C8FFF] transition-colors">{act.text}</p>
                                                <p className="text-xs text-[#5A6882] truncate">{act.sub}</p>
                                            </div>
                                            <span className="text-[10px] text-[#5A6882] whitespace-nowrap font-mono shrink-0">{timeAgo}</span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    {/* ─── RIGHT: Sidebar ─── */}
                    <aside className="lg:col-span-4 space-y-6">
                        {/* Recruitment Funnel */}
                        <div className="bg-[#1B253B] border border-[#8B99B0]/12 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#36DDAB]/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-[#36DDAB]/10 transition-all" />

                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#121A2E] to-[#1B253B] border border-white/5 flex items-center justify-center text-[#36DDAB]">
                                        <Target size={16} />
                                    </div>
                                    <h3 className="text-base font-display font-semibold text-[#ECF0F7]">Stage Funnel</h3>
                                </div>
                                <div className="px-2.5 py-1 rounded-lg bg-[#121A2E] border border-white/5 text-[9px] font-bold text-[#5A6882] uppercase tracking-widest">
                                    Q2 2026
                                </div>
                            </div>

                            <StageFunnel stages={stats?.funnel ?? []} />

                            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                                <p className="text-[10px] text-[#5A6882]">New → Offer Conversion</p>
                                {conversionRate != null ? (
                                    <div className="flex items-center gap-1 text-[#36DDAB] text-xs font-bold">
                                        <TrendingUp size={10} />
                                        <span>{conversionRate}%</span>
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-[#5A6882]">—</span>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats Mini Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#1B253B] border border-[#8B99B0]/12 rounded-xl p-4 text-center">
                                <p className="text-2xl font-display font-light text-[#7C8FFF]">{stats?.avgAiScore ?? 0}</p>
                                <p className="text-[9px] font-bold text-[#5A6882] uppercase tracking-widest mt-1">Avg AI Score</p>
                            </div>
                            <div className="bg-[#1B253B] border border-[#8B99B0]/12 rounded-xl p-4 text-center">
                                <p className="text-2xl font-display font-light text-[#36DDAB]">{stats?.offerAcceptanceRate ?? 0}%</p>
                                <p className="text-[9px] font-bold text-[#5A6882] uppercase tracking-widest mt-1">Offer Accept</p>
                            </div>
                        </div>

                        {/* Create JD Banner */}
                        <div className="bg-[#1B253B] border border-white/5 rounded-2xl p-6 text-white relative overflow-hidden shadow-2xl group cursor-pointer">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#5B6CF0] to-[#7C8FFF] opacity-90 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 10px 10px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />

                            <div className="relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                                    <UserPlus className="w-5 h-5 text-white" />
                                </div>
                                <h4 className="text-lg font-display font-semibold tracking-tight">Tạo JD Mới</h4>
                                <p className="text-white/70 text-xs mt-1 mb-5 leading-relaxed">Sử dụng AI để tối ưu hóa mô tả công việc.</p>
                                <button className="bg-white text-[#5B6CF0] text-sm font-bold py-3 px-6 rounded-xl w-full shadow-xl transition-all hover:bg-white/95 active:scale-[0.98] flex items-center justify-center gap-2 group/btn">
                                    Bắt đầu ngay
                                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
        </div>
    );
}
