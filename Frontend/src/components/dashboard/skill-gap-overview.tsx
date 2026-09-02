import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/ui/motion-wrapper";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import type { SkillGapItem } from "@/app/dashboard/types";

export default function SkillGapOverview({ gaps }: { gaps: SkillGapItem[] }) {
    const sorted = [...gaps].sort((a, b) => b.gapSize - a.gapSize).slice(0, 10);

    return (
        <FadeIn delay={0.25} className="h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6 px-1">
                <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B99B0]">
                    Skill Gap Analysis
                </h2>
            </div>

            <Card className="bg-[#111827]/90 border-[#8B99B0]/15 rounded-[2.5rem] overflow-hidden group flex-1 flex flex-col relative shadow-2xl">
                {/* Inner Highlight Border */}
                <div className="absolute inset-px rounded-[2.5rem] border border-white/5 pointer-events-none" />

                <CardContent className="p-6 md:p-8 flex flex-col flex-1 relative z-10">
                    {sorted.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-white/[0.01] to-white/[0.03] border border-white/[0.02]">
                            {/* Animated Pulse Rings Background */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
                                <motion.div
                                    animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute w-32 h-32 rounded-full border border-emerald-500/20"
                                />
                                <motion.div
                                    animate={{ scale: [1, 3], opacity: [0.3, 0] }}
                                    transition={{ duration: 4, delay: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute w-32 h-32 rounded-full border border-emerald-500/10"
                                />
                            </div>

                            <div className="relative z-10 flex flex-col items-center justify-center p-8 bg-[#0F172A]/40 backdrop-blur-md border border-emerald-500/10 rounded-3xl shadow-[0_0_80px_rgba(16,185,129,0.05)]">
                                <div className="relative flex items-center justify-center w-16 h-16 mb-4">
                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                                    <div className="relative z-10 p-4 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                    </div>
                                </div>
                                <p className="text-xl font-bold font-display text-[#ECF0F7] mb-2 tracking-tight">Thresholds Met</p>
                                <p className="text-xs text-[#8B99B0] text-center max-w-[240px] leading-relaxed mb-6">
                                    No significant skill gaps detected. The workforce is operating at optimal levels.
                                </p>

                                {/* System Health Indicators */}
                                <div className="grid grid-cols-3 gap-2 w-full max-w-[340px] border-t border-white/[0.05] pt-6 relative">
                                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent pointer-events-none" />
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-[#5A6882] mb-1">Coverage</span>
                                        <span className="text-lg font-black font-display text-emerald-400">100%</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center text-center border-l border-white/[0.05]">
                                        <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-[#5A6882] mb-1">Deficits</span>
                                        <span className="text-lg font-black font-display text-[#ECF0F7]">0</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center text-center border-l border-white/[0.05]">
                                        <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-[#5A6882] mb-1">Readiness</span>
                                        <span className="text-lg font-black font-display text-emerald-400">High</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5 overflow-y-auto pr-2 scrollbar-none flex-1">
                            {sorted.map((gap, i) => {
                                const pct = gap.requiredLevel > 0 ? Math.min((gap.avgScore / gap.requiredLevel) * 100, 100) : 0;
                                const barColor = pct >= 80 ? "#36DDAB" : pct >= 50 ? "#FFB86C" : "#FF6B82";
                                const isCritical = pct < 50;

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.1, duration: 0.5 }}
                                        key={gap.skillName}
                                        className={`p-4 rounded-2xl border transition-colors duration-300 relative overflow-hidden group/gap ${
                                            isCritical ? "bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10 hover:border-rose-500/30" : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                                        }`}
                                    >
                                        {/* Highlight flare for critical gaps */}
                                        {isCritical && (
                                            <div className="absolute -inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent pointer-events-none" />
                                        )}

                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-sm font-black ${isCritical ? "text-rose-200" : "text-[#ECF0F7]"} group-hover/gap:text-white transition-colors`}>
                                                    {gap.skillName}
                                                </span>
                                                {gap.category && (
                                                    <Badge variant="outline" className={`text-[9px] uppercase tracking-wider font-bold ${
                                                        isCritical ? "text-rose-400 border-rose-500/20" : "text-[#5A6882] border-white/10"
                                                    }`}>
                                                        {gap.category}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-baseline gap-1 text-xs">
                                                <span className={`font-black tabular-nums ${isCritical ? "text-rose-400" : "text-white"}`}>
                                                    {gap.avgScore.toFixed(1)}
                                                </span>
                                                <span className="text-[#5A6882] font-medium mx-0.5">/</span>
                                                <span className="text-emerald-400 font-bold tabular-nums">{gap.requiredLevel}</span>
                                                <span className="text-[10px] text-[#5A6882] ml-1 font-bold">({gap.evaluationCount})</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-black/40 overflow-hidden relative border border-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className="h-full rounded-full transition-shadow duration-500"
                                                style={{
                                                    backgroundColor: barColor,
                                                    boxShadow: `0 0 10px ${barColor}80`
                                                }}
                                            />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </FadeIn>
    );
}
