"use client";

import { Fragment, useState } from "react";
import { Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { QuestionRow } from "./question-bank-types";

const LEVEL_COLORS: Record<string, string> = {
  junior: "border-green-500/30 text-green-400 bg-green-500/10",
  middle: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
  senior: "border-red-500/30 text-red-400 bg-red-500/10",
};

interface Props {
  data: QuestionRow[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onEdit: (q: QuestionRow) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  canEdit: boolean;
}

export default function QuestionBankTable({
  data, total, page, limit, onPageChange,
  onEdit, onDelete, deletingId, canEdit,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const totalPages = Math.ceil(total / limit);

  if (!data.length) {
    return (
      <div className="border border-[#8B99B0]/10 rounded-lg flex flex-col items-center justify-center py-16">
        <p className="text-sm text-[#5A6882]">No questions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="border border-[#8B99B0]/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1B253B]/60 border-b border-white/10">
                <th className="px-4 py-4 text-left text-[11px] uppercase tracking-widest font-bold text-[#5A6882] w-8">#</th>
                <th className="px-4 py-4 text-left text-[11px] uppercase tracking-widest font-bold text-[#5A6882]">Question</th>
                <th className="px-4 py-4 text-left text-[11px] uppercase tracking-widest font-bold text-[#5A6882] w-24">Level</th>
                <th className="px-4 py-4 text-left text-[11px] uppercase tracking-widest font-bold text-[#5A6882] w-28">Topic</th>
                <th className="px-4 py-4 text-left text-[11px] uppercase tracking-widest font-bold text-[#5A6882] w-16">Pts</th>
                <th className="px-4 py-4 text-left text-[11px] uppercase tracking-widest font-bold text-[#5A6882] w-16">Time</th>
                {canEdit && (
                  <th className="px-4 py-4 text-right text-[11px] uppercase tracking-widest font-bold text-[#5A6882] w-24">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((q, idx) => {
                const isExpanded = expandedId === q.id;
                return (
                  <Fragment key={q.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-4 text-sm text-[#5A6882]">{(page - 1) * limit + idx + 1}</td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-[#ECF0F7] line-clamp-2">{q.question_text}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${LEVEL_COLORS[q.level] ?? "border-[#8B99B0]/20 text-[#8B99B0]"}`}>
                          {q.level}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#8B99B0]">{q.topic_tag ?? "—"}</td>
                      <td className="px-4 py-4 text-sm text-[#8B99B0]">{q.points}</td>
                      <td className="px-4 py-4 text-sm text-[#8B99B0]">{q.time_limit}s</td>
                      {canEdit && (
                        <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onEdit(q)}
                              className="p-1.5 rounded-lg text-[#5A6882] hover:text-[#ECF0F7] hover:bg-white/10 transition-colors"
                              aria-label="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDelete(q.id)}
                              disabled={deletingId === q.id}
                              className="p-1.5 rounded-lg text-[#5A6882] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                              aria-label="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                    {isExpanded && (
                      <tr className="bg-[#0A1020] border-b border-white/[0.03]">
                        <td />
                        <td colSpan={canEdit ? 6 : 5} className="px-4 pb-4 pt-2">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            {(["a", "b", "c", "d"] as const).map((letter) => {
                              const isCorrect = q.correct_answer === letter;
                              return (
                                <div
                                  key={letter}
                                  className={`p-2.5 rounded-lg border ${isCorrect ? "border-green-500/30 bg-green-500/5" : "border-[#8B99B0]/10 bg-[#1B253B]/40"}`}
                                >
                                  <span className={`font-semibold mr-2 ${isCorrect ? "text-green-400" : "text-[#5A6882]"}`}>
                                    {letter.toUpperCase()}.
                                  </span>
                                  <span className="text-[#ECF0F7]">{q[`option_${letter}` as keyof QuestionRow] as string}</span>
                                </div>
                              );
                            })}
                          </div>
                          {q.explanation && (
                            <p className="mt-3 text-xs text-[#8B99B0] bg-[#1B253B]/40 rounded-lg p-2.5 border border-[#8B99B0]/10">
                              <span className="text-[#7C8FFF] font-medium">Explanation: </span>{q.explanation}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 py-2">
          <p className="text-xs text-[#5A6882]">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="h-7 w-7 border-[#8B99B0]/15 bg-transparent text-[#8B99B0] hover:text-[#ECF0F7]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs text-[#8B99B0] px-2">{page} / {totalPages}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="h-7 w-7 border-[#8B99B0]/15 bg-transparent text-[#8B99B0] hover:text-[#ECF0F7]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
