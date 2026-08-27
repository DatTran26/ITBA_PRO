"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Briefcase, ClipboardCopy, Power, Trash2, MoreVertical } from "lucide-react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DashboardTest } from "@/app/dashboard/types";

const levelColors: Record<string, string> = {
    Junior: "bg-[#36DDAB]/10 text-[#36DDAB] border-[#36DDAB]/20",
    Mid: "bg-[#7C8FFF]/10 text-[#7C8FFF] border-[#7C8FFF]/20",
    Senior: "bg-[#FF6B82]/10 text-[#FF6B82] border-[#FF6B82]/20",
};

function ActionIcon({ icon: Icon, onClick, variant = "default", tooltip }: {
    icon: any;
    onClick: (e: React.MouseEvent) => void;
    variant?: "default" | "danger" | "success";
    tooltip: string;
}) {
    const colors = {
        default: "text-[#8B99B0] hover:text-[#7C8FFF] hover:bg-[#7C8FFF]/10",
        danger: "text-[#8B99B0] hover:text-rose-400 hover:bg-rose-400/10",
        success: "text-[#8B99B0] hover:text-emerald-400 hover:bg-emerald-400/10"
    };

    return (
        <Tooltip openDelay={0}>
            <TooltipTrigger
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(e);
                }}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 active:scale-95 ${colors[variant]}`}
            >
                <Icon className="w-4 h-4" />
            </TooltipTrigger>
            <TooltipContent className="bg-[#0A0F1E] border-[#8B99B0]/20 text-[11px]">
                {tooltip}
            </TooltipContent>
        </Tooltip>
    );
}

interface Props {
    test: DashboardTest;
    isCardHovered: boolean;
    isSelected: boolean;
    selectionMode: boolean;
    onToggleStatus: (test: { id: string; status: string; name: string }) => void;
    onDelete?: (test: { id: string; name: string }) => void;
}

// Header block of the assessment card (icon, title, level/status badges, action bar).
// Split out of assessment-card.tsx.
export default function AssessmentCardHeader({ test, isCardHovered, isSelected, selectionMode, onToggleStatus, onDelete }: Props) {
    const [isMenuHovered, setIsMenuHovered] = useState(false);

    function copyLink(token: string) {
        const link = `${window.location.origin}/test/${token}`;
        navigator.clipboard.writeText(link);
        toast.success("Link copied to clipboard");
    }

    return (
        <CardHeader className="p-7 pb-4 relative z-20">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-4 flex-1 min-w-0">
                    <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-2xl bg-[#0F172A] border border-[#8B99B0]/10 transition-all duration-500 ${isCardHovered ? "border-[#FFB86C]/50 shadow-[0_0_15px_rgba(255,184,108,0.3)]" : "text-[#5A6882]"}`}>
                            <Briefcase className={`w-5 h-5 transition-colors duration-500 ${isCardHovered ? "text-[#FFB86C]" : "text-[#5A6882]"}`} />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className={`text-xl font-bold tracking-tight transition-colors font-display truncate pr-2 ${
                                isSelected || selectionMode ? "text-[#FFB86C]" : "text-[#ECF0F7] group-hover:text-[#FFB86C]"
                            }`}>
                                {test.title || test.job_role}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Badge className={`px-2 py-0 h-5 text-[10px] font-black tracking-tighter uppercase rounded-md border ${levelColors[test.level] || "bg-[#1B253B] text-[#8B99B0] border-[#8B99B0]/20"}`}>
                                    {test.level}
                                </Badge>
                                {test.target_type === 'employee' && (
                                    <div className="px-1.5 py-0 rounded text-[9px] font-bold bg-[#B48EFF]/10 text-[#B48EFF] border border-[#B48EFF]/20 uppercase tracking-widest">Internal</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className={`h-7 text-[10px] font-bold px-3 rounded-full border-2 border-transparent relative overflow-hidden transition-all duration-500 ${
                                test.status === "active"
                                ? "bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.1)]"
                                : test.status === "completed"
                                ? "bg-sky-500/10 text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.1)]"
                                : "bg-rose-500/10 text-rose-400"
                            }`}
                        >
                            <span className="flex items-center gap-2 relative z-10">
                                <span className="relative flex h-2 w-2">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                        test.status === "active" ? "bg-emerald-400" : test.status === "completed" ? "bg-sky-400" : "bg-rose-400"
                                    }`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                        test.status === "active" ? "bg-emerald-400" : test.status === "completed" ? "bg-sky-400" : "bg-rose-400"
                                    }`}></span>
                                </span>
                                <span className="tracking-widest uppercase">
                                    {test.status === "active" ? "Live" : test.status === "completed" ? "Completed" : "Deactivated"}
                                </span>
                            </span>
                        </Badge>
                    </div>
                </div>

                {/* Action Bar - Pro Refined */}
                <div className="flex items-center gap-2 shrink-0 pt-1">
                    {!selectionMode && (
                        <div className="flex items-center gap-1.5">
                            <Tooltip openDelay={0}>
                                <TooltipTrigger
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        copyLink(test.share_token);
                                    }}
                                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#FFB86C] text-[#0F172A] hover:bg-[#E29A4D] transition-all duration-300 shadow-[0_10px_25px_rgba(255,184,108,0.4)] active:scale-90"
                                >
                                    <ClipboardCopy className="w-4.5 h-4.5" />
                                </TooltipTrigger>
                                <TooltipContent className="bg-[#0A0F1E] border-[#8B99B0]/20 text-[11px]">
                                    Instant Copy
                                </TooltipContent>
                            </Tooltip>

                            <div
                                className="relative h-10 min-w-10 flex items-center justify-center"
                                onMouseEnter={() => setIsMenuHovered(true)}
                                onMouseLeave={() => setIsMenuHovered(false)}
                            >
                                {/* More Icon - Hidden on Hover (Fade Out) */}
                                <div
                                    className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                                        isMenuHovered ? "opacity-0 scale-90 translate-y-1" : "opacity-80 scale-100 translate-y-0"
                                    }`}
                                >
                                    <MoreVertical className="w-5 h-5 text-[#ECF0F7]" />
                                </div>

                                {/* Actions Menu - Visible on Hover (Fade In) */}
                                <div
                                    className={`absolute right-0 flex items-center gap-1.5 p-1.5 bg-[#0F172A] rounded-2xl border border-[#FFB86C]/30 shadow-[0_10px_35px_rgba(0,0,0,0.6)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] origin-[calc(100%-20px)] ${
                                        isMenuHovered ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-95 translate-x-4 pointer-events-none"
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ActionIcon
                                        icon={Power}
                                        onClick={() => onToggleStatus({ id: test.id, status: test.status, name: test.job_role })}
                                        variant={test.status === "active" ? "danger" : "success"}
                                        tooltip={test.status === "active" ? "Deactivate" : "Live"}
                                    />
                                    <div className="w-px h-4 bg-white/5 mx-0.5" />
                                    <ActionIcon
                                        icon={Trash2}
                                        onClick={() => onDelete?.({ id: test.id, name: test.job_role })}
                                        variant="danger"
                                        tooltip="Delete"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </CardHeader>
    );
}
