"use client";

import Sparkline from "@/components/charts/sparkline";

interface Props {
    data: { date: string; tokens: number; cost: number }[];
}

/** Bọc mỏng quanh Sparkline, giữ nguyên props. */
export default function TokenUsageChart({ data }: Props) {
    const points = data.slice(-30);
    return (
        <Sparkline
            title="Token dùng trong 30 ngày"
            color="var(--ai)"
            points={points.map((d) => ({
                // "2026-09-17" -> "17/09"
                label: d.date.slice(8, 10) + "/" + d.date.slice(5, 7),
                value: d.tokens,
            }))}
            formatValue={(v) => v.toLocaleString("vi-VN")}
        />
    );
}
