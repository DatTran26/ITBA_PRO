"use client";

import { motion, useReducedMotion } from "framer-motion";
import ChartFrame from "./chart-frame";
import type { Slice } from "./types";

/** Vòng tròn khuyết + chú giải. Rút phép tính stroke-dasharray từ
 *  components/dashboard/pipeline-overview.tsx. */
export default function DonutStat({
    title, slices, centerLabel, size = 132, aside,
}: {
    title: string;
    slices: Slice[];
    /** Nhãn nhỏ dưới con số tổng ở giữa vòng. */
    centerLabel?: string;
    size?: number;
    aside?: React.ReactNode;
}) {
    const reduce = useReducedMotion();
    const total = slices.reduce((s, x) => s + x.value, 0);

    const stroke = 14;
    const radius = size / 2 - stroke;
    const circ = 2 * Math.PI * radius;
    const c = size / 2;

    let run = 0;
    const segments = slices
        .filter((s) => s.value > 0)
        .map((s) => {
            const dash = (s.value / total) * circ;
            const seg = { ...s, dashArray: `${dash} ${circ - dash}`, offset: -run };
            run += dash;
            return seg;
        });

    return (
        <ChartFrame title={title} aside={aside} empty={total === 0}>
            <div className="flex flex-col sm:flex-row items-center gap-5 h-full">
                <div className="relative shrink-0" style={{ width: size, height: size }}>
                    <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90 w-full h-full">
                        <circle cx={c} cy={c} r={radius} fill="none"
                                stroke="var(--muted)" strokeWidth={stroke} />
                        {segments.map((s) => (
                            <motion.circle
                                key={s.label}
                                cx={c} cy={c} r={radius} fill="none"
                                stroke={s.color} strokeWidth={stroke} strokeLinecap="round"
                                strokeDashoffset={s.offset}
                                initial={reduce ? false : { strokeDasharray: `0 ${circ}` }}
                                animate={{ strokeDasharray: s.dashArray }}
                                transition={{ duration: 0.9, ease: "circOut" }}
                            />
                        ))}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-display text-2xl font-bold tabular-nums text-foreground leading-none">
                            {total}
                        </span>
                        {centerLabel && (
                            <span className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                                {centerLabel}
                            </span>
                        )}
                    </div>
                </div>

                <ul className="flex-1 w-full space-y-2 min-w-0">
                    {slices.map((s) => (
                        <li key={s.label} className="flex items-center gap-3 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: s.color }} />
                            <span className="text-muted-foreground truncate flex-1">{s.label}</span>
                            <span className="font-semibold text-foreground tabular-nums">{s.value}</span>
                            <span className="text-muted-foreground tabular-nums w-9 text-right">
                                {total > 0 ? Math.round((s.value / total) * 100) : 0}%
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </ChartFrame>
    );
}
