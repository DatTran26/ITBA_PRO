"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Brain, CheckCircle2, Clock, FileText, Loader2, Play, Send, TrendingDown, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import MiniBar from "@/components/charts/mini-bar";
import ChartFrame from "@/components/charts/chart-frame";
import { ActionRow, KpiTile } from "./dash-kit";
import { toneByName, toneFor, type ToneName } from "@/lib/ui/tones";
import { cn } from "@/lib/utils";
import type { AttentionCandidate, DashboardStats, DashboardTest, MonthlyData, PendingAiResult } from "@/app/dashboard/types";

const MONTHS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

const REASONS: { key: AttentionCandidate["reason"]; title: string; hint: string; tone: ToneName; icon: typeof Clock }[] = [
    { key: "pending_review", title: "Chờ Kết Luận", hint: "Đã chấm, cần HR quyết Đạt/Không đạt", tone: "orange", icon: Clock },
    { key: "no_ai_analysis", title: "Chưa Có AI Chấm", hint: "Bài nộp chưa được AI phân tích", tone: "violet", icon: Brain },
    { key: "borderline", title: "Sát Ngưỡng", hint: "Điểm quanh mức đạt — nên xem kỹ", tone: "pink", icon: AlertTriangle },
];

interface Props {
    stats: DashboardStats;
    tests: DashboardTest[];
    monthlyData: MonthlyData[];
    attentionCandidates: AttentionCandidate[];
    pendingAiResults: PendingAiResult[];
}

/** Tab Recruitment của /dashboard: một dòng chảy bài nộp (mỗi số xuất hiện đúng một lần),
 *  biểu đồ tháng, hàng việc cần làm có hành động thật, và ứng viên cần chú ý theo lý do. */
export default function RecruitmentOverview({ stats, tests, monthlyData, attentionCandidates, pendingAiResults }: Props) {
    const decided = stats.passed + stats.failed;
    const passRate = decided > 0 ? Math.round((stats.passed / decided) * 100) : null;

    // Bỏ các tháng trống ở cuối (tháng chưa tới) để trục không kéo dài vô ích.
    let last = monthlyData.length - 1;
    while (last >= 0 && monthlyData[last].passed + monthlyData[last].failed === 0) last--;
    const months = monthlyData.slice(0, last + 1);

    const flow = [
        { label: "Lượt nộp", value: stats.totalSubmissions, icon: Send, tone: toneByName("blue"), pill: `${stats.activeTests} đề đang mở` },
        { label: "Chờ AI chấm", value: stats.pendingAiReview, icon: Brain, tone: toneByName("violet"), pill: "Chưa phân tích" },
        { label: "Chờ kết luận", value: stats.pendingReview, icon: Clock, tone: toneByName("orange"), pill: "Cần HR quyết" },
    ];

    return (
        <div className="space-y-5">
            {/* Dòng chảy bài nộp → kết luận: 3 thẻ nối bằng mũi tên + khối kết luận */}
            <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.35fr)] items-start gap-3.5">
                {flow.map((f, i) => (
                    <div key={f.label} className="relative">
                        <KpiTile label={f.label} value={f.value} icon={f.icon} tone={f.tone} pill={f.pill} />
                        {i < flow.length - 1 && (
                            <span className="absolute -right-[13px] top-1/2 z-10 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-muted-foreground" aria-hidden>
                                <ArrowRight className="h-3 w-3" />
                            </span>
                        )}
                    </div>
                ))}
                <ChartFrame
                    className="h-auto"
                    title="Đã Kết Luận"
                    subtitle={`${decided} bài đã có kết quả`}
                    tag={passRate !== null ? { label: `Tỉ lệ đạt ${passRate}%`, tone: "teal" } : undefined}
                >
                    <div className="flex items-end gap-8">
                        <div>
                            <p className="flex items-center gap-1.5 text-xs font-bold text-success"><CheckCircle2 className="h-3.5 w-3.5" />Đạt</p>
                            <p className="text-[28px] font-extrabold leading-none tabular-nums text-foreground">{stats.passed}</p>
                        </div>
                        <div>
                            <p className="flex items-center gap-1.5 text-xs font-bold text-destructive"><XCircle className="h-3.5 w-3.5" />Không đạt</p>
                            <p className="text-[28px] font-extrabold leading-none tabular-nums text-foreground">{stats.failed}</p>
                        </div>
                    </div>
                    {decided > 0 && (
                        <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                            <span className="rounded-full bg-success" style={{ flex: stats.passed }} />
                            <span className="rounded-full bg-destructive/70" style={{ flex: stats.failed }} />
                        </div>
                    )}
                </ChartFrame>
            </div>

            <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-5">
                {/* MiniBar tự có khung card (ChartFrame) — không bọc thêm */}
                <div className="min-w-0">
                    <MiniBar
                        title="Kết Quả Theo Tháng"
                        height={200}
                        series={[
                            { label: "Đạt", color: "var(--success)" },
                            { label: "Không đạt", color: "color-mix(in srgb, var(--destructive) 70%, transparent)" },
                        ]}
                        groups={months.map((d) => ({ label: MONTHS[d.month] ?? String(d.month + 1), values: [d.passed, d.failed] }))}
                    />
                </div>
                <TodoPanel stats={stats} tests={tests} pendingAiResults={pendingAiResults} />
            </div>

            <AttentionBoard candidates={attentionCandidates} />
        </div>
    );
}

