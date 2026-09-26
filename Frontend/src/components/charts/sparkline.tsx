"use client";

import ChartFrame from "./chart-frame";

/** Dải cột mảnh theo thời gian. Rút từ components/dashboard/token-usage-chart.tsx.
 *  Không có trục: dùng để thấy xu hướng, không để đọc giá trị chính xác. */
export default function Sparkline({
    title, points, color = "var(--primary)", height = 72, aside, formatValue,
}: {
    title: string;
    points: { label: string; value: number }[];
    color?: string;
    height?: number;
    aside?: React.ReactNode;
    formatValue?: (v: number) => string;
}) {
    const max = Math.max(1, ...points.map((p) => p.value));
    const total = points.reduce((s, p) => s + p.value, 0);
    const fmt = formatValue ?? ((v: number) => String(v));

    return (
        <ChartFrame
            title={title}
            empty={points.length === 0 || total === 0}
            aside={aside ?? (
                <span className="font-display text-lg font-bold tabular-nums text-foreground">
                    {fmt(total)}
                </span>
            )}
        >
            <div className="flex flex-col justify-end h-full gap-2">
                <div className="flex items-end gap-px" style={{ height }}>
                    {points.map((p) => (
                        <span
                            key={p.label}
                            title={`${p.label}: ${fmt(p.value)}`}
                            className="flex-1 rounded-t-[2px] min-h-px"
                            style={{
                                height: `${Math.max(2, (p.value / max) * 100)}%`,
                                backgroundColor: color,
                                // Cột cũ nhạt dần để mắt bám vào phần gần đây nhất.
                                opacity: 0.45,
                            }}
                        />
                    ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{points[0]?.label}</span>
                    <span>{points[points.length - 1]?.label}</span>
                </div>
            </div>
        </ChartFrame>
    );
}
