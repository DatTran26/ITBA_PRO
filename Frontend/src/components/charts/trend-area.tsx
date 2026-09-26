"use client";

import { useId, useState } from "react";
import ChartFrame, { type ChartTag } from "./chart-frame";
import { CHART_COLORS } from "./types";

export interface TrendPoint {
    label: string;
    value: number;
}

const W = 300;
const H = 100;
const PAD = 8;

/** Đường xu hướng + vùng tô (kiểu "Xu hướng hồ sơ hàng tháng" của dashboard HR).
 *  Một series → không cần chú giải, tiêu đề gọi tên nó. Hover: đường dọc + tooltip.
 *  SVG co giãn ngang (`preserveAspectRatio="none"` + non-scaling-stroke); điểm và
 *  tooltip vẽ bằng HTML theo % để không bị méo. */
export default function TrendArea({
    title, subtitle, tag, points, color = CHART_COLORS[0], valueSuffix = "", height = 120,
}: {
    title: string;
    subtitle?: string;
    tag?: ChartTag;
    points: TrendPoint[];
    color?: string;
    valueSuffix?: string;
    height?: number;
}) {
    const gid = useId();
    const [hover, setHover] = useState<number | null>(null);
    const peak = Math.max(1, ...points.map((p) => p.value));
    const n = points.length;

    const xy = points.map((p, i) => ({
        x: n === 1 ? W / 2 : PAD + (i / (n - 1)) * (W - PAD * 2),
        y: H - PAD - (p.value / peak) * (H - PAD * 2),
    }));
    // Cubic nối điểm giữa: mượt nhưng không vượt đỉnh thật quá nhiều.
    const line = xy.map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = xy[i - 1];
        const mx = (prev.x + p.x) / 2;
        return `C ${mx} ${prev.y} ${mx} ${p.y} ${p.x} ${p.y}`;
    }).join(" ");
    const area = n ? `${line} L ${xy[n - 1].x} ${H} L ${xy[0].x} ${H} Z` : "";
    const tickEvery = Math.max(1, Math.ceil(n / 6));
    const active = hover !== null ? points[hover] : null;

    return (
        <ChartFrame
            title={title}
            subtitle={subtitle}
            tag={tag}
            aside={active ? (
                <span className="shrink-0 text-xs font-bold tabular-nums" style={{ color }}>
                    {active.label}: {active.value}{valueSuffix}
                </span>
            ) : undefined}
            empty={n === 0 || points.every((p) => p.value === 0)}
        >
            <div className="relative w-full" style={{ height }} onMouseLeave={() => setHover(null)}>
                <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {[0.25, 0.5, 0.75].map((f) => (
                        <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke="var(--border)"
                              strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                    ))}
                    <line x1={0} x2={W} y1={H} y2={H} stroke="var(--border)" vectorEffect="non-scaling-stroke" />
                    <path d={area} fill={`url(#${gid})`} />
                    <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"
                          vectorEffect="non-scaling-stroke" />
                    {hover !== null && (
                        <line x1={xy[hover].x} x2={xy[hover].x} y1={0} y2={H} stroke={color}
                              strokeOpacity={0.35} vectorEffect="non-scaling-stroke" />
                    )}
                </svg>

                {xy.map((p, i) => (
                    <span
                        key={i}
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-card transition-all duration-150 pointer-events-none"
                        style={{
                            left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%`,
                            width: hover === i ? 10 : 8, height: hover === i ? 10 : 8,
                            borderColor: color, backgroundColor: hover === i ? color : undefined,
                        }}
                    />
                ))}

                {/* Vùng bắt hover rộng hơn điểm (dataviz: hit target > mark). */}
                <div className="absolute inset-0 flex">
                    {points.map((p, i) => (
                        <div key={i} className="flex-1 h-full cursor-crosshair" title={`${p.label}: ${p.value}${valueSuffix}`}
                             onMouseEnter={() => setHover(i)} />
                    ))}
                </div>
            </div>

            <div className="relative mt-2 h-4 text-[10px] font-semibold text-muted-foreground tabular-nums">
                {points.map((p, i) => (i % tickEvery === 0 || i === n - 1) && (
                    <span key={i} className="absolute -translate-x-1/2 whitespace-nowrap"
                          style={{ left: `${(xy[i].x / W) * 100}%` }}>
                        {p.label}
                    </span>
                ))}
            </div>
        </ChartFrame>
    );
}
