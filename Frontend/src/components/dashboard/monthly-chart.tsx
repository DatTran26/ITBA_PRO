"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/motion-wrapper";
import { BarChart3 } from "lucide-react";
import type { MonthlyData } from "@/app/dashboard/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function MonthlyChart({ data }: { data: MonthlyData[] }) {
    const [hovered, setHovered] = useState<number | null>(null);
    const maxVal = Math.max(...data.map((d) => Math.max(d.passed, d.failed)), 1);
    const chartH = 240;

    return (
        <FadeIn delay={0.1} className="h-full">
            <Card className="bg-[#111827]/90 border-[#8B99B0]/15 rounded-[2.5rem] overflow-hidden group h-full relative shadow-2xl">
                {/* Inner Highlight Border */}
                <div className="absolute inset-px rounded-[2.5rem] border border-white/5 pointer-events-none" />

                <CardContent className="p-8 h-full flex flex-col relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-[#7C8FFF]/10 border border-[#7C8FFF]/20 shrink-0">
                                <BarChart3 className="w-5 h-5 text-[#7C8FFF]" />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B99B0]">
                                Passed vs Failed by Month
                            </h3>
                        </div>
                        <div className="flex items-center gap-6">
                            <Legend color="#36DDAB" label="Passed" glow="#10B98133" />
                            <Legend color="#FF6F8B" label="Failed" glow="#F43F5E33" />
                        </div>
                    </div>

                    {/* Y-axis labels + bars */}
                    <div className="flex gap-4 flex-1">
                        {/* Y-axis */}
                        <div className="flex flex-col justify-between text-right pr-2 shrink-0 w-8" style={{ height: chartH }}>
                            {[maxVal, Math.round(maxVal * 0.5), 0].map((v, i) => (
                                <span key={i} className="text-[10px] font-black text-[#5A6882] leading-none tabular-nums tracking-widest">{v}</span>
                            ))}
                        </div>

                        {/* Chart area */}
                        <div className="flex-1 relative">
                            {/* Grid lines */}
                            {[0, 50, 100].map((pct) => (
                                <div
                                    key={pct}
                                    className="absolute w-full border-t border-white/[0.03]"
                                    style={{ bottom: `${pct}%`, height: 0 }}
                                />
                            ))}

                            {/* Bar groups */}
                            <div className="flex items-end justify-around h-full relative z-10 px-2" style={{ height: chartH }}>
                                {data.map((d, i) => {
                                    const pH = (d.passed / maxVal) * chartH;
                                    const fH = (d.failed / maxVal) * chartH;
                                    const isHovered = hovered === i;

                                    return (
                                        <div
                                            key={i}
                                            className="flex flex-col items-center relative cursor-default"
                                            onMouseEnter={() => setHovered(i)}
                                            onMouseLeave={() => setHovered(null)}
                                        >
                                            <div className="flex items-end gap-[4px] relative">
                                                {/* Bar Shadows on Hover */}
                                                {isHovered && (
                                                    <div className="absolute inset-0 -bottom-1 blur-xl opacity-20 bg-[#7C8FFF]/30 rounded-full" />
                                                )}

                                                <motion.div
                                                    initial={false}
                                                    animate={{
                                                        height: pH || 4,
                                                        scaleX: isHovered ? 1.2 : 1
                                                    }}
                                                    className={`w-3.5 sm:w-5 rounded-t-lg transition-all duration-500 shadow-lg ${isHovered ? "z-10" : ""}`}
                                                    style={{
                                                        background: pH > 0 ? "linear-gradient(to top, #36DDAB33, #36DDAB)" : "rgba(54, 221, 171, 0.1)",
                                                        boxShadow: isHovered && pH > 0 ? "0 0 20px rgba(54, 221, 171, 0.4)" : "none"
                                                    }}
                                                />
                                                <motion.div
                                                    initial={false}
                                                    animate={{
                                                        height: fH || 4,
                                                        scaleX: isHovered ? 1.2 : 1
                                                    }}
                                                    className={`w-3.5 sm:w-5 rounded-t-lg transition-all duration-500 shadow-lg ${isHovered ? "z-10" : ""}`}
                                                    style={{
                                                        background: fH > 0 ? "linear-gradient(to top, #FF6F8B33, #FF6F8B)" : "rgba(255, 111, 139, 0.1)",
                                                        boxShadow: isHovered && fH > 0 ? "0 0 20px rgba(255, 111, 139, 0.4)" : "none"
                                                    }}
                                                />
                                            </div>

                                            {/* Tooltip - Pro VIP Style */}
                                            <AnimatePresence>
                                                {isHovered && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                                        className="absolute -top-[90px] left-1/2 -translate-x-1/2 bg-[#0F172A]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-[11px] z-50 whitespace-nowrap shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-none min-w-[120px]"
                                                    >
                                                        <div className="font-black text-[#ECF0F7] mb-2 uppercase tracking-widest text-[9px] border-b border-white/5 pb-1.5">{MONTHS[i]} 2026</div>
                                                        <div className="flex items-center justify-between gap-4 mb-1">
                                                            <span className="text-[#8B99B0] font-bold">PASSED</span>
                                                            <span className="text-[#36DDAB] font-black">{d.passed}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-[#8B99B0] font-bold">FAILED</span>
                                                            <span className="text-[#FF6F8B] font-black">{d.failed}</span>
                                                        </div>
                                                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0F172A] border-r border-b border-white/10 rotate-45" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* X-axis month labels */}
                    <div className="flex justify-around pl-12 mt-4">
                        {MONTHS.map((m, i) => (
                            <span
                                key={m}
                                className={`text-[10px] font-black tracking-widest transition-colors duration-300 ${
                                    hovered === i ? "text-[#FFB86C]" : "text-[#5A6882]"
                                }`}
                            >
                                {m}
                            </span>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </FadeIn>
    );
}

function Legend({ color, label, glow }: { color: string; label: string; glow: string }) {
    return (
        <div className="flex items-center gap-2.5 group cursor-default">
            <div className="relative">
                <div className="absolute inset-0 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" style={{ backgroundColor: glow }} />
                <div className="w-3 h-3 rounded-full relative z-10 border border-white/10" style={{ backgroundColor: color }} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8B99B0] group-hover:text-[#ECF0F7] transition-colors">{label}</span>
        </div>
    );
}
