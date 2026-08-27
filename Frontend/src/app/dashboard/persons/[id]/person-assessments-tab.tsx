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
  pass: "border-[#50FA7B]/30 text-[#50FA7B]",
  fail: "border-red-400/30 text-red-400",
};

export default function PersonAssessmentsTab({ results }: Props) {
  if (!results.length) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="w-10 h-10 rounded-xl bg-[#222C4A] border border-[#8B99B0]/10 flex items-center justify-center mb-3">
          <ClipboardCheck className="w-5 h-5 text-[#5A6882]" />
        </div>
        <p className="text-sm text-[#5A6882]">No assessments yet</p>
      </div>
    );
  }

  return (
    <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-4">
      <h3 className="text-sm font-medium text-[#ECF0F7] mb-3">Assessment History ({results.length})</h3>
      <div className="space-y-1.5">
        {results.map((r) => {
          const pct = r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0;
          return (
            <Link key={r.id} href={`/dashboard/results/${r.id}`} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0A0F1A] hover:bg-[#222C4A] transition-colors group">
              <div>
                <p className="text-sm text-[#ECF0F7] group-hover:text-white">{r.tests?.title ?? r.tests?.job_role ?? "Test"}</p>
                <p className="text-xs text-[#5A6882]">{new Date(r.submitted_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[#ECF0F7]">{pct}%</span>
                {r.status && (
                  <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[r.status] ?? "border-[#8B99B0]/20 text-[#8B99B0]"}`}>
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
