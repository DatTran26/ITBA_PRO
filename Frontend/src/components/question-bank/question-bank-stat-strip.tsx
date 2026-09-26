"use client";

import { BookOpen, Tag } from "lucide-react";

interface Kpis {
  total: number;
  junior: number;
  middle: number;
  senior: number;
  topics: number;
}

interface Props {
  kpis: Kpis;
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

interface LevelCellProps {
  label: string;
  count: number;
  percent: number;
  barColor: string;
  textColor: string;
  dotColor: string;
}

function LevelCell({ label, count, percent, barColor, textColor, dotColor }: LevelCellProps) {
  return (
    <div className="flex-1 px-5 py-4 border-l border-border min-w-0">
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
        <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className={`text-2xl font-extralight tracking-tight ${textColor}`}>{count.toLocaleString()}</span>
        <span className="text-xs text-muted-foreground">{percent}%</span>
      </div>
      <div className="h-0.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-700`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function QuestionBankStatStrip({ kpis }: Props) {
  const { total, junior, middle, senior, topics } = kpis;
  const juniorPct = pct(junior, total);
  const middlePct = pct(middle, total);
  const seniorPct = pct(senior, total);

  return (
    <div className="flex rounded-xl border border-border bg-muted/40 backdrop-blur-sm overflow-hidden">
      {/* Total */}
      <div className="px-5 py-4 flex flex-col justify-between min-w-[120px]">
        <div className="flex items-center gap-1.5 mb-2">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Total</span>
        </div>
        <span className="text-3xl font-extralight tracking-tight text-foreground">{total.toLocaleString()}</span>
        <span className="text-[10px] text-muted-foreground mt-1">questions</span>
      </div>

      <LevelCell
        label="Junior"
        count={junior}
        percent={juniorPct}
        dotColor="bg-green-400"
        textColor="text-green-400"
        barColor="bg-green-400"
      />
      <LevelCell
        label="Middle"
        count={middle}
        percent={middlePct}
        dotColor="bg-yellow-400"
        textColor="text-yellow-400"
        barColor="bg-yellow-400"
      />
      <LevelCell
        label="Senior"
        count={senior}
        percent={seniorPct}
        dotColor="bg-red-400"
        textColor="text-red-400"
        barColor="bg-red-400"
      />

      {/* Topics */}
      <div className="px-5 py-4 border-l border-border flex flex-col justify-between min-w-[100px]">
        <div className="flex items-center gap-1.5 mb-2">
          <Tag className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Topics</span>
        </div>
        <span className="text-3xl font-extralight tracking-tight text-foreground">{topics.toLocaleString()}</span>
        <span className="text-[10px] text-muted-foreground mt-1">unique</span>
      </div>
    </div>
  );
}
