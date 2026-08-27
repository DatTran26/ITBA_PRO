"use client";

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
    { key: "totalUsers",       label: "Total Users",  icon: Users,          color: "#7C8FFF" },
    { key: "totalAssessments", label: "Assessments",  icon: FileText,        color: "#36DDAB" },
    { key: "totalSubmissions", label: "Submissions",  icon: ClipboardList,   color: "#B48EFF" },
    { key: "tokens",           label: "Tokens Used",  icon: Cpu,             color: "#FFB86C" },
    { key: "totalCost",        label: "Est. Cost",    icon: DollarSign,      color: "#FF6B82" },
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
                    <Card key={kpi.key} className="bg-[#111827]/90 border-[#8B99B0]/15 rounded-[1.5rem] overflow-hidden group hover:bg-[#111827]/95 transition-all duration-500 relative shadow-lg p-5 flex flex-col justify-between">
                        {/* Inner Highlight Border */}
                        <div className="absolute inset-px rounded-[1.5rem] border border-white/5 pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="relative">
                                    <div
                                        className="absolute inset-0 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"
                                        style={{ backgroundColor: kpi.color }}
                                    />
                                    <div
                                        className="p-2 rounded-xl border shrink-0 relative z-10 bg-[#0F172A] shadow-inner"
                                        style={{ borderColor: `${kpi.color}33` }}
                                    >
                                        <Icon className="w-4 h-4 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ color: kpi.color }} />
                                    </div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5A6882]">{kpi.label}</span>
                            </div>

                            <p className="text-3xl font-black text-[#ECF0F7] font-display tracking-tight" style={{ color: kpi.color }}>
                                {value}
                            </p>

                            {kpi.key === "totalUsers" && (
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A6882] mt-2 border-t border-white/5 pt-2">
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
