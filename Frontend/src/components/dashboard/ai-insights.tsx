"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion-wrapper";
import { Sparkles, AlertCircle, TrendingDown, Brain, Play, Loader2, CheckCircle2, ChevronDown, Activity } from "lucide-react";
import { toast } from "sonner";
import type { DashboardStats, DashboardTest, PendingAiResult } from "@/app/dashboard/types";


interface AiInsight {
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    count: number;
    description: string;
    type: "info" | "warning" | "alert";
}

const typeColors = {
    info: { accent: "#B48EFF", bg: "bg-[#B48EFF]/5", border: "border-[#B48EFF]/15" },
    warning: { accent: "#FFB86C", bg: "bg-[#FFB86C]/5", border: "border-[#FFB86C]/15" },
    alert: { accent: "#FF6B82", bg: "bg-[#FF6B82]/5", border: "border-[#FF6B82]/15" },
};

function buildInsights(stats: DashboardStats, tests: DashboardTest[]): AiInsight[] {
    const insights: AiInsight[] = [];
    if (stats.pendingAiReview > 0) {
        insights.push({ icon: Brain, count: stats.pendingAiReview, description: "candidates still need AI analysis review.", type: "info" });
    }
    if (stats.pendingReview > 0) {
        insights.push({ icon: AlertCircle, count: stats.pendingReview, description: "candidates awaiting pass/fail decision.", type: "warning" });
    }
    tests.forEach((t) => {
        if (t.resultCount >= 3 && t.failCount / t.resultCount > 0.7) {
            insights.push({
                icon: TrendingDown, count: Math.round((t.failCount / t.resultCount) * 100),
                description: `% fail rate on "${t.title || t.job_role}" — consider adjusting difficulty.`, type: "alert",
            });
        }
    });
    return insights.slice(0, 4);
}

interface Props {
    stats: DashboardStats;
    tests: DashboardTest[];
    pendingAiResults: PendingAiResult[];
}

