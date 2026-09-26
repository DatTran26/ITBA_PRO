"use client";

import ChartFrame from "@/components/charts/chart-frame";
import { toneAt } from "@/lib/ui/tones";

interface Q { id: string; topic: string; grading_mode?: "auto" | "manual" }
interface A { question_id: string; is_correct: boolean }
interface G { question_id: string; is_correct: boolean | null }

type State = "right" | "wrong" | "pending" | "blank";
const STATE: Record<State, { label: string; color: string }> = {
    right: { label: "Đúng", color: "var(--success)" },
    wrong: { label: "Sai", color: "var(--danger)" },
    pending: { label: "Chờ chấm", color: "var(--warning)" },
    blank: { label: "Bỏ trống", color: "var(--muted-foreground)" },
};

/** Điểm theo chủ đề + lưới câu hỏi tô theo kết quả; bấm ô để cuộn tới câu đó. */
export default function ResultScoreMap({ questions, answers, grades }: { questions: Q[]; answers: A[]; grades: G[] }) {
    const states = questions.map((q, i): State => {
        if (q.grading_mode === "manual") {
            const g = grades.find((x) => x.question_id === q.id)?.is_correct;
            return g === true ? "right" : g === false ? "wrong" : "pending";
        }
        const a = answers.find((x) => x.question_id === q.id) ?? answers[i];
        return !a ? "blank" : a.is_correct ? "right" : "wrong";
    });

    const topics = new Map<string, { right: number; total: number }>();
    questions.forEach((q, i) => {
        const t = topics.get(q.topic || "Khác") ?? { right: 0, total: 0 };
        t.total++;
        if (states[i] === "right") t.right++;
        topics.set(q.topic || "Khác", t);
    });
    const counts = (Object.keys(STATE) as State[]).map((s) => [s, states.filter((x) => x === s).length] as const);

    return (
        <div className="grid grid-cols-[1fr_1fr] gap-5 mb-8 items-stretch">
            <ChartFrame title="Điểm theo chủ đề" subtitle="Tỷ lệ câu đúng trong từng chủ đề của bài test"
                        tag={{ label: `${topics.size} chủ đề`, tone: "violet" }} empty={topics.size === 0}>
                <ul className="space-y-3">
                    {[...topics].map(([name, t], i) => {
                        const pct = Math.round((t.right / t.total) * 100);
                        const tone = toneAt(i);
                        return (
                            <li key={name}>
                                <div className="flex items-center justify-between gap-2 text-sm">
                                    <span className="inline-flex items-center gap-2 font-bold text-foreground truncate">
                                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: tone.mark }} />{name}
                                    </span>
                                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                        <span className="font-bold text-foreground">{t.right}</span>/{t.total} · {pct}%
                                    </span>
                                </div>
                                <div className="mt-1.5 h-2 rounded-full overflow-hidden" style={{ backgroundColor: tone.bg }}>
                                    <span className="block h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: tone.mark }} />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </ChartFrame>

            <ChartFrame title="Bản đồ câu hỏi" subtitle="Bấm một ô để tới câu đó trong phần chi tiết"
                        tag={{ label: `${questions.length} câu`, tone: "blue" }} empty={questions.length === 0}>
                <div className="flex flex-wrap gap-1.5">
                    {questions.map((q, i) => (
                        <a key={q.id} href={`#q-${q.id}`} title={`Câu ${i + 1} · ${q.topic} · ${STATE[states[i]].label}`}
                           className="w-9 h-9 rounded-lg grid place-items-center text-xs font-black tabular-nums hover:scale-110 transition-transform"
                           style={states[i] === "blank"
                               ? { color: STATE.blank.color, border: "1.5px dashed var(--border)" }
                               : { color: "#fff", backgroundColor: STATE[states[i]].color }}>
                            {i + 1}
                        </a>
                    ))}
                </div>
                <div className="mt-auto pt-5 grid grid-cols-4 gap-2">
                    {counts.map(([s, n]) => (
                        <div key={s} className="rounded-xl px-3 py-2" style={{ backgroundColor: `color-mix(in srgb, ${STATE[s].color} 10%, var(--card))` }}>
                            <p className="text-lg font-black leading-none tabular-nums text-foreground">{n}</p>
                            <p className="mt-1 text-[11px] font-semibold whitespace-nowrap" style={{ color: STATE[s].color }}>{STATE[s].label}</p>
                        </div>
                    ))}
                </div>
            </ChartFrame>
        </div>
    );
}
