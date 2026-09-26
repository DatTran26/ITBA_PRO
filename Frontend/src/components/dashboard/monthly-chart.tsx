"use client";

import { FadeIn } from "@/components/ui/motion-wrapper";
import MiniBar from "@/components/charts/mini-bar";
import type { MonthlyData } from "@/app/dashboard/types";

const MONTHS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

/** Bọc mỏng quanh MiniBar, giữ nguyên props. */
export default function MonthlyChart({ data }: { data: MonthlyData[] }) {
    return (
        <FadeIn delay={0.1} className="h-full">
            <MiniBar
                title="Kết quả theo tháng"
                series={[
                    { label: "Đạt", color: "var(--success)" },
                    { label: "Không đạt", color: "var(--danger)" },
                ]}
                groups={data.map((d) => ({
                    label: MONTHS[d.month] ?? String(d.month + 1),
                    values: [d.passed, d.failed],
                }))}
            />
        </FadeIn>
    );
}
