"use client";

import { LayoutGrid, Clock4, Users, TrendingUp } from "lucide-react";

interface Stats {
    total: number;
    upcoming: number;
    totalCandidates: number;
    confirmRate: number;
}

const CARDS = [
    { key: "total",      label: "Tổng buổi PV",  icon: LayoutGrid, accent: "#7C8FFF", getValue: (s: Stats) => String(s.total)           },
    { key: "upcoming",   label: "Sắp diễn ra",    icon: Clock4,     accent: "#36DDAB", getValue: (s: Stats) => String(s.upcoming)         },
    { key: "candidates", label: "Tổng ứng viên",  icon: Users,      accent: "#F59E0B", getValue: (s: Stats) => String(s.totalCandidates)  },
    { key: "confirm",    label: "Tỉ lệ xác nhận", icon: TrendingUp, accent: "#B48EFF", getValue: (s: Stats) => `${s.confirmRate}%`        },
];

const DOT_GRID = `url("data:image/svg+xml,%3Csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='0.7' fill='%238B99B0' fill-opacity='0.07'/%3E%3C/svg%3E")`;

export default function SessionStatCards({ stats }: { stats: Stats }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {CARDS.map(({ key, label, icon: Icon, accent, getValue }) => (
                <div key={key} className="relative rounded-xl overflow-hidden group"
                     style={{ background: "#090D18", border: `1px solid ${accent}18` }}>

                    {/* Dot-grid texture */}
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: DOT_GRID }} />

                    {/* Ambient top-left glow */}
                    <div className="absolute -top-5 -left-5 w-16 h-16 rounded-full pointer-events-none"
                         style={{ background: accent, filter: "blur(28px)", opacity: 0.15 }} />

                    {/* Right signal bar */}
                    <div className="absolute top-0 right-0 w-[2px] h-full rounded-r-xl"
                         style={{ background: `linear-gradient(180deg, ${accent}00, ${accent}70, ${accent}00)` }} />

                    {/* Top edge */}
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                         style={{ background: `linear-gradient(90deg, transparent, ${accent}45, transparent)` }} />

                    {/* Horizontal content */}
                    <div className="relative flex items-center gap-3 px-4 py-3.5">
                        {/* Icon */}
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                             style={{ background: `${accent}14`, border: `1px solid ${accent}28` }}>
                            <Icon className="w-4 h-4" style={{ color: accent }} />
                        </div>

                        {/* Value + label */}
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5A6882] leading-none mb-1">
                                {label}
                            </p>
                            <p className="text-2xl font-bold leading-none font-display"
                               style={{ color: accent, textShadow: `0 0 20px ${accent}50` }}>
                                {getValue(stats)}
                            </p>
                        </div>
                    </div>

                    {/* Hover border */}
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                         style={{ border: `1px solid ${accent}32` }} />
                </div>
            ))}
        </div>
    );
}
