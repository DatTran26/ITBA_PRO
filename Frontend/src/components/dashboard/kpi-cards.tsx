import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/motion-wrapper";
import { Database, Users } from "lucide-react";
import type { DashboardStats } from "@/app/dashboard/types";

const heroKpis = [
    { key: "activeTests", label: "Active Tests", icon: Database, color: "#7C8FFF", desc: "Currently running" },
    { key: "pendingReview", label: "Pending Review", icon: Users, color: "#FFB86C", desc: "Awaiting decision" },
] as const;

export default function KpiCards({ stats }: { stats: DashboardStats }) {
    return (
        <FadeIn delay={0.1} className="h-full">
            <div className="flex flex-col gap-4 h-full">
                {heroKpis.map((kpi) => {
                    const Icon = kpi.icon;
                    const value = stats[kpi.key as keyof DashboardStats];
                    return (
                        <Card key={kpi.key} className="bg-[#111827]/90 border-[#8B99B0]/15 rounded-[1.5rem] overflow-hidden group hover:bg-[#111827]/95 transition-all duration-500 flex-1 relative shadow-lg">
                            {/* Inner Highlight Border */}
                            <div className="absolute inset-px rounded-[1.5rem] border border-white/5 pointer-events-none" />

                            <CardContent className="p-5 flex flex-col justify-center h-full gap-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div
                                            className="absolute inset-0 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"
                                            style={{ backgroundColor: kpi.color }}
                                        />
                                        <div
                                            className="p-2.5 rounded-xl border shrink-0 relative z-10 bg-[#0F172A] shadow-inner"
                                            style={{ borderColor: `${kpi.color}33` }}
                                        >
                                            <Icon className="w-5 h-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ color: kpi.color }} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5A6882]">{kpi.label}</p>
                                        <p className="text-xs font-medium text-[#8B99B0] mt-0.5">{kpi.desc}</p>
                                    </div>
                                </div>
                                <div className="flex items-end justify-between">
                                    <p className="text-4xl font-black font-display leading-none tracking-tight" style={{ color: kpi.color }}>
                                        {value}
                                    </p>
                                    <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full w-1/3 bg-current opacity-30" style={{ color: kpi.color }} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </FadeIn>
    );
}
