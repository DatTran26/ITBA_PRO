"use client";

import { Award, ClipboardCheck, Hourglass, Target } from "lucide-react";
import ChartFrame from "@/components/charts/chart-frame";
import MiniBar from "@/components/charts/mini-bar";
import { TonePill } from "@/components/shares";
import { KpiTile } from "./dash-kit";
import { flowAt, toneAt, toneByName } from "@/lib/ui/tones";
import type { EmployeeStats, MonthlyData, PipelineStage, SkillGapItem } from "@/app/dashboard/types";

const MONTHS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
const STAGE_VI: Record<string, string> = {
    "Test Completed": "Đã làm bài",
    "Skills Assessed": "Đã chấm kỹ năng",
    "Level Confirmed": "Đã xác nhận cấp độ",
};
const SCALE = 5;

interface Props {
    stats: EmployeeStats | null;
    pipeline: PipelineStage[];
    monthlyData: MonthlyData[];
    skillGaps: SkillGapItem[];
}

/** Tab Employee: bản đồ kỹ năng (điểm TB so với mức yêu cầu) là khối chính bên trái;
 *  rail phải gồm KPI, tiến trình đánh giá và kết quả theo tháng. */
export default function EmployeeOverview({ stats, pipeline, monthlyData, skillGaps }: Props) {
    const gaps = [...skillGaps].sort((a, b) => b.gapSize - a.gapSize);
    const short = gaps.filter((g) => g.gapSize > 0).length;
    // Tông theo thứ tự nhóm (không băm tên — băm từng va chạm, 2 nhóm ra cùng màu).
    const cats = [...new Set(gaps.map((g) => g.category ?? "Khác"))];
    const catTone = (c: string | null) => toneAt(cats.indexOf(c ?? "Khác"));

    let last = monthlyData.length - 1;
    while (last >= 0 && monthlyData[last].passed + monthlyData[last].failed === 0) last--;
    const months = monthlyData.slice(0, last + 1);

    const stageMax = Math.max(1, ...pipeline.map((p) => p.count));

    return (
        <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-start gap-5">
            <ChartFrame
                className="h-auto"
                title="Bản Đồ Kỹ Năng"
                subtitle="Điểm trung bình của nhân viên so với mức vị trí yêu cầu (thang 5)"
                tag={{ label: `${short} kỹ năng thiếu`, tone: short > 0 ? "pink" : "teal" }}
                empty={gaps.length === 0}
                emptyLabel="Chưa có đánh giá kỹ năng"
            >
                <div className="mb-3 flex items-center gap-4 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-primary/70" />Điểm TB</span>
                    <span className="inline-flex items-center gap-1.5"><span className="h-3 w-0.5 rounded bg-foreground" />Mức yêu cầu</span>
                </div>
                <ul className="space-y-3">
                    {gaps.map((g) => {
                        const tone = catTone(g.category);
                        const behind = g.gapSize > 0;
                        return (
                            <li key={`${g.skillName}-${g.category}`} className="grid grid-cols-[11rem_minmax(0,1fr)_4.5rem] items-center gap-4">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-foreground" title={g.skillName}>{g.skillName}</p>
                                    <TonePill tone={tone} className="mt-0.5 px-2 py-0 text-[10px]">{g.category ?? "Khác"}</TonePill>
                                </div>
                                <div className="relative h-3 rounded-full bg-muted" title={`${g.avgScore.toFixed(1)} / yêu cầu ${g.requiredLevel}`}>
                                    <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(g.avgScore / SCALE) * 100}%`, backgroundColor: tone.mark, opacity: 0.8 }} />
                                    <span className="absolute -inset-y-1 w-0.5 rounded bg-foreground" style={{ left: `calc(${(g.requiredLevel / SCALE) * 100}% - 1px)` }} />
                                </div>
                                <div className="text-right">
                                    <p className={behind ? "text-sm font-extrabold tabular-nums text-destructive" : "text-sm font-extrabold tabular-nums text-success"}>
                                        {behind ? `−${g.gapSize.toFixed(1)}` : "Đạt"}
                                    </p>
                                    <p className="text-[11px] tabular-nums text-muted-foreground">{g.avgScore.toFixed(1)}/{g.requiredLevel} · {g.evaluationCount} lượt</p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </ChartFrame>

            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3.5">
                    <KpiTile label="Đã đánh giá" value={stats?.employeesEvaluated ?? 0} icon={ClipboardCheck} tone={toneByName("blue")}
                        pill={stats ? `Hoàn thành ${Math.round(stats.evaluationCompletion)}%` : undefined} />
                    <KpiTile label="Chờ đánh giá" value={stats?.pendingEvaluations ?? 0} icon={Hourglass} tone={toneByName("orange")} pill="Cần xử lý" />
                    <KpiTile label="Điểm kỹ năng TB" value={stats?.avgSkillScore != null ? stats.avgSkillScore.toFixed(1) : "—"} icon={Award} tone={toneByName("violet")} pill="Thang 5" />
                    <KpiTile label="Vị trí thiếu KN" value={stats?.positionsWithGaps ?? 0} icon={Target} tone={toneByName("pink")} pill="Cần đào tạo" />
                </div>

                <ChartFrame title="Tiến Trình Đánh Giá" subtitle="Nhân viên qua từng bước" tag={{ label: "Pipeline", tone: "blue" }} empty={pipeline.length === 0}>
                    <ul className="space-y-3">
                        {pipeline.map((p, i) => {
                            const color = flowAt(i, pipeline.length);
                            return (
                                <li key={p.label}>
                                    <div className="mb-1 flex items-center justify-between text-xs">
                                        <span className="font-bold text-foreground">{STAGE_VI[p.label] ?? p.label}</span>
                                        <span className="font-extrabold tabular-nums text-foreground">{p.count}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full rounded-full" style={{ width: `${(p.count / stageMax) * 100}%`, backgroundColor: color }} />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </ChartFrame>

                <MiniBar
                    title="Kết Quả Theo Tháng"
                    height={150}
                    series={[
                        { label: "Đạt", color: "var(--success)" },
                        { label: "Không đạt", color: "color-mix(in srgb, var(--destructive) 70%, transparent)" },
                    ]}
                    groups={months.map((d) => ({ label: MONTHS[d.month] ?? String(d.month + 1), values: [d.passed, d.failed] }))}
                />
            </div>
        </div>
    );
}
