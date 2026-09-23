"use client";

import Link from "next/link";
import { ClipboardCheck, ChevronRight } from "lucide-react";
import { TrendArea } from "@/components/charts";
import { toneFor } from "@/lib/ui/tones";

interface ResultRow {
  id: string;
  score: number;
  total_questions: number;
  status: string | null;
  submitted_at: string;
  tests: { title?: string; job_role: string } | null;
}

const STATE: Record<string, { label: string; color: string }> = {
  pass: { label: "Đạt", color: "var(--success)" },
  fail: { label: "Chưa đạt", color: "var(--danger)" },
};

export default function PersonAssessmentsTab({ results }: { results: ResultRow[] }) {
  if (!results.length) {
    return (
      <div className="flex flex-col items-center py-12 text-center rounded-2xl border border-border bg-card">
        <ClipboardCheck className="w-8 h-8 text-muted-foreground/60 mb-3" />
        <p className="text-sm text-muted-foreground">Chưa có bài đánh giá nào</p>
      </div>
    );
  }

  // page.tsx trả mới nhất trước; đảo lại để đường đi từ cũ đến mới.
  const trend = [...results].filter((r) => r.total_questions > 0).reverse().map((r) => ({
    label: new Date(r.submitted_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
    value: Math.round((r.score / r.total_questions) * 100),
  }));

  return (
    <div className="grid grid-cols-[1fr_1.2fr] gap-4 items-start">
      <TrendArea title="Điểm qua các bài" subtitle="Tỉ lệ đúng, cũ đến mới" tag={{ label: `${trend.length} bài`, tone: "teal" }}
                 points={trend} valueSuffix="%" height={180} />
      <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
        {results.map((r) => {
          const pct = r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0;
          const name = r.tests?.title ?? r.tests?.job_role ?? "Bài test";
          const t = toneFor(r.tests?.job_role ?? name);
          const st = r.status ? STATE[r.status] : null;
          return (
            <Link key={r.id} href={`/dashboard/results/${r.id}`} className="group flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors">
              <span className="w-11 h-11 shrink-0 rounded-xl grid place-items-center text-sm font-black tabular-nums" style={{ color: t.ink, backgroundColor: t.bg }}>
                {pct}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{name}</p>
                <p className="text-xs text-muted-foreground">{new Date(r.submitted_at).toLocaleDateString("vi-VN")} · {r.score}/{r.total_questions} câu đúng</p>
              </div>
              {st && (
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ color: st.color, backgroundColor: `color-mix(in srgb, ${st.color} 12%, var(--card))` }}>{st.label}</span>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