export default function AiInsights({ stats, tests, pendingAiResults }: Props) {
    const insights = buildInsights(stats, tests);
    const [isRunning, setIsRunning] = useState(false);
    const [completed, setCompleted] = useState(0);
    const [completedNames, setCompletedNames] = useState<string[]>([]);
    const [showCompleted, setShowCompleted] = useState(false);

    if (insights.length === 0) return null;

    const total = pendingAiResults.length;
    const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    async function runAiAnalysis() {
        if (total === 0) return;
        setIsRunning(true);
        setCompleted(0);
        setCompletedNames([]);
        let ok = 0, fail = 0;

        for (const item of pendingAiResults) {
            try {
                const res = await fetch("/api/ai/analyze-result", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ result_id: item.id }),
                });
                if (res.ok) { ok++; setCompletedNames((prev) => [...prev, item.name]); }
                else fail++;
            } catch { fail++; }
            setCompleted((p) => p + 1);
        }

        setIsRunning(false);
        if (fail === 0) toast.success(`AI analysis completed for ${ok} candidate${ok > 1 ? "s" : ""}`);
        else toast.warning(`Completed ${ok}, failed ${fail}`);
    }
    return (
        <FadeIn delay={0.3} className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 px-1">
                <div className="p-2 rounded-xl bg-[#B48EFF]/10 border border-[#B48EFF]/20">
                    <Sparkles className="w-5 h-5 text-[#B48EFF]" />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B99B0]">AI Insights</h2>
            </div>

            {/* Self-contained card */}
            <Card className="bg-[#111827]/90 border-[#8B99B0]/15 rounded-[2.5rem] overflow-hidden group flex-1 flex flex-col relative shadow-2xl">
                {/* Inner Highlight Border */}
                <div className="absolute inset-px rounded-[2.5rem] border border-white/5 pointer-events-none" />

                <CardContent className="p-7 flex flex-col gap-6 flex-1 relative z-10">
                    {/* Action button */}
                    {total > 0 && (
                        <div className="relative group/btn">
                            <div className="absolute inset-0 bg-[#36DDAB]/20 blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 rounded-2xl" />
                            <Button
                                size="sm"
                                onClick={runAiAnalysis}
                                disabled={isRunning}
                                className="w-full h-12 bg-[#36DDAB]/10 hover:bg-[#36DDAB]/20 text-[#36DDAB] border border-[#36DDAB]/20 rounded-2xl font-black text-[11px] uppercase tracking-widest cursor-pointer gap-2.5 transition-all duration-300 relative z-10 shadow-lg"
                            >
                                {isRunning ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /><span className="animate-pulse">Processing {completed}/{total}</span></>
                                ) : (
                                    <><Play className="w-4 h-4" />Run All AI Insights</>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Green progress bar — inside card */}
                    {isRunning && (
                        <div className="px-1">
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPct}%` }}
                                    className="h-full bg-gradient-to-r from-[#36DDAB]/40 to-[#36DDAB] rounded-full shadow-[0_0_15px_rgba(54,221,171,0.5)]"
                                />
                            </div>
                            <div className="flex justify-between items-center mt-2 px-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#5A6882]">Protocol Progress</p>
                                <p className="text-[9px] font-black text-[#36DDAB]">{progressPct}%</p>
                            </div>
                        </div>
                    )}

                    {/* Insight cards */}
                    <div className="flex flex-col gap-3 flex-1 overflow-y-auto scrollbar-none pr-0.5">
                        {insights.map((insight, i) => {
                            const colors = typeColors[insight.type];
                            const Icon = insight.icon;
                            return (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    key={i}
                                    className={`${colors.bg} ${colors.border} border rounded-[1.5rem] p-5 flex flex-col justify-center group/item hover:bg-white/[0.03] transition-all duration-500 relative`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-xl bg-black/20 border border-white/5 shadow-inner">
                                            <Icon className="w-4 h-4" style={{ color: colors.accent }} />
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black font-display leading-none tracking-tighter" style={{ color: colors.accent }}>
                                                {insight.count}
                                            </span>
                                            {insight.type === "alert" && <span className="text-[10px] font-black text-[#5A6882] uppercase">%</span>}
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-bold text-[#8B99B0] leading-snug group-hover/item:text-[#ECF0F7] transition-colors pr-2">
                                        {insight.description}
                                    </p>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-20 transition-opacity">
                                        <Icon className="w-12 h-12" style={{ color: colors.accent }} />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Completed Insights dropdown */}
                    {completedNames.length > 0 && !isRunning && (
                        <div className="pt-2">
                            <button
                                onClick={() => setShowCompleted(!showCompleted)}
                                className="flex items-center justify-between w-full group/drop cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] p-3 rounded-xl border border-white/5 transition-colors"
                            >
                                <span className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="w-3 h-3 text-[var(--semantic-success, #36DDAB)]" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#8B99B0] group-hover/drop:text-emerald-400 transition-colors">
                                        Analyzed ({completedNames.length})
                                    </span>
                                </span>
                                <ChevronDown className={`w-4 h-4 text-[#5A6882] transition-transform duration-500 ${showCompleted ? "rotate-180" : ""}`} />
                            </button>

                            <AnimatePresence>
                                {showCompleted && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-2 space-y-2 overflow-hidden"
                                    >
                                        <div className="max-h-[120px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                                            {completedNames.map((name, i) => (
                                                <div key={i} className="flex items-center gap-3 text-[11px] font-medium text-[#8B99B0] bg-white/[0.01] border border-white/5 rounded-xl px-4 py-2.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#36DDAB] shadow-[0_0_8px_rgba(54,221,171,0.5)]" />
                                                    <span className="truncate">{name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* System Health Footer */}
                    <div className="mt-auto pt-6 border-t border-white/5 relative flex items-center gap-4">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                        <div className="p-2.5 rounded-full bg-[#36DDAB]/10 border border-[#36DDAB]/20 shrink-0">
                            <Activity className="w-5 h-5 text-[#36DDAB]" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-[#ECF0F7] font-display tracking-tight">System Nominal</p>
                            <p className="text-[10px] font-bold text-[#8B99B0] mt-0.5">All 3 AI assessment models operating correctly.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </FadeIn>
    );
}
