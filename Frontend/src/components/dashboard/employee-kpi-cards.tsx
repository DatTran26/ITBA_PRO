import { alpha } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/motion-wrapper";
import { Users, BarChart3, AlertTriangle, ClipboardList, CheckCircle } from "lucide-react";
import type { EmployeeStats } from "@/app/dashboard/types";

const employeeKpis = [
    { key: "employeesEvaluated", label: "Evaluated", icon: Users, color: "var(--primary)", desc: "Employees assessed" },
    { key: "pendingEvaluations", label: "Pending", icon: ClipboardList, color: "var(--warning)", desc: "Awaiting evaluation" },
] as const;

export default function EmployeeKpiCards({ stats }: { stats: EmployeeStats | null }) {
    if (!stats) return null;

    return (
        <FadeIn delay={0.1} className="h-full">
            <div className="flex flex-col gap-4 h-full">
                {employeeKpis.map((kpi) => {
                    const Icon = kpi.icon;
                    const value = stats[kpi.key as keyof EmployeeStats];
                    return (
                        <Card key={kpi.key} className="bg-card/90 border-muted-foreground/15 rounded-[1.5rem] overflow-hidden group hover:bg-card/95 transition-all duration-500 flex-1 relative shadow-lg">
                            {/* Inner Highlight Border */}
                            <div className="absolute inset-px rounded-[1.5rem] border border-border pointer-events-none" />

                            <CardContent className="p-5 flex flex-col justify-center h-full gap-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div
                                            className="absolute inset-0 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"
                                            style={{ backgroundColor: kpi.color }}
                                        />
                                        <div
                                            className="p-2.5 rounded-xl border shrink-0 relative z-10 bg-background shadow-inner"
                                            style={{ borderColor: `${alpha(kpi.color, 20)}` }}
                                        >
                                            <Icon className="w-5 h-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ color: kpi.color }} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{kpi.label}</p>
                                        <p className="text-xs font-medium text-muted-foreground mt-0.5">{kpi.desc}</p>
                                    </div>
                                </div>
                                <div className="flex items-end justify-between">
                                    <p className="text-4xl font-black font-display leading-none tracking-tight" style={{ color: kpi.color }}>
                                        {typeof value === "number" ? (Number.isInteger(value) ? value : value.toFixed(1)) : "—"}
                                    </p>
                                    <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
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
