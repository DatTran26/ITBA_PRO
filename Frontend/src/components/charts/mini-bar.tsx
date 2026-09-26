"use client";

import { motion, useReducedMotion } from "framer-motion";
import ChartFrame from "./chart-frame";
import { colorAt } from "./types";

export interface BarGroup {
    /** Nhãn trục hoành, ví dụ "T1" hoặc "Tuần 3". */
    label: string;
    values: number[];
}

/** Cột nhóm + trục tung 3 mốc. Rút từ components/dashboard/monthly-chart.tsx. */
export default function MiniBar({
    title, groups, series, height = 180, aside,
}: {
    title: string;
    groups: BarGroup[];
    /** Tên và màu của từng chuỗi, theo thứ tự của `values`. */
    series: { label: string; color?: string }[];
    height?: number;
    aside?: React.ReactNode;
}) {
    const reduce = useReducedMotion();
    const max = Math.max(1, ...groups.flatMap((g) => g.values));
    const isEmpty = groups.every((g) => g.values.every((v) => v === 0));

    return (
        <ChartFrame
            title={title}
            empty={isEmpty}
            aside={aside ?? (
                <ul className="flex items-center gap-3">
                    {series.map((s, i) => (
                        <li key={s.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: s.color ?? colorAt(i) }} />
                            {s.label}
                        </li>
                    ))}
                </ul>
            )}
        >
            <div className="flex gap-3 h-full">
                <div className="flex flex-col justify-between text-[10px] text-muted-foreground tabular-nums shrink-0 pb-5"
                     style={{ height }}>
                    <span>{max}</span>
                    <span>{Math.round(max / 2)}</span>
                    <span>0</span>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="relative flex items-end justify-between gap-1" style={{ height }}>
                        {[0, 0.5, 1].map((f) => (
                            <span key={f} aria-hidden
                                  className="absolute inset-x-0 border-t border-border"
                                  style={{ bottom: `${f * 100}%` }} />
                        ))}
                        {groups.map((g) => (
                            <div key={g.label} className="flex-1 flex items-end justify-center gap-0.5 h-full relative">
                                {g.values.map((v, i) => (
                                    <motion.div
                                        key={i}
                                        title={`${series[i]?.label ?? ""}: ${v}`}
                                        className="w-full max-w-2.5 rounded-t-sm"
                                        style={{ backgroundColor: series[i]?.color ?? colorAt(i) }}
                                        initial={reduce ? false : { height: 0 }}
                                        animate={{ height: `${(v / max) * 100}%` }}
                                        transition={{ duration: 0.6, ease: "circOut" }}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between gap-1 mt-1.5">
                        {groups.map((g) => (
                            <span key={g.label}
                                  className="flex-1 text-center text-[10px] text-muted-foreground truncate">
                                {g.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </ChartFrame>
    );
}
