"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Calendar, Clock, CheckCircle2, AlertTriangle, ArrowRight,
    User, Briefcase, CalendarClock, ChevronRight, ClipboardList,
    BarChart3, Video, Zap, Users,
} from "lucide-react";
import { motion } from "framer-motion";
type SubTab = "interviews" | "open-slots" | "candidates";

interface InterviewItem {
    id: string;
    scheduled_at: string;
    timezone: string;
    status: "scheduled" | "completed" | "cancelled";
    interviewer_status: "pending" | "accepted" | "declined" | "reschedule_requested";
    interviewer_id: string | null;
    job_applications: {
        id: string;
        persons: { full_name: string; email: string } | null;
        job_descriptions: { title: string; department: string | null } | null;
    } | null;
    interview_results: Array<{ id: string; result: string }>;
}

interface Props {
    user: { name: string; email: string; role: string };
}

function formatDateTime(iso: string, tz: string) {
    try {
        return new Intl.DateTimeFormat("vi-VN", {
            dateStyle: "short", timeStyle: "short", timeZone: tz,
        }).format(new Date(iso));
    } catch {
        return new Date(iso).toLocaleString("vi-VN");
    }
}

function getRelativeTime(iso: string) {
    const diff = new Date(iso).getTime() - Date.now();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 1) return `${days} ngày nữa`;
    if (hours > 0) return `${hours}h nữa`;
    return "Sắp diễn ra";
}

const QUICK_ACTIONS = [
    { href: "/dashboard/interview-room", icon: Calendar, label: "Lịch phỏng vấn", desc: "Xem & xác nhận lịch", color: "#7C8FFF", glow: "rgba(124,143,255,0.15)" },
    { href: "/dashboard/recruitment", icon: ClipboardList, label: "Danh sách ứng viên", desc: "Xem hồ sơ ứng viên", color: "#B48EFF", glow: "rgba(180,142,255,0.15)" },
    { href: "/dashboard/recruitment/sessions", icon: CalendarClock, label: "Sessions PV", desc: "Quản lý buổi phỏng vấn", color: "#22C55E", glow: "rgba(34,197,94,0.15)" },
    { href: "/dashboard/recruitment/dashboard", icon: BarChart3, label: "Báo cáo", desc: "Tổng quan tuyển dụng", color: "#F59E0B", glow: "rgba(245,158,11,0.15)" },
];

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const SUB_TABS = [
    { id: "interviews"  as SubTab, label: "My Interviews", icon: Calendar },
    { id: "open-slots"  as SubTab, label: "Open Slots",    icon: Zap },
    { id: "candidates"  as SubTab, label: "Candidates",    icon: ClipboardList },
];

