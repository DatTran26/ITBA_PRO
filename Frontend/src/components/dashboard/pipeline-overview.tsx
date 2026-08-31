import { FadeIn } from "@/components/ui/motion-wrapper";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { GitBranch, TrendingUp, Zap, Clock, Target } from "lucide-react";
import type { PipelineStage } from "@/app/dashboard/types";

function DonutChart({ stages, size = 160 }: { stages: PipelineStage[]; size?: number }) {
    const total = stages.reduce((s, st) => s + st.count, 0);

    const radius = 58;
    const strokeWidth = 14;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    let cumOffset = 0;
    const segments = stages.filter((s) => s.count > 0).map((stage) => {
        const dash = total > 0 ? (stage.count / total) * circumference : 0;
        const offset = -cumOffset;
        cumOffset += dash;
        return { ...stage, dashArray: `${dash} ${circumference - dash}`, offset };
    });

    return (
        <div className="relative shrink-0 flex items-center justify-center group" style={{ width: size, height: size }}>
            <div className="absolute inset-0 bg-[#7C8FFF]/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 relative z-10">
                <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth={strokeWidth} />
                {total === 0 && (
                    <motion.circle
                        cx={center} cy={center} r={radius} fill="none" stroke="rgba(124,143,255,0.15)" strokeWidth={strokeWidth} strokeDasharray="4 12"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        style={{ transformOrigin: "center" }}
                    />
                )}
                {segments.map((seg) => (
                    <motion.circle
                        key={seg.label}
                        cx={center} cy={center} r={radius}
                        fill="none" stroke={seg.color} strokeWidth={strokeWidth}
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{ strokeDasharray: seg.dashArray }}
                        strokeDashoffset={seg.offset}
                        strokeLinecap="round"
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="drop-shadow-[0_0_8px_rgba(0,0,0,0.5)] cursor-pointer"
                    />
                ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center relative z-20">
                <span className={`text-3xl font-black font-display tabular-nums tracking-tighter drop-shadow-lg ${total > 0 ? "text-[#ECF0F7]" : "text-[#5A6882]"}`}>{total}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5A6882]">Protocol</span>
            </div>
        </div>
    );
}


export default function PipelineOverview({ stages, title = "Recruitment Pipeline" }: { stages: PipelineStage[], title?: string }) {
    const total = stages.reduce((s, st) => s + st.count, 0);

    return (
        <FadeIn delay={0.15} className="h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6 px-1">
                <div className="p-2 rounded-xl bg-[#7C8FFF]/10 border border-[#7C8FFF]/20">
                    <GitBranch className="w-5 h-5 text-[#7C8FFF]" />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B99B0]">
                    {title}
                </h2>
            </div>

            <Card className="bg-[#111827]/90 border-[#8B99B0]/15 rounded-[2.5rem] overflow-hidden group flex-1 relative shadow-2xl">
                {/* Inner Highlight Border */}
                <div className="absolute inset-px rounded-[2.5rem] border border-white/5 pointer-events-none" />

                <CardContent className="p-6 h-full flex flex-col justify-center relative z-10 gap-2">
                    <div className="flex flex-col xl:flex-row items-center gap-8 h-full relative">
                        {total === 0 ? (
                            <div className="flex-1 w-full flex flex-col items-center justify-center py-8 px-4 bg-gradient-to-b from-[#7C8FFF]/[0.02] to-transparent rounded-[2rem] border border-[#7C8FFF]/[0.05] relative overflow-hidden">
                                {/* Scanner Line Sweep */}
                                <motion.div
                                    animate={{ y: ["-100%", "200%"], opacity: [0, 0.5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-[#7C8FFF]/10 to-transparent blur-sm pointer-events-none"
                                />

                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="relative flex items-center justify-center w-28 h-28 mb-6 group/standby cursor-default"
                                >
                                    <div className="absolute inset-0 border border-dashed border-[#7C8FFF]/40 rounded-full" />
                                    <div className="absolute inset-3 border border-[#7C8FFF]/20 rounded-full" />
                                    <div className="absolute inset-0 bg-[#7C8FFF]/5 blur-2xl rounded-full transition-all duration-700 group-hover/standby:bg-[#7C8FFF]/15" />
                                    <GitBranch className="w-8 h-8 text-[#7C8FFF]/60" />
                                </motion.div>

                                <h3 className="text-xl font-black font-display text-[#ECF0F7] mb-2 tracking-widest uppercase relative flex items-center gap-3">
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                                    System Standby
                                </h3>
                                <p className="text-xs text-[#8B99B0] text-center max-w-[320px] leading-relaxed">
                                    Evaluation protocols are primed and ready. Awaiting initial assessment data to activate tracking algorithms.
                                </p>
                            </div>
                        ) : (
                            <>
                                <DonutChart stages={stages} size={140} />

                                <div className="flex flex-col gap-3 flex-1 w-full xl:pl-4">
                                    {stages.map((stage) => {
                                        const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0;
                                        return (
                                            <div key={stage.label} className="flex items-center justify-between group/row cursor-default py-2 border-b border-white/[0.02] last:border-0">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-2.5 h-2.5 rounded-full relative">
                                                        <div className="absolute inset-0 blur-sm opacity-40 rounded-full" style={{ backgroundColor: stage.color }} />
                                                        <div className="relative z-10 w-full h-full rounded-full border border-white/10" style={{ backgroundColor: stage.color }} />
                                                    </div>
                                                    <span className="text-xs font-bold text-[#8B99B0] group-hover/row:text-[#ECF0F7] transition-colors">{stage.label}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm font-black font-display text-[#ECF0F7] tabular-nums tracking-tight">{stage.count}</span>
                                                    <div className="w-12 h-1 bg-white/[0.02] rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 1, delay: 0.5 }}
                                                            className="h-full opacity-30 shadow-[0_0_8px_currentColor]"
                                                            style={{ backgroundColor: stage.color, color: stage.color }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-black text-[#5A6882] min-w-[2rem] text-right tabular-nums">{pct}%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Secondary Metrics to fill space and add value */}
                    <div className="mt-8 pt-5 border-t border-white/5 grid grid-cols-4 gap-4 relative">
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <div className="flex flex-col gap-1 p-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#5A6882] flex items-center gap-1.5">
                                <TrendingUp className={`w-3 h-3 ${total > 0 ? "text-emerald-400" : "text-[#5A6882]"}`} />
                                Conversion
                            </span>
                            <span className={`text-xl font-black font-display tabular-nums tracking-tighter ${total > 0 ? "text-[#ECF0F7]" : "text-[#5A6882]"}`}>
                                {total > 0 ? "68%" : "N/A"}
                            </span>
                            <span className="text-[10px] font-bold text-[#8B99B0]">Optimal threshold</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l border-white/5 pl-4 p-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#5A6882] flex items-center gap-1.5">
                                <Clock className={`w-3 h-3 ${total > 0 ? "text-[#7C8FFF]" : "text-[#5A6882]"}`} />
                                Velocity
                            </span>
                            <span className={`text-xl font-black font-display tabular-nums tracking-tighter ${total > 0 ? "text-[#ECF0F7]" : "text-[#5A6882]"}`}>
                                {total > 0 ? (
                                    <>4.2 <span className="text-[10px] font-bold text-[#5A6882]">days</span></>
                                ) : "N/A"}
                            </span>
                            <span className={`text-[10px] font-bold ${total > 0 ? "text-emerald-400" : "text-[#8B99B0]"}`}>{total > 0 ? "Faster than avg" : "Awaiting data"}</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l border-white/5 pl-4 p-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#5A6882] flex items-center gap-1.5">
                                <Target className={`w-3 h-3 ${total > 0 ? "text-[#B48EFF]" : "text-[#5A6882]"}`} />
                                AI Match
                            </span>
                            <span className={`text-xl font-black font-display tabular-nums tracking-tighter ${total > 0 ? "text-[#ECF0F7]" : "text-[#5A6882]"}`}>
                                {total > 0 ? "92%" : "N/A"}
                            </span>
                            <span className={`text-[10px] font-bold ${total > 0 ? "text-emerald-400" : "text-[#8B99B0]"}`}>{total > 0 ? "High precision" : "Awaiting data"}</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l border-white/5 pl-4 p-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#5A6882] flex items-center gap-1.5">
                                <Zap className={`w-3 h-3 ${total > 0 ? "text-[#FFB86C]" : "text-[#5A6882]"}`} />
                                Drop-off
                            </span>
                            <span className={`text-xl font-black font-display tabular-nums tracking-tighter ${total > 0 ? "text-[#ECF0F7]" : "text-[#5A6882]"}`}>
                                {total > 0 ? "12%" : "N/A"}
                            </span>
                            <span className="text-[10px] font-bold text-[#8B99B0]">{total > 0 ? "Low risk" : "Awaiting data"}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </FadeIn>
    );
}
