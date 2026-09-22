"use client";
import { alpha } from "@/lib/utils";

import { Card } from "@/components/ui/card";
import { Users, FileText, ClipboardList, Cpu, DollarSign } from "lucide-react";
import type { AdminStats } from "@/app/dashboard/types";

interface Props {
    stats: AdminStats;
}

function formatTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

const kpis = [
    { key: "totalUsers",       label: "Total Users",  icon: Users,          color: "var(--primary)" },
    { key: "totalAssessments", label: "Assessments",  icon: FileText,        color: "var(--success)" },
    { key: "totalSubmissions", label: "Submissions",  icon: ClipboardList,   color: "var(--ai)" },
    { key: "tokens",           label: "Tokens Used",  icon: Cpu,             color: "var(--warning)" },
    { key: "totalCost",        label: "Est. Cost",    icon: DollarSign,      color: "var(--danger)" },
] as const;

function formatValue(key: string, stats: AdminStats): string {
    switch (key) {
        case "tokens":           return formatTokens((stats.totalTokensIn || 0) + (stats.totalTokensOut || 0));
        case "totalCost":        return `$${(Number(stats.totalCost) || 0).toFixed(2)}`;
        case "totalUsers":       return String(stats.totalUsers || 0);
        case "totalAssessments": return String(stats.totalAssessments || 0);
        case "totalSubmissions": return String(stats.totalSubmissions || 0);
        default:                 return "";
    }
}

export default function AdminKpiCards({ stats }: Props) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {kpis.map((kpi) => {
                const Icon = kpi.icon;
                const value = formatValue(kpi.key, stats);
                return (
                    <Card key={kpi.key} className="bg-card/90 border-muted-foreground/15 rounded-[1.5rem] overflow-hidden group hover:bg-card/95 transition-all duration-500 relative shadow-lg p-5 flex flex-col justify-between">
                        {/* Inner Highlight Border */}
                        <div className="absolute inset-px rounded-[1.5rem] border border-border pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="relative">
                                    <div
                                        className="absolute inset-0 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"
                                        style={{ backgroundColor: kpi.color }}
                                    />
                                    <div
                                        className="p-2 rounded-xl border shrink-0 relative z-10 bg-background shadow-inner"
                                        style={{ borderColor: `${alpha(kpi.color, 20)}` }}
                                    >
                                        <Icon className="w-4 h-4 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ color: kpi.color }} />
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{kpi.label}</span>
                            </div>

                            <p className="text-3xl font-black text-foreground font-display tracking-tight" style={{ color: kpi.color }}>
                                {value}
                            </p>

                            {kpi.key === "totalUsers" && (
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-2 border-t border-border pt-2">
                                    {stats.totalAdmins} admin · {stats.totalRecruiters} recruiter
                                </p>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
