"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Users, Briefcase, ShieldCheck, Calendar, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import type { DashboardMode } from "@/app/dashboard/types";

interface TabDef {
    id: DashboardMode;
    label: string;
    icon: React.ElementType;
}

interface DashboardModeTabsProps {
    activeMode: DashboardMode;
    role: string;
}

// Tabs accumulate hierarchically: higher privilege inherits all lower tabs
const HR_TAB:          TabDef = { id: "hr",          label: "HR",          icon: Users };
const INTERVIEWER_TAB: TabDef = { id: "interviewer", label: "Interviewer", icon: Calendar };
const RECRUITMENT_TAB: TabDef = { id: "recruitment", label: "Recruitment", icon: Briefcase };
const EMPLOYEE_TAB:    TabDef = { id: "employee",    label: "Employee",    icon: BarChart3 };
const ADMIN_TAB:       TabDef = { id: "admin",       label: "Admin",       icon: ShieldCheck };

const TAB_SETS: Record<string, TabDef[]> = {
    hr:          [HR_TAB],
    interviewer: [HR_TAB, INTERVIEWER_TAB],
    recruiter:   [RECRUITMENT_TAB, EMPLOYEE_TAB],
    admin:       [HR_TAB, INTERVIEWER_TAB, RECRUITMENT_TAB, EMPLOYEE_TAB, ADMIN_TAB],
    super_admin: [HR_TAB, INTERVIEWER_TAB, RECRUITMENT_TAB, EMPLOYEE_TAB, ADMIN_TAB],
};

export default function DashboardModeTabs({ activeMode, role }: DashboardModeTabsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const tabs = TAB_SETS[role] ?? TAB_SETS["recruiter"];

    function handleModeChange(mode: DashboardMode) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("mode", mode);
        router.push(`/dashboard?${params.toString()}`);
    }

    return (
        <div className="mb-6 mt-1 px-1 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center p-1 bg-card/90 border border-muted-foreground/15 rounded-[1rem] relative shadow-lg overflow-hidden group">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                {tabs.map((tab) => {
                    const isActive = activeMode === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleModeChange(tab.id)}
                            className={`relative px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-500 cursor-pointer group/item overflow-hidden ${
                                isActive ? "text-foreground" : "text-muted-foreground hover:text-muted-foreground"
                            }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-tab"
                                    className="absolute inset-0 bg-primary/25 border border-primary/40 shadow-[inset_0_0_15px_color-mix(in_srgb,var(--primary)_20%,transparent)]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    style={{ borderRadius: "0.75rem" }}
                                />
                            )}
                            {isActive && (
                                <motion.div
                                    layoutId="active-glow"
                                    className="absolute -inset-2 bg-primary/15 blur-lg opacity-60"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <div className={`relative z-10 p-1.5 rounded-md transition-colors duration-500 ${
                                isActive ? "bg-primary text-white shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_60%,transparent)]" : "bg-transparent group-hover/item:bg-muted"
                            }`}>
                                <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className={`relative z-10 text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-500 ${
                                isActive ? "scale-105" : "scale-100"
                            }`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
            {role === "hr" && (
                <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
                    <Link href="/dashboard/recruitment/sessions" className="group flex items-center gap-2 h-11 px-5 rounded-xl bg-muted border border-border text-foreground font-black text-sm shadow-lg transition-all duration-300 hover:bg-muted hover:border-warning/40 hover:scale-[1.02] active:scale-[0.98]">
                        <Calendar className="w-4 h-4 text-warning group-hover:scale-110 transition-transform" />
                        <span>Lên lịch PV</span>
                    </Link>
                    <Link href="/dashboard/recruitment/report" className="group flex items-center gap-2 h-11 px-5 rounded-xl bg-muted border border-border text-foreground font-black text-sm shadow-lg transition-all duration-300 hover:bg-muted hover:border-ai/40 hover:scale-[1.02] active:scale-[0.98]">
                        <BarChart3 className="w-4 h-4 text-ai group-hover:scale-110 transition-transform" />
                        <span>Báo cáo</span>
                    </Link>
                </div>
            )}
        </div>
    );
}
