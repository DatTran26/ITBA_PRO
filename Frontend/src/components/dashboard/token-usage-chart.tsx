"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useState } from "react";

interface Props {
    data: { date: string; tokens: number; cost: number }[];
}

export default function TokenUsageChart({ data }: Props) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const maxTokens = Math.max(...data.map((d) => d.tokens), 1);

    // Show last 30 days, fill missing
    const last30 = data.slice(-30);

    if (last30.length === 0) {
        return (
            <Card className="bg-[#111827]/90 border-[#8B99B0]/15 rounded-[1.5rem] overflow-hidden relative shadow-2xl h-full flex flex-col">
                <div className="absolute inset-px rounded-[1.5rem] border border-white/5 pointer-events-none" />
                <CardHeader className="pb-4 relative z-10">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B99B0] flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#7C8FFF]" />Token Usage (30d)
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-32 text-sm text-[#5A6882] relative z-10">No usage data yet</CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-[#111827]/90 border-[#8B99B0]/15 rounded-[1.5rem] overflow-hidden relative shadow-2xl h-full flex flex-col">
            <div className="absolute inset-px rounded-[1.5rem] border border-white/5 pointer-events-none" />
            <CardHeader className="pb-4 relative z-10">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B99B0] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#7C8FFF]" />Token Usage (30d)
                </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 flex-1 flex flex-col justify-end">
                <div className="flex items-end gap-[4px] h-32 relative">
                    {last30.map((d, i) => {
                        const h = (d.tokens / maxTokens) * 100;
                        const isHovered = hoveredIdx === i;
                        return (
                            <div key={d.date} className="relative flex-1 flex flex-col items-center justify-end group/bar"
                                onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
                                <div className="w-full rounded-t-sm transition-all duration-300"
                                    style={{
                                        height: `${Math.max(h, 2)}%`,
                                        background: isHovered ? "#7C8FFF" : `linear-gradient(to top, #5B6CF080, #7C8FFF40)`,
                                        boxShadow: isHovered ? "0 0 12px rgba(124, 143, 255, 0.4)" : "none",
                                    }} />
                                {isHovered && (
                                    <div className="absolute bottom-full mb-3 bg-[#0F172A]/90 backdrop-blur-xl border border-[#7C8FFF]/30 rounded-xl px-3 py-2 text-[10px] whitespace-nowrap z-50 flex flex-col items-center shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
                                        <p className="text-[#ECF0F7] font-black font-display text-xs mb-0.5 tracking-wide">{d.tokens.toLocaleString()} <span className="opacity-70 font-medium">tokens</span></p>
                                        <p className="text-[#8B99B0] font-bold tracking-widest uppercase">${d.cost.toFixed(4)} <span className="mx-1">·</span> <span className="text-[#7C8FFF]">{d.date.slice(5)}</span></p>
                                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0F172A]/90 border-b border-r border-[#7C8FFF]/30 rotate-45" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-between mt-3 text-[10px] font-bold uppercase tracking-widest text-[#5A6882]">
                    <span>{last30[0]?.date.slice(5)}</span>
                    <span>{last30[last30.length - 1]?.date.slice(5)}</span>
                </div>
            </CardContent>
        </Card>
    );
}
