"use client";
import { alpha } from "@/lib/utils";

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
    { href: "/dashboard/interview-room", icon: Calendar, label: "Lịch phỏng vấn", desc: "Xem & xác nhận lịch", color: "var(--primary)", glow: "color-mix(in srgb, var(--primary) 15%, transparent)" },
    { href: "/dashboard/recruitment", icon: ClipboardList, label: "Danh sách ứng viên", desc: "Xem hồ sơ ứng viên", color: "var(--ai)", glow: "color-mix(in srgb, var(--ai) 15%, transparent)" },
    { href: "/dashboard/recruitment/sessions", icon: CalendarClock, label: "Sessions PV", desc: "Quản lý buổi phỏng vấn", color: "var(--success)", glow: "color-mix(in srgb, var(--success) 15%, transparent)" },
    { href: "/dashboard/recruitment/dashboard", icon: BarChart3, label: "Báo cáo", desc: "Tổng quan tuyển dụng", color: "var(--warning)", glow: "color-mix(in srgb, var(--warning) 15%, transparent)" },
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
        { label: "Sắp tới", value: upcoming.length, icon: Calendar, color: "var(--primary)", bg: "from-primary/10 to-transparent" },
        { label: "Hoàn thành", value: completedThisMonth.length, icon: CheckCircle2, color: "var(--success)", bg: "from-success/10 to-transparent" },
        { label: "Chờ xác nhận", value: pending.length, icon: Clock, color: "var(--warning)", bg: "from-warning/10 to-transparent" },
        { label: "Slot trống", value: openSlots.length, icon: Zap, color: "var(--primary)", bg: "from-primary/10 to-transparent" },
    ];

    return (
        <div className="space-y-5 pb-8">

                {/* Hero header */}
                <motion.div
                    variants={fadeUp} initial="hidden" animate="show"
                    className="relative rounded-3xl overflow-hidden border border-border shadow-[0_32px_80px_-30px_rgba(0,0,0,0.95)]"
                >
                    {/* Background layers */}
                    <div className="absolute inset-0 bg-gradient-to-br from-card via-background to-background" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_80%_-20%,color-mix(in_srgb,var(--primary)_22%,transparent),transparent)]" />
                    <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />

                    <div className="relative p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-widest bg-primary/15 text-primary border border-border/25 mb-4 uppercase">
                                    <User size={11} />
                                    Interviewer
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                                    Xin chào, {user.name}
                                </h1>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Tổng quan lịch phỏng vấn của bạn
                                </p>
                            </div>
                            <Link
                                href="/dashboard/interview-room"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary hover:brightness-110 text-white text-sm font-semibold shadow-lg shadow-primary/25 transition-all active:scale-[0.98] shrink-0"
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
                                    className={`relative rounded-2xl border border-border bg-gradient-to-b ${bg} p-4 overflow-hidden`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[11px] text-muted-foreground font-medium tracking-wide">{label}</p>
                                        <Icon size={14} style={{ color }} className="opacity-80" />
                                    </div>
                                    <p className="text-2xl font-bold" style={{ color }}>{loading ? "—" : value}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Sub-tab navigation */}
                <div className="inline-flex items-center p-1 bg-card/90 border border-border/15 rounded-[1rem] shadow-lg">
                    {SUB_TABS.map(({ id, label, icon: Icon }) => {
                        const isActive = subTab === id;
                        return (
                            <button
                                key={id}
                                onClick={() => setSubTab(id)}
                                className={`relative px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                                    isActive ? "text-foreground" : "text-muted-foreground hover:text-muted-foreground"
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="interviewer-sub-tab"
                                        className="absolute inset-0 bg-primary/25 border border-border/40 shadow-[inset_0_0_15px_color-mix(in_srgb,var(--primary)_20%,transparent)]"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        style={{ borderRadius: "0.75rem" }}
                                    />
                                )}
                                <div className={`relative z-10 p-1.5 rounded-md transition-colors duration-300 ${
                                    isActive ? "bg-primary text-white shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_60%,transparent)]" : "bg-transparent"
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
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Slot trống - Nhận ngay</p>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-border/25 font-bold">{openSlots.length}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {openSlots.slice(0, 4).map((item) => (
                                <div key={item.id} className="relative rounded-2xl border border-border/15 bg-gradient-to-br from-primary/6 to-transparent p-4 flex items-center gap-3 overflow-hidden">
                                    <div className="w-9 h-9 rounded-xl bg-primary/12 border border-border/20 flex items-center justify-center shrink-0">
                                        <Users size={15} className="text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">
                                            {item.job_applications?.persons?.full_name ?? "—"}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                                            <Briefcase size={10} />
                                            {item.job_applications?.job_descriptions?.title ?? "—"}
                                            <span className="mx-1 text-primary">•</span>
                                            <Clock size={10} className="text-primary" />
                                            <span className="text-primary">{formatDateTime(item.scheduled_at, item.timezone)}</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleClaim(item.id)}
                                        disabled={claiming === item.id}
                                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-primary to-primary hover:brightness-110 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
                                    >
                                        {claiming === item.id ? "..." : "Nháº­n"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <div className="rounded-2xl border border-border bg-background/60 p-10 text-center">
                        <Zap size={28} className="mx-auto text-muted mb-3" />
                        <p className="text-sm text-muted-foreground">No open slots available right now.</p>
                    </div>
                ))}

                {/* Quick actions */}
                {subTab === "candidates" && <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Truy cáº­p nhanh</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, color, glow }) => (
                            <Link
                                key={href}
                                href={href}
                                className="group relative rounded-2xl border border-border bg-background/80 p-4 flex flex-col gap-3 hover:border-border transition-all overflow-hidden"
                                style={{ "--glow": glow } as React.CSSProperties}
                            >
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-[var(--glow)] to-transparent" />
                                <div className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${alpha(color, 8)}`, border: `1px solid ${alpha(color, 15)}` }}>
                                    <Icon size={16} style={{ color }} />
                                </div>
                                <div className="relative">
                                    <p className="text-sm font-semibold text-foreground group-hover:text-foreground transition-colors">{label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                                </div>
                                <ChevronRight size={13} className="relative text-primary group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all mt-auto self-end" />
                            </Link>
                        ))}
                    </div>
                </div>}

                {/* Upcoming interviews */}
                {subTab === "interviews" && <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Lá»‹ch sáº¯p tá»›i</p>
                        {upcoming.length > 0 && (
                            <Link href="/dashboard/interview-room" className="text-xs text-primary hover:text-primary inline-flex items-center gap-1 transition-colors">
                                Xem táº¥t cáº£ <ArrowRight size={11} />
                            </Link>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-5 h-5 border-2 border-border/30 border-t-border rounded-full animate-spin" />
                        </div>
                    ) : upcoming.length === 0 ? (
                        <div className="rounded-2xl border border-border bg-background/60 p-10 text-center">
                            <CalendarClock size={28} className="mx-auto text-muted mb-3" />
                            <p className="text-sm text-muted-foreground">Không có lịch phỏng vấn nào sắp tới.</p>
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
                                    className="group rounded-2xl border border-border bg-background/80 hover:bg-card/90 hover:border-border p-4 flex items-center gap-4 transition-all"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/8 border border-border/20 flex items-center justify-center shrink-0">
                                        <User size={16} className="text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-primary truncate">
                                            {item.job_applications?.persons?.full_name ?? "—"}
                                        </p>
                                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                                <Briefcase size={10} />
                                                {item.job_applications?.job_descriptions?.title ?? "—"}
                                            </span>
                                            <span className="text-xs text-primary flex items-center gap-1 shrink-0">
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
                                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs text-muted-foreground border border-border hover:text-foreground hover:border-border/30 hover:bg-primary/8 transition-all"
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
