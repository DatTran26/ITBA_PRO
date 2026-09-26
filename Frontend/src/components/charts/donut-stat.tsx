"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import ChartFrame, { type ChartTag } from "./chart-frame";
import type { Slice } from "./types";

/** Vòng tròn khuyết + chú giải. Hover lát hoặc dòng chú giải → tâm vòng hiện
 *  giá trị lát đó, các lát khác mờ đi. Khe 2px giữa các lát (dataviz spacer). */
export default function DonutStat({
    title, subtitle, tag, slices, centerLabel, size = 132, aside,
}: {
    title: string;
    subtitle?: string;
    tag?: ChartTag;
    slices: Slice[];
    /** Nhãn nhỏ dưới con số tổng ở giữa vòng. */
    centerLabel?: string;
    size?: number;
    aside?: React.ReactNode;
}) {
    const reduce = useReducedMotion();
    const [hover, setHover] = useState<string | null>(null);
    const total = slices.reduce((s, x) => s + x.value, 0);

    const stroke = 16;
    const radius = size / 2 - stroke / 2 - 2;
    const circ = 2 * Math.PI * radius;
    const c = size / 2;
    const live = slices.filter((s) => s.value > 0);
    const gap = live.length > 1 ? 2 : 0;

    const lens = live.map((s) => (s.value / total) * circ);
    const segments = live.map((s, i) => {
        const dash = Math.max(lens[i] - gap, 0.5);
        const start = lens.slice(0, i).reduce((a, x) => a + x, 0);
        return { ...s, dashArray: `${dash} ${circ - dash}`, offset: -start };
    });

    const active = slices.find((s) => s.label === hover);
    const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

    return (
        <ChartFrame title={title} subtitle={subtitle} tag={tag} aside={aside} empty={total === 0}>
            <div className="flex flex-col sm:flex-row items-center gap-5 h-full">
                <div className="relative shrink-0" style={{ width: size, height: size }}>
                    <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90 w-full h-full">
                        <circle cx={c} cy={c} r={radius} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
                        {segments.map((s) => (
                            <motion.circle
                                key={s.label}
                                cx={c} cy={c} r={radius} fill="none"
                                stroke={s.color} strokeWidth={stroke}
                                strokeDashoffset={s.offset}
                                initial={reduce ? false : { strokeDasharray: `0 ${circ}` }}
                                animate={{ strokeDasharray: s.dashArray, opacity: hover && hover !== s.label ? 0.3 : 1 }}
                                transition={{ duration: 0.9, ease: "circOut", opacity: { duration: 0.15 } }}
                                className="cursor-pointer"
                                onMouseEnter={() => setHover(s.label)}
                                onMouseLeave={() => setHover(null)}
                            >
                                <title>{`${s.label}: ${s.value} (${pct(s.value)}%)`}</title>
                            </motion.circle>
                        ))}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4 text-center">
                        <span className="font-display text-3xl font-extrabold tabular-nums text-foreground leading-none">
                            {active ? active.value : total}
                        </span>
                        <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate max-w-full">
                            {active ? `${pct(active.value)}%` : centerLabel}
                        </span>
                    </div>
                </div>

                <ul className="flex-1 w-full space-y-2.5 min-w-0">
                    {slices.map((s) => (
                        <li
                            key={s.label}
                            className="flex items-center gap-3 text-sm cursor-default"
                            onMouseEnter={() => setHover(s.label)}
                            onMouseLeave={() => setHover(null)}
                        >
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                            <span className={`truncate flex-1 font-semibold ${hover === s.label ? "text-foreground" : "text-foreground/80"}`}>
                                {s.label}
                            </span>
                            <span className="font-bold text-foreground tabular-nums">{s.value}</span>
                            <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">({pct(s.value)}%)</span>
                        </li>
                    ))}
                </ul>
            </div>
        </ChartFrame>
    );
}
