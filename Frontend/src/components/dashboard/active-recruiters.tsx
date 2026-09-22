"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface Props {
    data: { name: string; email: string; testCount: number }[];
}

export default function ActiveRecruiters({ data }: Props) {
    if (data.length === 0) {
        return (
            <Card className="bg-card/90 border-muted-foreground/15 rounded-[1.5rem] overflow-hidden relative shadow-2xl h-full flex flex-col">
                <div className="absolute inset-px rounded-[1.5rem] border border-border pointer-events-none" />
                <CardHeader className="pb-4 relative z-10">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-400" />Top Recruiters
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-32 text-sm text-muted-foreground relative z-10">No recruiter data yet</CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card/90 border-muted-foreground/15 rounded-[1.5rem] overflow-hidden relative shadow-2xl h-full flex flex-col">
            <div className="absolute inset-px rounded-[1.5rem] border border-border pointer-events-none" />
            <CardHeader className="pb-4 relative z-10">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />Top Recruiters
                </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 flex-1 overflow-y-auto pr-2">
                <div className="space-y-3">
                    {data.map((r, i) => (
                        <div key={r.email} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors relative group/row overflow-hidden">
                            <div className="absolute left-0 inset-y-0 w-1 bg-amber-400/50 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                            <span className="text-xs font-black font-display text-muted-foreground w-4 mt-0.5">#{i + 1}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate group-hover/row:text-foreground transition-colors">{r.name || r.email}</p>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-0.5 truncate">{r.email}</p>
                            </div>
                            <span className="text-xl font-black font-display text-amber-400 drop-shadow-[0_0_10px_color-mix(in_srgb,var(--warning)_30%,transparent)]">{r.testCount}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
