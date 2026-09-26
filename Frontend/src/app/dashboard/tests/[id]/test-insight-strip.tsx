"use client";

import ChartFrame from "@/components/charts/chart-frame";
import { toneAt } from "@/lib/ui/tones";

interface R { score: number; total_questions: number }
interface Q { topic?: string }

const BUCKETS = 10;
const tier = (lo: number) => (lo >= 80 ? "var(--success)" : lo >= 50 ? "var(--warning)" : "var(--danger)");

/** Phân bố điểm ứng viên theo dải 10% + cấu trúc đề theo chủ đề. */
export default function TestInsightStrip({ results, questions }: { results: R[]; questions: Q[] }) {
    const pcts = results.filter((r) => r.total_questions > 0).map((r) => Math.round((r.score / r.total_questions) * 100));
    const bins = Array.from({ length: BUCKETS }, (_, i) => pcts.filter((p) => Math.min(BUCKETS - 1, Math.floor(p / 10)) === i).length);
    const peak = Math.max(1, ...bins);
    const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
    const pass = pcts.filter((p) => p >= 50).length;

    const topics = new Map<string, number>();
    for (const q of questions) topics.set(q.topic || "Khác", (topics.get(q.topic || "Khác") ?? 0) + 1);
    const mix = [...topics].sort((a, b) => b[1] - a[1]);

    return (
        <div className={`grid gap-5 mb-10 items-stretch ${mix.length ? "grid-cols-[1.4fr_1fr]" : "grid-cols-1"}`}>
            <ChartFrame title="Phân bố điểm ứng viên" subtitle="Số ứng viên theo từng dải 10% điểm"
                        tag={{ label: `${pcts.length} bài nộp`, tone: "blue" }}
                        empty={pcts.length === 0} emptyLabel="Chưa có ứng viên nộp bài">
                <div className="flex gap-6 items-end">
                    <div className="flex-1 grid grid-cols-10 gap-1.5 items-end h-36">
                        {bins.map((n, i) => (
                            <div key={i} className="flex flex-col items-center justify-end h-full gap-1" title={`${i * 10}–${i * 10 + 9}%: ${n} ứng viên`}>
                                {n > 0 && <span className="text-[11px] font-bold tabular-nums text-foreground">{n}</span>}
                                <span className="w-full rounded-t-[4px]" style={{ height: `${Math.max(n ? 8 : 3, (n / peak) * 100)}%`, backgroundColor: n ? tier(i * 10) : "var(--muted)" }} />
                                <span className="text-[10px] tabular-nums text-muted-foreground">{i * 10}</span>
                            </div>
                        ))}
                    </div>
                    <div className="w-36 shrink-0 space-y-2">
                        {[["Điểm TB", `${avg}%`, "var(--primary)"], ["Đạt ≥ 50%", `${pass}/${pcts.length}`, "var(--success)"]].map(([label, v, c]) => (
                            <div key={label} className="rounded-xl px-3 py-2.5" style={{ backgroundColor: `color-mix(in srgb, ${c} 9%, var(--card))` }}>
                                <p className="text-xl font-black leading-none tabular-nums text-foreground">{v}</p>
                                <p className="mt-1 text-[11px] font-semibold whitespace-nowrap" style={{ color: c }}>{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </ChartFrame>

            {mix.length > 0 && (
                <ChartFrame title="Cấu trúc đề" subtitle="Số câu theo chủ đề" tag={{ label: `${questions.length} câu`, tone: "violet" }}>
                    <div className="flex h-3 rounded-full overflow-hidden gap-[2px]">
                        {mix.map(([name, n], i) => (
                            <span key={name} style={{ width: `${(n / questions.length) * 100}%`, backgroundColor: toneAt(i).mark }} title={`${name}: ${n}`} />
                        ))}
                    </div>
                    <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                        {mix.map(([name, n], i) => (
                            <li key={name} className="flex items-center gap-2 text-sm min-w-0">
                                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: toneAt(i).mark }} />
                                <span className="truncate font-semibold text-foreground">{name}</span>
                                <span className="ml-auto tabular-nums text-xs text-muted-foreground">{n}</span>
                            </li>
                        ))}
                    </ul>
                </ChartFrame>
            )}
        </div>
    );
}
