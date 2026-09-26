"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Layers } from "lucide-react";

interface Props {
    data: { feature: string; tokens: number; cost: number }[];
}

const featureColors: Record<string, string> = {
    generate: "var(--primary)",
    regenerate: "var(--primary)",
    analyze: "var(--ai)",
    "analyze-result": "var(--primary)",
    "analyze-jd": "var(--success)",
    "enhance-instruction": "var(--warning)",
    "evaluate-level": "var(--danger)",
    "generate-followup": "var(--primary)",
};

export default function FeatureBreakdown({ data }: Props) {
    const totalTokens = data.reduce((sum, d) => sum + d.tokens, 0) || 1;
    const sorted = [...data].sort((a, b) => b.tokens - a.tokens);

    if (sorted.length === 0) {
        return (
            <Card className="bg-card/90 border-muted-foreground/15 rounded-[1.5rem] overflow-hidden relative shadow-2xl h-full flex flex-col">
                <div className="absolute inset-px rounded-[1.5rem] border border-border pointer-events-none" />
                <CardHeader className="pb-4 relative z-10">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-400" /> By Feature
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-32 text-sm text-muted-foreground relative z-10">No feature data yet</CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card/90 border-muted-foreground/15 rounded-[1.5rem] overflow-hidden relative shadow-2xl h-full flex flex-col">
            <div className="absolute inset-px rounded-[1.5rem] border border-border pointer-events-none" />
            <CardHeader className="pb-4 relative z-10">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" /> By Feature
                </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 flex-1 overflow-y-auto pr-2 space-y-3">
                {sorted.map((item) => {
                    const pct = (item.tokens / totalTokens) * 100;
                    const color = featureColors[item.feature] || "var(--muted-foreground)";
                    return (
                        <div key={item.feature} className="p-3 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-colors group/feat">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[11px] font-bold text-foreground group-hover/feat:text-foreground transition-colors uppercase tracking-wider">{item.feature}</span>
                                <div className="text-[10px] font-black tracking-widest text-muted-foreground flex gap-2">
                                    <span className="text-foreground">{pct.toFixed(0)}%</span>
                                    <span>·</span>
                                    <span className="text-emerald-400">${item.cost.toFixed(3)}</span>
                                </div>
                            </div>
                            <div className="h-1.5 bg-muted border border-border rounded-full overflow-hidden relative">
                                <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