function TodoPanel({ stats, tests, pendingAiResults }: { stats: DashboardStats; tests: DashboardTest[]; pendingAiResults: PendingAiResult[] }) {
    const [isRunning, setIsRunning] = useState(false);
    const [completed, setCompleted] = useState(0);
    const total = pendingAiResults.length;

    async function runAiAnalysis() {
        if (total === 0) return;
        setIsRunning(true);
        setCompleted(0);
        let ok = 0, fail = 0;
        for (const item of pendingAiResults) {
            try {
                const res = await fetch("/api/ai/analyze-result", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ result_id: item.id }),
                });
                if (res.ok) ok++; else fail++;
            } catch { fail++; }
            setCompleted((p) => p + 1);
        }
        setIsRunning(false);
        if (fail === 0) toast.success(`AI đã chấm xong ${ok} bài`);
        else toast.warning(`Xong ${ok}, lỗi ${fail}`);
    }

    const hardTests = tests
        .filter((t) => t.resultCount >= 3 && t.failCount / t.resultCount > 0.7)
        .map((t) => ({ id: t.id, name: t.title || t.job_role, rate: Math.round((t.failCount / t.resultCount) * 100) }))
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 3);

    const violet = toneByName("violet"), orange = toneByName("orange"), pink = toneByName("pink");
    const count = (total > 0 ? 1 : 0) + (stats.pendingReview > 0 ? 1 : 0) + hardTests.length;

    return (
        <ChartFrame
            title="Việc Cần Làm"
            subtitle="Bài nộp và đề đang chờ bạn xử lý"
            tag={count > 0 ? { label: `${count} việc`, tone: "pink" } : undefined}
            empty={count === 0}
            emptyLabel="Không có việc tồn đọng"
        >
            <div className="space-y-2.5">
                {total > 0 && (
                    <div>
                        <ActionRow
                            icon={Brain}
                            tone={violet}
                            title={`${total} bài chưa được AI chấm`}
                            sub="Chấm hàng loạt để có điểm phân tích"
                            action={
                                <Button size="sm" onClick={runAiAnalysis} disabled={isRunning} className="gap-1.5">
                                    {isRunning ? <><Loader2 className="animate-spin" />{completed}/{total}</> : <><Play />Chấm tất cả</>}
                                </Button>
                            }
                        />
                        {isRunning && (
                            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                                <div className="h-full rounded-full transition-all" style={{ width: `${(completed / total) * 100}%`, backgroundColor: violet.mark }} />
                            </div>
                        )}
                    </div>
                )}
                {stats.pendingReview > 0 && (
                    <ActionRow icon={Clock} tone={orange} title={`${stats.pendingReview} bài chờ kết luận`} sub="Quyết Đạt / Không đạt" pill="Ưu tiên" href="#attention" />
                )}
                {hardTests.map((t) => (
                    <ActionRow key={t.id} icon={TrendingDown} tone={pink} title={`${t.rate}% trượt · ${t.name}`} sub="Cân nhắc giảm độ khó của đề" href={`/dashboard/tests/${t.id}`} />
                ))}
            </div>
        </ChartFrame>
    );
}

function AttentionBoard({ candidates }: { candidates: AttentionCandidate[] }) {
    if (candidates.length === 0) return null;
    return (
        <section id="attention" className="scroll-mt-24 grid grid-cols-3 gap-5">
            {REASONS.map((r) => {
                const items = candidates.filter((c) => c.reason === r.key);
                return (
                    <ChartFrame
                        key={r.key}
                        title={r.title}
                        subtitle={r.hint}
                        tag={{ label: `${items.length} người`, tone: r.tone }}
                        empty={items.length === 0}
                        emptyLabel="Không có ai"
                    >
                        <ul className="-mx-1 max-h-72 space-y-0.5 overflow-y-auto">
                            {items.map((c) => {
                                const pct = c.totalQuestions > 0 ? Math.round((c.score / c.totalQuestions) * 100) : 0;
                                const av = toneFor(c.candidate_name);
                                const initials = c.candidate_name.split(/\s+/).filter(Boolean).slice(-2).map((w) => w[0]).join("").toUpperCase();
                                return (
                                    <li key={c.id}>
                                        <Link href={`/dashboard/results/${c.id}`} className="group flex items-center gap-3 rounded-xl px-1 py-2 transition hover:bg-muted/60">
                                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold" style={{ backgroundColor: av.bg, color: av.ink }}>{initials}</span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-bold text-foreground">{c.candidate_name}</span>
                                                <span className="flex items-center gap-1 truncate text-xs text-muted-foreground"><FileText className="h-3 w-3 shrink-0" />{c.testName}</span>
                                            </span>
                                            <span className={cn("shrink-0 text-sm font-extrabold tabular-nums", pct >= 50 ? "text-foreground" : "text-muted-foreground")}>{pct}%</span>
                                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </ChartFrame>
                );
            })}
        </section>
    );
}
