"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Brain, CheckCircle2, Clock, FileText, Loader2, Play, Send, TrendingDown, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import MiniBar from "@/components/charts/mini-bar";
import { TonePill } from "@/components/shares";
import { flowAt, toneByName, type ToneName } from "@/lib/ui/tones";
import { cn } from "@/lib/utils";
import type { AttentionCandidate, DashboardStats, DashboardTest, MonthlyData, PendingAiResult } from "@/app/dashboard/types";

const MONTHS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

const REASONS: { key: AttentionCandidate["reason"]; title: string; hint: string; tone: ToneName; icon: typeof Clock }[] = [
    { key: "pending_review", title: "Chờ kết luận", hint: "Đã chấm, cần HR quyết Đạt/Không đạt", tone: "orange", icon: Clock },
    { key: "no_ai_analysis", title: "Chưa có AI chấm", hint: "Bài nộp chưa được AI phân tích", tone: "violet", icon: Brain },
    { key: "borderline", title: "Sát ngưỡng", hint: "Điểm quanh mức đạt — nên xem kỹ", tone: "pink", icon: AlertTriangle },
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
        { label: "Lượt nộp", value: stats.totalSubmissions, icon: Send, hint: `${stats.activeTests} đề đang mở` },
        { label: "Chờ AI chấm", value: stats.pendingAiReview, icon: Brain, hint: "chưa có phân tích" },
        { label: "Chờ kết luận", value: stats.pendingReview, icon: Clock, hint: "cần HR quyết định" },
    ];

    return (
        <div className="space-y-6">
            {/* Dòng chảy bài nộp → kết luận */}
            <div className="flex items-stretch gap-3">
                <div className="grid flex-1 grid-cols-3 overflow-hidden rounded-2xl border border-border bg-card">
                    {flow.map((f, i) => {
                        const color = flowAt(i, 4);
                        return (
                            <div key={f.label} className="relative border-l border-border p-5 first:border-l-0">
                                <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: color }} />
                                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                    <f.icon className="h-3.5 w-3.5" style={{ color }} /> {f.label}
                                </div>
                                <p className="mt-2 font-display text-3xl font-black tabular-nums text-foreground">{f.value}</p>
                                <p className="mt-1 text-[11px] text-muted-foreground">{f.hint}</p>
                                {i < flow.length - 1 && (
                                    <ArrowRight className="absolute -right-2 top-1/2 z-10 h-4 w-4 -translate-y-1/2 rounded-full bg-card text-muted-foreground" aria-hidden />
                                )}
                            </div>
                        );
                    })}
                </div>
                {/* Kết luận: đạt / không đạt + tỉ lệ đạt */}
                <div className="w-80 shrink-0 rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Đã kết luận · {decided}</span>
                        {passRate !== null && <TonePill tone={toneByName("teal")}>Tỉ lệ đạt {passRate}%</TonePill>}
                    </div>
                    <div className="mt-3 flex items-end gap-6">
                        <div>
                            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-success"><CheckCircle2 className="h-3.5 w-3.5" />Đạt</p>
                            <p className="font-display text-3xl font-black tabular-nums text-foreground">{stats.passed}</p>
                        </div>
                        <div>
                            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-destructive"><XCircle className="h-3.5 w-3.5" />Không đạt</p>
                            <p className="font-display text-3xl font-black tabular-nums text-foreground">{stats.failed}</p>
                        </div>
                    </div>
                    {decided > 0 && (
                        <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                            <span className="bg-success" style={{ flex: stats.passed }} />
                            <span className="bg-destructive/70" style={{ flex: stats.failed }} />
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6">
                {/* MiniBar tự có khung card (ChartFrame) — không bọc thêm */}
                <div className="min-w-0">
                    <MiniBar
                        title="Kết quả theo tháng"
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
    const nothing = total === 0 && stats.pendingReview === 0 && hardTests.length === 0;

    return (
        <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-bold text-foreground">Việc cần làm</h3>
            <p className="text-xs text-muted-foreground">Các bài nộp và đề đang cần bạn xử lý</p>

            {nothing ? (
                <p className="m-auto py-8 text-center text-sm text-muted-foreground">Không có việc tồn đọng.</p>
            ) : (
                <ul className="mt-4 space-y-3">
                    {total > 0 && (
                        <li className="rounded-xl p-3.5" style={{ backgroundColor: violet.bg }}>
                            <div className="flex items-center gap-3">
                                <Brain className="h-4 w-4 shrink-0" style={{ color: violet.ink }} />
                                <p className="flex-1 text-sm" style={{ color: violet.ink }}>
                                    <b>{total}</b> bài chưa được AI chấm
                                </p>
                                <Button size="sm" onClick={runAiAnalysis} disabled={isRunning} className="gap-1.5">
                                    {isRunning ? <><Loader2 className="animate-spin" />{completed}/{total}</> : <><Play />Chấm tất cả</>}
                                </Button>
                            </div>
                            {isRunning && (
                                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-card">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${(completed / total) * 100}%`, backgroundColor: violet.mark }} />
                                </div>
                            )}
                        </li>
                    )}
                    {stats.pendingReview > 0 && (
                        <li className="flex items-center gap-3 rounded-xl p-3.5" style={{ backgroundColor: orange.bg, color: orange.ink }}>
                            <Clock className="h-4 w-4 shrink-0" />
                            <p className="flex-1 text-sm"><b>{stats.pendingReview}</b> bài chờ kết luận Đạt/Không đạt</p>
                            <a href="#attention" className="text-xs font-bold underline-offset-4 hover:underline">Xem</a>
                        </li>
                    )}
                    {hardTests.map((t) => (
                        <li key={t.id}>
                            <Link href={`/dashboard/tests/${t.id}`} className="flex items-center gap-3 rounded-xl p-3.5 transition hover:opacity-90" style={{ backgroundColor: pink.bg, color: pink.ink }}>
                                <TrendingDown className="h-4 w-4 shrink-0" />
                                <p className="min-w-0 flex-1 text-sm">
                                    <b>{t.rate}%</b> trượt ở <span className="font-semibold">{t.name}</span> — cân nhắc giảm độ khó
                                </p>
                                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function AttentionBoard({ candidates }: { candidates: AttentionCandidate[] }) {
    if (candidates.length === 0) return null;
    return (
        <section id="attention" className="scroll-mt-24">
            <div className="mb-3 flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">Ứng viên cần chú ý</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">{candidates.length}</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
                {REASONS.map((r) => {
                    const items = candidates.filter((c) => c.reason === r.key);
                    const tone = toneByName(r.tone);
                    return (
                        <div key={r.key} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
                            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
                                <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ backgroundColor: tone.bg, color: tone.ink }}>
                                    <r.icon className="h-3.5 w-3.5" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-foreground">{r.title} <span className="text-muted-foreground">· {items.length}</span></p>
                                    <p className="truncate text-[11px] text-muted-foreground">{r.hint}</p>
                                </div>
                            </div>
                            {items.length === 0 ? (
                                <p className="px-4 py-6 text-center text-xs text-muted-foreground">Không có ai</p>
                            ) : (
                                <ul className="max-h-72 divide-y divide-border overflow-y-auto">
                                    {items.map((c) => {
                                        const pct = c.totalQuestions > 0 ? Math.round((c.score / c.totalQuestions) * 100) : 0;
                                        return (
                                            <li key={c.id}>
                                                <Link href={`/dashboard/results/${c.id}`} className="group flex items-center gap-3 px-4 py-2.5 transition hover:bg-muted/50">
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-sm font-semibold text-foreground">{c.candidate_name}</span>
                                                        <span className="flex items-center gap-1 truncate text-[11px] text-muted-foreground"><FileText className="h-3 w-3 shrink-0" />{c.testName}</span>
                                                    </span>
                                                    <span className={cn("shrink-0 text-sm font-bold tabular-nums", pct >= 50 ? "text-foreground" : "text-muted-foreground")}>{pct}%</span>
                                                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
