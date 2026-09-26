"use client";

import { CheckCircle2, AlertCircle, Copy } from "lucide-react";
import type { ImportResult } from "./question-bank-types";

interface Props {
  result: ImportResult;
}

export default function ImportResultReport({ result }: Props) {
  const { inserted, duplicates, errors } = result;
  const total = inserted.length + duplicates.length + errors.length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
          <p className="text-xs text-green-400/70 uppercase tracking-wider font-semibold mb-0.5">Inserted</p>
          <p className="text-2xl font-bold text-green-400">{inserted.length}</p>
          <p className="text-xs text-green-400/60">of {total} rows</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
          <p className="text-xs text-yellow-400/70 uppercase tracking-wider font-semibold mb-0.5">Duplicates</p>
          <p className="text-2xl font-bold text-yellow-400">{duplicates.length}</p>
          <p className="text-xs text-yellow-400/60">skipped</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-xs text-red-400/70 uppercase tracking-wider font-semibold mb-0.5">Errors</p>
          <p className="text-2xl font-bold text-red-400">{errors.length}</p>
          <p className="text-xs text-red-400/60">invalid rows</p>
        </div>
      </div>

      {duplicates.length > 0 && (
        <div className="border border-yellow-500/20 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/10">
            <Copy className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Duplicate questions skipped</span>
          </div>
          <div className="divide-y divide-white/[0.04] max-h-40 overflow-y-auto">
            {duplicates.map((d) => (
              <div key={d.row} className="flex items-start gap-3 px-4 py-2">
                <span className="text-xs text-muted-foreground shrink-0 w-14">Row {d.row}</span>
                <span className="text-xs text-muted-foreground line-clamp-2">{d.question_text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className="border border-red-500/20 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Rows with errors</span>
          </div>
          <div className="divide-y divide-white/[0.04] max-h-40 overflow-y-auto">
            {errors.map((e) => (
              <div key={e.row} className="flex items-start gap-3 px-4 py-2">
                <span className="text-xs text-muted-foreground shrink-0 w-14">Row {e.row}</span>
                <span className="text-xs text-red-400/80">{e.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {inserted.length > 0 && errors.length === 0 && duplicates.length === 0 && (
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>All {inserted.length} questions imported successfully</span>
        </div>
      )}
    </div>
  );
}
