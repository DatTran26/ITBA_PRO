"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/ui/motion-wrapper";
import { AlertTriangle, ArrowRight, Brain, Clock, UserCheck, Search } from "lucide-react";
import type { AttentionCandidate } from "@/app/dashboard/types";

const reasonConfig = {
    pending_review: { label: "Pending Review", icon: Clock, style: "bg-[#FFB86C]/10 text-[#FFB86C] border-[#FFB86C]/20" },
    no_ai_analysis: { label: "Needs AI", icon: Brain, style: "bg-[#B48EFF]/10 text-[#B48EFF] border-[#B48EFF]/20" },
    borderline: { label: "Borderline", icon: AlertTriangle, style: "bg-[#FF6B82]/10 text-[#FF6B82] border-[#FF6B82]/20" },
};

export default function CandidatesAttention({ candidates }: { candidates: AttentionCandidate[] }) {
    const [search, setSearch] = useState("");
    const [paused, setPaused] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    const filtered = candidates.filter((c) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return c.candidate_name.toLowerCase().includes(q) || c.testName.toLowerCase().includes(q);
    });

    /* Pause auto-scroll on manual wheel/touch interaction */
    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        let timeout: ReturnType<typeof setTimeout>;
        const handler = () => { setPaused(true); clearTimeout(timeout); timeout = setTimeout(() => setPaused(false), 3000); };
        el.addEventListener("wheel", handler, { passive: true });
        el.addEventListener("touchstart", handler, { passive: true });
        return () => { el.removeEventListener("wheel", handler); el.removeEventListener("touchstart", handler); clearTimeout(timeout); };
    }, []);

    if (candidates.length === 0) return null;

    /* Duplicate cards for seamless loop — only when enough cards exceed viewport */
    const shouldLoop = !search && filtered.length >= 4;
    const displayCards = shouldLoop ? [...filtered, ...filtered] : filtered;
    const cardW = 260; // card width in px
    const gapW = 12; // gap-3 = 12px
    const trackW = shouldLoop ? filtered.length * (cardW + gapW) : undefined;

    return (
        <FadeIn delay={0.25} className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#FFB86C]" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-[#5A6882]">
                        Candidates Needing Attention
                    </h2>
                    <Badge className="bg-[#FFB86C]/10 text-[#FFB86C] border-[#FFB86C]/20 text-[10px] h-5 px-2">
                        {filtered.length}
                    </Badge>
                </div>
                <div className="relative w-full sm:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A6882]" />
                    <Input
                        placeholder="Search name or role..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 h-8 bg-[#1B253B] border-[#8B99B0]/10 text-[#ECF0F7] placeholder:text-[#5A6882] rounded-lg text-xs focus-visible:ring-[#FFB86C]/30"
                    />
                </div>
            </div>

            {filtered.length === 0 ? (
                <p className="text-sm text-[#5A6882] py-4">No matching candidates.</p>
            ) : (
                <div
                    className="overflow-hidden relative"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                >
                    {/* Fade edges */}
                    {shouldLoop && (
                        <>
                            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#1B253B] to-transparent z-10 pointer-events-none" />
                            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#1B253B] to-transparent z-10 pointer-events-none" />
                        </>
                    )}
                    <div
                        ref={trackRef}
                        className={`flex gap-3 ${shouldLoop ? "" : "overflow-x-auto"} scrollbar-hide`}
                        style={{
                            ...(shouldLoop ? {
                                width: trackW! * 2,
                                animation: `scroll-carousel ${filtered.length * 6}s linear infinite`,
                                animationPlayState: paused ? "paused" : "running",
                            } : {}),
                        }}
                    >
                        {displayCards.map((c, idx) => (
                            <CandidateCard key={`${c.id}-${idx}`} candidate={c} />
                        ))}
                    </div>
                    {/* CSS keyframe injected via style tag */}
                    {shouldLoop && (
                        <style>{`
                            @keyframes scroll-carousel { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                            .scrollbar-hide::-webkit-scrollbar { display: none; }
                            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                        `}</style>
                    )}
                </div>
            )}
        </FadeIn>
    );
}

function CandidateCard({ candidate: c }: { candidate: AttentionCandidate }) {
    const config = reasonConfig[c.reason];
    const ReasonIcon = config.icon;
    const pct = c.totalQuestions > 0 ? Math.round((c.score / c.totalQuestions) * 100) : 0;

    return (
        <Card className="border-[#8B99B0]/10 bg-[#1B253B] hover:border-[#8B99B0]/20 transition-all shrink-0 w-[260px]">
            <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FFB86C]/10 border border-[#FFB86C]/20 flex items-center justify-center shrink-0">
                        <UserCheck className="w-3.5 h-3.5 text-[#FFB86C]" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#ECF0F7] truncate">{c.candidate_name}</p>
                        <p className="text-[11px] text-[#5A6882] truncate">{c.testName}</p>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ScoreRing pct={pct} />
                        <Badge className={`h-5 text-[9px] px-1.5 border ${config.style}`}>
                            <ReasonIcon className="w-2.5 h-2.5 mr-0.5" />
                            {config.label}
                        </Badge>
                    </div>
                    <Link href={`/dashboard/results/${c.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-[#7C8FFF] hover:bg-[#7C8FFF]/10 text-[11px] cursor-pointer px-2">
                            Review <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

function ScoreRing({ pct }: { pct: number }) {
    const color = pct >= 70 ? "#36DDAB" : pct >= 40 ? "#FFB86C" : "#FF6B82";
    return (
        <div className="relative w-9 h-9">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#222C4A" strokeWidth="3" />
                <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="3"
                    strokeDasharray={`${(pct / 100) * 88} 88`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#ECF0F7]">{pct}%</span>
        </div>
    );
}
