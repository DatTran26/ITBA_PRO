"use client";

import { motion } from "framer-motion";
import { Users, CheckCircle, XCircle, Calendar } from "lucide-react";
import type { DashboardTest } from "@/app/dashboard/types";

function MetricBox({ icon: Icon, label, value, color = "var(--muted-foreground)" }: {
    icon: any;
    label: string;
    value: number;
    color?: string;
}) {
    return (
        <div className="flex flex-col items-start justify-center p-3 rounded-2xl bg-background/40 border border-white/[0.03] hover:bg-background/70 hover:border-border transition-all duration-300">
            <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3 h-3" style={{ color }} />
                <span className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">{label}</span>
            </div>
            <span className="text-base font-black text-foreground">{value}</span>
        </div>
    );
}

// Metrics + footer block of the assessment card (circular pass-rate, reach/success/reject,
// assessment index, question count, created date). Split out of assessment-card.tsx.
export default function AssessmentCardMetrics({ test }: { test: DashboardTest }) {
    const scorePercent = test.avgScore !== null ? Math.round(test.avgScore) : null;
    const passRate = test.resultCount > 0 ? Math.round((test.passCount / test.resultCount) * 100) : 0;

    return (
        <div className="px-7 pb-7 relative z-20">
            <div className="flex items-center gap-6 mb-7">
                {/* Circular Performance Indicator */}
                <div className="relative w-16 h-16 shrink-0 group-hover:scale-110 transition-transform duration-700">
                     <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-foreground/[0.05]"
                        />
                        <motion.circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray="175.9"
                            initial={{ strokeDashoffset: 175.9 }}
                            animate={{ strokeDashoffset: 175.9 - (175.9 * passRate) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                            className={passRate > 70 ? "text-emerald-400" : "text-primary"}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs font-black text-foreground leading-none">{passRate}%</span>
                        <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-tighter">Rate</span>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-3 gap-2">
                    <MetricBox icon={Users} label="Reach" value={test.resultCount} color="var(--primary)" />
                    <MetricBox icon={CheckCircle} label="Success" value={test.passCount} color="var(--success)" />
                    <MetricBox icon={XCircle} label="Reject" value={test.failCount} color="var(--danger)" />
                </div>
            </div>

            {/* Footer - Elegant Divider and Meta Info */}
            <div className="flex items-center justify-between pt-5 border-t border-white/[0.03]">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.1em]">Assessment Index</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${scorePercent !== null ? "text-foreground" : "text-muted-foreground/40"}`}>
                                {scorePercent !== null ? `${scorePercent}.0` : "PENDING"}
                            </span>
                            {scorePercent !== null && (
                                <div className="flex gap-0.5">
                                    {[1,2,3,4,5].map(s => (
                                        <div key={s} className={`w-1 h-3 rounded-full ${s <= (scorePercent / 20) ? "bg-primary" : "bg-muted"}`} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.1em]">Total Questions</span>
                        <span className="text-sm font-bold text-warning">{test.question_count} <span className="text-[10px] text-muted-foreground">QUESTIONS</span></span>
                    </div>
                </div>

                <div className="group/date flex items-center gap-2 text-[10px] text-muted-foreground font-bold bg-white/[0.02] px-3 py-1.5 rounded-xl border border-white/[0.05] hover:bg-primary/5 hover:border-primary/20 transition-all">
                    <Calendar className="w-3 h-3 group-hover/date:text-primary transition-colors" />
                    <span className="group-hover/date:text-foreground transition-colors">{new Date(test.created_at).toLocaleDateString("en-GB")}</span>
                </div>
            </div>
        </div>
    );
}
