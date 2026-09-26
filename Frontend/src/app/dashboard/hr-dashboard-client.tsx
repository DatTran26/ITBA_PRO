"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, MoreVertical, Eye, Calendar } from "lucide-react";
import DataTable from "@/components/crm/data-table";
import ScheduleInterviewDialog from "@/components/recruitment/schedule-interview-dialog";
import BentoMetricStrip from "@/components/dashboard/bento-metric-strip";
import PerformanceTrendDonut from "@/components/dashboard/performance-trend-donut";
import RecruitmentRibbonFunnel from "@/components/dashboard/recruitment-ribbon-funnel";
import DashboardActionCenter from "@/components/dashboard/dashboard-action-center";
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

/* ───── Status Badge Colors ───── */
const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    'NEW': { bg: 'bg-[#cdf5fd] border-[#a0e9ff]', text: 'text-[#0077cc]', label: 'Mới' },
    'SCREENED': { bg: 'bg-[#e0f7fa] border-[#b2ebf2]', text: 'text-[#00798a]', label: 'Đã sàng lọc' },
    'SHORTLISTED': { bg: 'bg-[#efeafe] border-[#d1c4e9]', text: 'text-[#5b3fd1]', label: 'Tiềm năng' },
    'INTERVIEW_SCHEDULED': { bg: 'bg-[#fff3e0] border-[#ffe0b2]', text: 'text-[#a35b00]', label: 'Lên lịch PV' },
    'INTERVIEWED': { bg: 'bg-[#e5f3fa] border-[#cde9f5]', text: 'text-[#0077cc]', label: 'Đã phỏng vấn' },
    'PASSED': { bg: 'bg-[#e4f5ee] border-[#a3e4d7]', text: 'text-[#2e7d64]', label: 'Đạt yêu cầu' },
    'REJECTED': { bg: 'bg-[#fdeaea] border-[#ffcdd2]', text: 'text-[#d62929]', label: 'Không đạt' },
    'OFFERED': { bg: 'bg-[#efeafe] border-[#d1c4e9]', text: 'text-[#5b3fd1]', label: 'Đã gửi Offer' },
    'ONBOARDED': { bg: 'bg-[#e4f5ee] border-[#a3e4d7]', text: 'text-[#2e7d64]', label: 'Đã nhận việc' },
};

/* ───── AI Score Label ───── */
function getScoreLabel(score: number | null): { label: string; color: string; bg: string } {
    if (!score) return { label: "—", color: "#6b8ca0", bg: "#f5fbfe" };
    if (score >= 80) return { label: "Xuất sắc", color: "#2e7d64", bg: "#e4f5ee" };
    if (score >= 60) return { label: "Phù hợp", color: "#0077cc", bg: "#cdf5fd" };
    if (score >= 40) return { label: "Cân nhắc", color: "#a35b00", bg: "#fff3e0" };
    return { label: "Chưa đạt", color: "#d62929", bg: "#fdeaea" };
}