export default function InterviewerDashboardClient({ user }: Props) {
    const [interviews, setInterviews] = useState<InterviewItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState<string | null>(null);
    const [subTab, setSubTab] = useState<SubTab>("interviews");

    const fetchInterviews = useCallback(async () => {
        try {
            const res = await fetch("/api/recruitment/interviews");
            const data = await res.json();
            if (res.ok) setInterviews(data.interviews ?? []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchInterviews(); }, [fetchInterviews]);

    async function handleClaim(scheduleId: string) {
        setClaiming(scheduleId);
        try {
            const res = await fetch(`/api/recruitment/interviews/${scheduleId}/respond`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "accept" }),
            });
            if (res.ok) await fetchInterviews();
        } finally { setClaiming(null); }
    }

    const now = new Date();
    const pending = interviews.filter((i) => i.interviewer_status === "pending" && i.interviewer_id);
    const openSlots = interviews.filter((i) => !i.interviewer_id && i.status === "scheduled");
    const upcoming = interviews
        .filter((i) => i.status === "scheduled" && i.interviewer_status === "accepted" && new Date(i.scheduled_at) > now)
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    const completedThisMonth = interviews.filter((i) => {
        const d = new Date(i.scheduled_at);
        return i.status === "completed" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const stats = [
        { label: "Sắp tới", value: upcoming.length, icon: Calendar, color: "#7C8FFF", bg: "from-[#7C8FFF]/10 to-transparent" },
        { label: "Hoàn thành", value: completedThisMonth.length, icon: CheckCircle2, color: "#22C55E", bg: "from-[#22C55E]/10 to-transparent" },
        { label: "Chờ xác nhận", value: pending.length, icon: Clock, color: "#F59E0B", bg: "from-[#F59E0B]/10 to-transparent" },
        { label: "Slot trống", value: openSlots.length, icon: Zap, color: "#60A5FA", bg: "from-[#60A5FA]/10 to-transparent" },
    ];

    return (
        <div className="space-y-5 pb-8">

                {/* Hero header */}
                <motion.div
                    variants={fadeUp} initial="hidden" animate="show"
                    className="relative rounded-3xl overflow-hidden border border-white/8 shadow-[0_32px_80px_-30px_rgba(0,0,0,0.95)]"
                >
                    {/* Background layers */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#131B35] via-[#0F1629] to-[#0A0F1D]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_80%_-20%,rgba(124,143,255,0.22),transparent)]" />
                    <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#5B6CF0]/8 blur-3xl" />

                    <div className="relative p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-widest bg-[#7C8FFF]/15 text-[#B6C2FF] border border-[#7C8FFF]/25 mb-4 uppercase">
                                    <User size={11} />
                                    Interviewer
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#ECF0F7] to-[#8B99B0] bg-clip-text text-transparent">
                                    Xin chào, {user.name}
                                </h1>
                                <p className="text-sm text-[#4A6080] mt-2">
                                    Tổng quan lịch phỏng vấn của bạn
                                </p>
                            </div>
                            <Link
                                href="/dashboard/interview-room"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B6CF0] to-[#4B5DE4] hover:brightness-110 text-white text-sm font-semibold shadow-lg shadow-[#5B6CF0]/25 transition-all active:scale-[0.98] shrink-0"
                            >
                                <Calendar size={14} />
                                Xem lịch phỏng vấn
                                <ArrowRight size={14} />
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {stats.map(({ label, value, icon: Icon, color, bg }, i) => (
                                <motion.div
                                    key={label}
                                    variants={fadeUp}
                                    initial="hidden"
                                    animate="show"
                                    transition={{ delay: i * 0.06 }}
                                    className={`relative rounded-2xl border border-white/8 bg-gradient-to-b ${bg} p-4 overflow-hidden`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[11px] text-[#5A6882] font-medium tracking-wide">{label}</p>
                                        <Icon size={14} style={{ color }} className="opacity-80" />
                                    </div>
                                    <p className="text-2xl font-bold" style={{ color }}>{loading ? "—" : value}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Sub-tab navigation */}
                <div className="inline-flex items-center p-1 bg-[#111827]/90 border border-[#8B99B0]/15 rounded-[1rem] shadow-lg">
                    {SUB_TABS.map(({ id, label, icon: Icon }) => {
                        const isActive = subTab === id;
                        return (
                            <button
                                key={id}
                                onClick={() => setSubTab(id)}
                                className={`relative px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                                    isActive ? "text-[#ECF0F7]" : "text-[#5A6882] hover:text-[#8B99B0]"
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="interviewer-sub-tab"
                                        className="absolute inset-0 bg-[#3B82F6]/25 border border-[#3B82F6]/40 shadow-[inset_0_0_15px_rgba(59,130,246,0.2)]"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        style={{ borderRadius: "0.75rem" }}
                                    />
                                )}
                                <div className={`relative z-10 p-1.5 rounded-md transition-colors duration-300 ${
                                    isActive ? "bg-[#3B82F6] text-white shadow-[0_0_12px_rgba(59,130,246,0.6)]" : "bg-transparent"
                                }`}>
                                    <Icon className="w-3.5 h-3.5" />
                                </div>
                                <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.15em]">{label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Pending acceptance banner */}
                {subTab === "interviews" && pending.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                        className="relative rounded-2xl overflow-hidden border border-amber-500/20"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-amber-500/6 to-transparent" />
                        <div className="relative flex items-center gap-4 p-4">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                                <AlertTriangle size={16} className="text-amber-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-amber-300">
                                    {pending.length} lịch phỏng vấn chờ bạn xác nhận
                                </p>
                                <p className="text-xs text-amber-400/50 mt-0.5 truncate">
                                    {pending.map((p) => p.job_applications?.persons?.full_name ?? "Ứng viên").join(" • ")}
                                </p>
                            </div>
                            <Link
                                href="/dashboard/interview-room"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 border border-amber-500/30 rounded-lg px-3 py-1.5 hover:bg-amber-500/15 transition-colors shrink-0"
                            >
                                Xem ngay <ArrowRight size={13} />
                            </Link>
                        </div>
                    </motion.div>
                )}

                {/* Open slots to claim */}
                {subTab === "open-slots" && (openSlots.length > 0 ? (
                    <motion.div variants={fadeUp} initial="hidden" animate="show">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-[#4A6080] uppercase tracking-widest">Slot trống - Nhận ngay</p>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#60A5FA]/15 text-[#60A5FA] border border-[#60A5FA]/25 font-bold">{openSlots.length}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {openSlots.slice(0, 4).map((item) => (
                                <div key={item.id} className="relative rounded-2xl border border-[#60A5FA]/15 bg-gradient-to-br from-[#60A5FA]/6 to-transparent p-4 flex items-center gap-3 overflow-hidden">
                                    <div className="w-9 h-9 rounded-xl bg-[#60A5FA]/12 border border-[#60A5FA]/20 flex items-center justify-center shrink-0">
                                        <Users size={15} className="text-[#60A5FA]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#ECF0F7] truncate">
                                            {item.job_applications?.persons?.full_name ?? "—"}
                                        </p>
                                        <p className="text-xs text-[#5A6882] mt-0.5 flex items-center gap-1 truncate">
                                            <Briefcase size={10} />
                                            {item.job_applications?.job_descriptions?.title ?? "—"}
                                            <span className="mx-1 text-[#2A3A52]">•</span>
                                            <Clock size={10} className="text-[#60A5FA]" />
                                            <span className="text-[#60A5FA]">{formatDateTime(item.scheduled_at, item.timezone)}</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleClaim(item.id)}
                                        disabled={claiming === item.id}
                                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:brightness-110 disabled:opacity-50 transition-all shadow-md shadow-[#3B82F6]/20"
                                    >
                                        {claiming === item.id ? "..." : "Nháº­n"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <div className="rounded-2xl border border-white/6 bg-[#0D1526]/60 p-10 text-center">
                        <Zap size={28} className="mx-auto text-[#1E2A40] mb-3" />
                        <p className="text-sm text-[#3A4A60]">No open slots available right now.</p>
                    </div>
                ))}

                {/* Quick actions */}
                {subTab === "candidates" && <div>
                    <p className="text-xs font-bold text-[#4A6080] uppercase tracking-widest mb-3">Truy cáº­p nhanh</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, color, glow }) => (
                            <Link
                                key={href}
                                href={href}
                                className="group relative rounded-2xl border border-white/8 bg-[#0D1526]/80 p-4 flex flex-col gap-3 hover:border-white/15 transition-all overflow-hidden"
                                style={{ "--glow": glow } as React.CSSProperties}
                            >
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-[var(--glow)] to-transparent" />
                                <div className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                                    <Icon size={16} style={{ color }} />
                                </div>
                                <div className="relative">
                                    <p className="text-sm font-semibold text-[#C8D0DF] group-hover:text-white transition-colors">{label}</p>
                                    <p className="text-xs text-[#4A6080] mt-0.5">{desc}</p>
                                </div>
                                <ChevronRight size={13} className="relative text-[#2A3A52] group-hover:text-[#5A6882] group-hover:translate-x-0.5 transition-all mt-auto self-end" />
                            </Link>
                        ))}
                    </div>
                </div>}

                {/* Upcoming interviews */}
                {subTab === "interviews" && <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-[#4A6080] uppercase tracking-widest">Lá»‹ch sáº¯p tá»›i</p>
                        {upcoming.length > 0 && (
                            <Link href="/dashboard/interview-room" className="text-xs text-[#7C8FFF] hover:text-[#B6C2FF] inline-flex items-center gap-1 transition-colors">
                                Xem táº¥t cáº£ <ArrowRight size={11} />
                            </Link>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-5 h-5 border-2 border-[#7C8FFF]/30 border-t-[#7C8FFF] rounded-full animate-spin" />
                        </div>
                    ) : upcoming.length === 0 ? (
                        <div className="rounded-2xl border border-white/6 bg-[#0D1526]/60 p-10 text-center">
                            <CalendarClock size={28} className="mx-auto text-[#1E2A40] mb-3" />
                            <p className="text-sm text-[#3A4A60]">Không có lịch phỏng vấn nào sắp tới.</p>
                        </div>
                    ) : (
                        <motion.div
                            initial="hidden" animate="show"
                            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                            className="space-y-2"
                        >
                            {upcoming.slice(0, 5).map((item) => (
                                <motion.div
                                    key={item.id}
                                    variants={fadeUp}
                                    className="group rounded-2xl border border-white/7 bg-[#0D1526]/80 hover:bg-[#111D35]/90 hover:border-white/12 p-4 flex items-center gap-4 transition-all"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C8FFF]/15 to-[#5B6CF0]/8 border border-[#7C8FFF]/20 flex items-center justify-center shrink-0">
                                        <User size={16} className="text-[#7C8FFF]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#D0D8E8] truncate">
                                            {item.job_applications?.persons?.full_name ?? "—"}
                                        </p>
                                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                            <span className="text-xs text-[#4A6080] flex items-center gap-1 truncate">
                                                <Briefcase size={10} />
                                                {item.job_applications?.job_descriptions?.title ?? "—"}
                                            </span>
                                            <span className="text-xs text-[#7C8FFF] flex items-center gap-1 shrink-0">
                                                <Clock size={10} />
                                                {formatDateTime(item.scheduled_at, item.timezone)}
                                            </span>
                                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 shrink-0">
                                                {getRelativeTime(item.scheduled_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/dashboard/recruitment/${item.job_applications?.id}`}
                                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs text-[#4A6080] border border-white/8 hover:text-[#ECF0F7] hover:border-[#7C8FFF]/30 hover:bg-[#7C8FFF]/8 transition-all"
                                    >
                                        Há»“ sÆ¡
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>}
        </div>
    );
}
