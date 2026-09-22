"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck } from "lucide-react";

interface ResultRow {
  id: string;
  score: number;
  total_questions: number;
  status: string | null;
  submitted_at: string;
  tests: { title?: string; job_role: string } | null;
}

interface Props {
  results: ResultRow[];
}

const STATUS_COLORS: Record<string, string> = {
  pass: "border-border/30 text-success",
  fail: "border-red-400/30 text-red-400",
};

export default function PersonAssessmentsTab({ results }: Props) {
  if (!results.length) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="w-10 h-10 rounded-xl bg-accent border border-border/10 flex items-center justify-center mb-3">
          <ClipboardCheck className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No assessments yet</p>
      </div>
    );
  }

  return (
    <Card className="bg-muted border-border/10 p-4">
      <h3 className="text-sm font-medium text-foreground mb-3">Assessment History ({results.length})</h3>
      <div className="space-y-1.5">
        {results.map((r) => {
          const pct = r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0;
          return (
            <Link key={r.id} href={`/dashboard/results/${r.id}`} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background hover:bg-accent transition-colors group">
              <div>
                <p className="text-sm text-foreground group-hover:text-foreground">{r.tests?.title ?? r.tests?.job_role ?? "Test"}</p>
                <p className="text-xs text-muted-foreground">{new Date(r.submitted_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">{pct}%</span>
                {r.status && (
                  <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[r.status] ?? "border-border/20 text-muted-foreground"}`}>
                    {r.status}
                  </Badge>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