/* ───── Avatar Color Hash ───── */
function nameToColor(name: string): { bg: string; text: string } {
    const tones = [
        { bg: "bg-[#cdf5fd]", text: "text-[#0077cc]" },
        { bg: "bg-[#e0f7fa]", text: "text-[#00798a]" },
        { bg: "bg-[#efeafe]", text: "text-[#5b3fd1]" },
        { bg: "bg-[#e4f5ee]", text: "text-[#2e7d64]" },
        { bg: "bg-[#e5f3fa]", text: "text-[#005fa3]" },
        { bg: "bg-[#fff3e0]", text: "text-[#a35b00]" },
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return tones[Math.abs(hash) % tones.length];
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

/* ───── Columns Definition ───── */
const COLUMNS: ColumnDef<AppRow>[] = [
    {
        key: "candidateName",
        label: "Ứng viên",
        render: (v, row) => {
            const name = v as string;
            const tone = nameToColor(name);
            return (
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${tone.bg} ${tone.text} flex items-center justify-center text-xs font-bold shrink-0`}>
                        {name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <span className="font-bold text-sm text-[#264e6b] hover:text-[#0077cc] transition-colors block truncate">{name}</span>
                        <span className="text-xs font-medium text-[#6b8ca0] truncate block">{(row as AppRow).jdTitle}</span>
                    </div>
                </div>
            );
        }
    },
    { key: "jdTitle", label: "Vị trí", render: (v) => <span className="text-[#6b8ca0] text-xs font-bold">{v as string}</span> },
    {
        key: "pipelineStatus",
        label: "Trạng thái",
        render: (v: unknown) => {
            const status = v as string;
            const s = STATUS_CONFIG[status] || { bg: 'bg-[#f5fbfe] border-[#cde9f5]', text: 'text-[#6b8ca0]', label: status };
            return (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${s.bg} ${s.text}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
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
            const { label, color, bg } = getScoreLabel(score);
            return (
                <div className="flex items-center gap-2.5">
                    <div className="text-base font-extrabold tabular-nums text-[#264e6b]">
                        {score ? `${score}` : "—"}
                    </div>
                    {score && (
                        <span
                            className="text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                            style={{ color, backgroundColor: bg }}
                        >
                            {label}
                        </span>
                    )}
                </div>
            );
        }
    },
    { key: "createdAt", label: "Ngày nhận", render: (v) => <span className="text-xs font-mono text-[#6b8ca0]">{v as string}</span> },
    {
        key: "id",
        label: "Thao tác",
        className: "text-right",
        render: (_, row) => (
            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                {row.pipelineStatus === 'SHORTLISTED' && (
                    <ScheduleInterviewDialog
                        applicationId={row.id}
                        onSuccess={() => {}}
                        trigger={
                            <button className="p-1.5 rounded-lg hover:bg-[#cdf5fd] text-[#0077cc] transition-colors cursor-pointer" title="Lên lịch PV">
                                <Calendar size={14} />
                            </button>
                        }
                    />
                )}
                <button
                    onClick={() => { window.location.href = `/dashboard/recruitment/${row.id}`; }}
                    className="p-1.5 rounded-lg hover:bg-[#cdf5fd] text-[#6b8ca0] hover:text-[#0077cc] transition-colors cursor-pointer" title="Xem chi tiết"
                >
                    <Eye size={14} />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-[#cdf5fd] text-[#6b8ca0] hover:text-[#0077cc] transition-colors cursor-pointer" title="Khác">
                    <MoreVertical size={14} />
                </button>
            </div>
        )
    }
];

interface HrDashboardClientProps {
    user: HrUser;
    initialStats?: DashboardStats | null;
    initialApps?: AppRow[];
    initialActivities?: ActivityEvent[];
}

export default function HrDashboardClient({
    user,
    initialStats,
    initialApps,
    initialActivities,
}: HrDashboardClientProps) {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(initialStats ?? {
        totalCvsUploaded: 48,
        byStatus: {
            NEW: 12,
            SCREENED: 18,
            SHORTLISTED: 8,
            INTERVIEW_SCHEDULED: 5,
            PASSED: 3,
            REJECTED: 2,
        },
        avgAiScore: 84,
        passRate: 72,
        offerAcceptanceRate: 88,
        processingQueue: 4,
        funnel: [
            { stage: "NEW", count: 48 },
            { stage: "SCREENED", count: 22 },
            { stage: "INTERVIEW_SCHEDULED", count: 11 },
            { stage: "PASSED", count: 4 },
            { stage: "ONBOARDED", count: 2 },
        ],
    });

    const [apps, setApps] = useState<AppRow[]>(initialApps ?? [
        { id: "app-1", candidateName: "Nguyễn Văn An", jdTitle: "Senior Frontend Engineer", pipelineStatus: "SHORTLISTED", aiScore: 92, createdAt: "15/09/2026" },
        { id: "app-2", candidateName: "Trần Thị Mai", jdTitle: "Product Designer (UI/UX)", pipelineStatus: "SCREENED", aiScore: 88, createdAt: "16/09/2026" },
        { id: "app-3", candidateName: "Lê Hoàng Long", jdTitle: "Fullstack AI Developer", pipelineStatus: "NEW", aiScore: 78, createdAt: "17/09/2026" },
        { id: "app-4", candidateName: "Phạm Minh Đức", jdTitle: "Backend Go / Node.js", pipelineStatus: "INTERVIEW_SCHEDULED", aiScore: 85, createdAt: "14/09/2026" },
        { id: "app-5", candidateName: "Vũ Thị Hương", jdTitle: "HR Operations Lead", pipelineStatus: "PASSED", aiScore: 94, createdAt: "12/09/2026" },
        { id: "app-6", candidateName: "Đỗ Thành Đạt", jdTitle: "DevOps Engineer", pipelineStatus: "SHORTLISTED", aiScore: 89, createdAt: "16/09/2026" },
    ]);

    const [activities, setActivities] = useState<ActivityEvent[]>(initialActivities ?? [
        { type: "cv_analyzed", text: "AI đã phân tích xong CV của Nguyễn Văn An (92/100)", sub: "Khớp 95% kỹ năng React, Next.js, Tailwind", createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
        { type: "interview_scheduled", text: "Lên lịch phỏng vấn kỹ thuật cho Phạm Minh Đức", sub: "14:00 - 15:00 ngày mai với Tech Lead", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
        { type: "status_changed", text: "Trần Thị Mai đã được chuyển sang vòng Sàng Lọc", sub: "Điểm AI vượt ngưỡng yêu cầu tối thiểu", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() },
    ]);

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchData = useCallback(async () => {
        try {
            const [statsRes, appsRes, activityRes] = await Promise.all([
                fetch("/api/recruitment/dashboard"),
                fetch("/api/recruitment/applications?pageSize=20"),
                fetch("/api/recruitment/activities"),
            ]);

            if (statsRes.ok) {
                const s = await statsRes.json();
                if (s.data) setStats(s.data);
            }
            if (appsRes.ok) {
                const a = await appsRes.json();
                if (a.data?.length) setApps(a.data);
            }
            if (activityRes?.ok) {
                const act = await activityRes.json();
                if (act.data?.length) setActivities(act.data);
            }
        } catch {
            // Graceful fallback
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

    return (
        <div className="pb-12 space-y-6">
            {/* ═══ TIER 1: BENTO METRIC STRIP (6 CARDS) ═══ */}
            <BentoMetricStrip stats={stats} loading={loading} />

            {/* ═══ TIER 2: BENTO 3-COLUMN VISUAL CENTER ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Column 1: Performance & Trend (Donut + Area Chart) */}
                <PerformanceTrendDonut
                    passed={stats?.byStatus?.['PASSED'] ?? 0}
                    failed={stats?.byStatus?.['REJECTED'] ?? 0}
                    inProgress={
                        (stats?.byStatus?.['NEW'] ?? 0) +
                        (stats?.byStatus?.['SCREENED'] ?? 0) +
                        (stats?.byStatus?.['SHORTLISTED'] ?? 0) +
                        (stats?.byStatus?.['INTERVIEW_SCHEDULED'] ?? 0) +
                        (stats?.byStatus?.['INTERVIEWED'] ?? 0)
                    }
                    monthlyData={[]}
                />

                {/* Column 2: Recruitment Pipeline Ribbon (Chevron + 2x2 Sparklines) */}
                <RecruitmentRibbonFunnel
                    funnel={stats?.funnel ?? []}
                    avgAiScore={stats?.avgAiScore ?? 0}
                    offerAcceptanceRate={stats?.offerAcceptanceRate ?? 0}
                    processingQueue={stats?.processingQueue ?? 0}
                    interviewsCount={stats?.byStatus?.['INTERVIEW_SCHEDULED'] ?? 0}
                />

                {/* Column 3: Action Center (Urgent Tasks & Activities) */}
                <DashboardActionCenter
                    shortlistedCount={tabCounts['SHORTLISTED'] ?? 0}
                    screenedCount={tabCounts['SCREENED'] ?? 0}
                    pendingQueue={stats?.processingQueue ?? 0}
                    firstShortlistedId={apps.find(a => a.pipelineStatus === 'SHORTLISTED')?.id}
                    activities={activities}
                    onRefresh={fetchData}
                />
            </div>

            {/* ═══ TIER 3: FULL-WIDTH APPLICANT DATA TABLE ═══ */}
            <section className="bg-card border border-[#cde9f5] rounded-2xl overflow-hidden shadow-[0_2px_14px_rgba(0,169,255,0.08)]">
                {/* Toolbar */}
                <div className="px-5 py-4 border-b border-[#e5f3fa] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-lg font-extrabold text-[#264e6b] tracking-tight">Hồ Sơ Ứng Tuyển</h2>
                            <span className="text-xs font-bold text-[#0077cc] bg-[#cdf5fd] border border-[#a0e9ff] px-2.5 py-0.5 rounded-full">
                                {filteredApps.length} hồ sơ
                            </span>
                        </div>
                        <p className="text-xs font-medium text-[#6b8ca0] mt-0.5">Danh sách ứng viên & kết quả đánh giá năng lực AI</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Tab segmented filters */}
                        <div className="flex items-center gap-1.5 p-1 bg-[#f5fbfe] rounded-xl border border-[#cde9f5] overflow-x-auto">
                            {TABLE_TABS.map((tab) => {
                                const count = tabCounts[tab.key] ?? 0;
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                                            isActive
                                                ? 'bg-gradient-to-r from-[#00a9ff] to-[#0077cc] text-white shadow-[0_3px_10px_rgba(0,119,204,0.25)] font-bold'
                                                : 'text-[#6b8ca0] hover:text-[#264e6b] hover:bg-[#cdf5fd]/50 font-bold'
                                        }`}
                                    >
                                        {tab.label}
                                        {count > 0 && (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono ${
                                                isActive ? 'bg-white/25 text-white' : 'bg-[#e5f3fa] text-[#0077cc]'
                                            }`}>
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search Input */}
                        <div className="relative shrink-0">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0077cc] pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Tìm ứng viên, vị trí..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-[#f5fbfe] border border-[#cde9f5] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#264e6b] placeholder:text-[#8ba9bd] outline-none w-44 focus:w-60 transition-all duration-200 focus:border-[#0077cc] focus:ring-2 focus:ring-[#00a9ff]/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Table View */}
                <div className="p-3 min-h-[380px]">
                    <DataTable
                        columns={COLUMNS}
                        data={filteredApps}
                        loading={loading}
                        rowClassName={() => "hover:bg-[#f0faff]/60 transition-colors"}
                        onRowClick={(row) => router.push(`/dashboard/recruitment/${row.id}`)}
                    />
                </div>
            </section>
        </div>
    );
}
