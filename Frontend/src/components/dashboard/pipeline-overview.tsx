"use client";

import { FadeIn } from "@/components/ui/motion-wrapper";
import DonutStat from "@/components/charts/donut-stat";
import type { PipelineStage } from "@/app/dashboard/types";

/** Bọc mỏng quanh DonutStat, giữ nguyên props để các chỗ gọi cũ không phải sửa.
 *
 *  Bản trước còn một dải "Conversion 68% / Velocity 4.2 days / AI Match 92% /
 *  Drop-off 12%" viết cứng trong JSX, không đọc từ dữ liệu nào. Đã bỏ: hiển thị
 *  số bịa nguy hiểm hơn là không hiển thị gì. */
export default function PipelineOverview({
    stages,
    title = "Tiến trình tuyển dụng",
}: {
    stages: PipelineStage[];
    title?: string;
}) {
    return (
        <FadeIn delay={0.15} className="h-full">
            <DonutStat
                title={title}
                centerLabel="Tổng"
                slices={stages.map((s) => ({
                    label: s.label,
                    value: s.count,
                    color: s.color,
                }))}
            />
        </FadeIn>
    );
}
