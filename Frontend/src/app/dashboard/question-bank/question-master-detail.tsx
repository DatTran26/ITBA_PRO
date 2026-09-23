"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2, Clock, Award, CheckCircle2, BookOpen } from "lucide-react";
import { toneByName, type ToneName } from "@/lib/ui/tones";
import { QUESTION_TYPE_OPTIONS, type QuestionRow } from "@/components/question-bank/question-bank-types";

const LEVEL_TONE: Record<string, ToneName> = { junior: "teal", middle: "blue", senior: "violet" };
const levelTone = (l: string) => toneByName(LEVEL_TONE[l?.toLowerCase()] ?? "gold");
const typeLabel = (t?: string) => QUESTION_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? "Single Choice";

function options(q: QuestionRow): [string, string][] {
  const legacy = (["a", "b", "c", "d"] as const)
    .map((k) => [k.toUpperCase(), q[`option_${k}`]] as [string, string | null | undefined])
    .filter((o): o is [string, string] => !!o[1]);
  if (legacy.length) return legacy;
  const o = q.answer_payload?.options;
  if (Array.isArray(o)) return o.map((v, i) => [String.fromCharCode(65 + i), v]);
  if (o && typeof o === "object") return Object.entries(o);
  return [];
}

interface Props {
  data: QuestionRow[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  canEdit: boolean;
  deletingId: string | null;
  onPageChange: (p: number) => void;
  onEdit: (q: QuestionRow) => void;
  onDelete: (id: string) => void;
}

/** Danh sách câu hỏi bên trái, xem trước đầy đủ bên phải — đọc câu mà không mở dialog. */
export default function QuestionMasterDetail({ data, total, page, limit, loading, canEdit, deletingId, onPageChange, onEdit, onDelete }: Props) {
  const [pickedId, setPickedId] = useState<string | null>(null);
  const selected = data.find((q) => q.id === pickedId) ?? data[0] ?? null;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="grid grid-cols-[440px_1fr] h-[calc(100vh-300px)] min-h-[560px] rounded-2xl border border-border bg-card overflow-hidden shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]">
      <div className="flex flex-col min-h-0 border-r border-border">
        <ul className={`flex-1 overflow-y-auto divide-y divide-border ${loading ? "opacity-50" : ""}`}>
          {data.map((q, i) => {
            const on = q.id === selected?.id;
            const t = levelTone(q.level);
            return (
              <li key={q.id}>
                <button type="button" onClick={() => setPickedId(q.id)}
                        className={`w-full text-left px-4 py-3 border-l-[3px] transition-colors cursor-pointer ${on ? "bg-accent border-primary" : "border-transparent hover:bg-muted/50"}`}>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="tabular-nums font-bold text-muted-foreground">#{(page - 1) * limit + i + 1}</span>
                    <span className="rounded-full px-2 py-0.5 font-bold capitalize" style={{ color: t.ink, backgroundColor: t.bg }}>{q.level}</span>
                    {q.topic_tag && <span className="font-semibold text-muted-foreground truncate">{q.topic_tag}</span>}
                  </div>
                  <p className="mt-1 text-sm text-foreground line-clamp-2">{q.question_text}</p>
                </button>
              </li>
            );
          })}
          {!loading && data.length === 0 && (
            <li className="p-10 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p className="mt-3 text-sm font-semibold text-foreground">Chưa có câu hỏi nào</p>
              <p className="mt-1 text-xs text-muted-foreground">Thử bỏ bộ lọc, hoặc thêm câu hỏi mới.</p>
            </li>
          )}
        </ul>
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-xs text-muted-foreground">
          <span className="tabular-nums">Trang {page}/{pages} · {total} câu</span>
          <div className="flex gap-1">
            {[[ChevronLeft, page - 1, page <= 1, "Trang trước"], [ChevronRight, page + 1, page >= pages, "Trang sau"]].map(([Icon, p, dis, label]) => {
              const I = Icon as typeof ChevronLeft;
              return (
                <button key={label as string} type="button" aria-label={label as string} disabled={dis as boolean} onClick={() => onPageChange(p as number)}
                        className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                  <I className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto">
        {selected ? (
          <article className="p-8 max-w-3xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="rounded-full px-2.5 py-1 capitalize" style={{ color: levelTone(selected.level).ink, backgroundColor: levelTone(selected.level).bg }}>{selected.level}</span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{typeLabel(selected.question_type)}</span>
                {selected.topic_tag && <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{selected.topic_tag}</span>}
                <span className="inline-flex items-center gap-1 text-muted-foreground"><Award className="w-3.5 h-3.5" />{selected.points} điểm</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="w-3.5 h-3.5" />{selected.time_limit}s</span>
              </div>
              {canEdit && (
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => onEdit(selected)} aria-label="Sửa câu hỏi"
                          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"><Pencil className="w-4 h-4" /></button>
                  <button type="button" onClick={() => onDelete(selected.id)} disabled={deletingId === selected.id} aria-label="Xóa câu hỏi"
                          className="p-2 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 disabled:opacity-50 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
            </div>

            <h2 className="mt-5 text-xl font-bold leading-relaxed text-foreground whitespace-pre-wrap">{selected.question_text}</h2>

            {options(selected).length > 0 && (
              <ol className="mt-6 space-y-2">
                {options(selected).map(([k, v]) => {
                  const right = selected.correct_answer?.toString().toUpperCase() === k;
                  return (
                    <li key={k} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${right ? "border-success/40 bg-success/5" : "border-border"}`}>
                      <span className={`w-6 h-6 shrink-0 rounded-md grid place-items-center text-xs font-bold ${right ? "bg-success text-white" : "bg-muted text-muted-foreground"}`}>{k}</span>
                      <span className="flex-1 text-foreground">{v}</span>
                      {right && <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-label="Đáp án đúng" />}
                    </li>
                  );
                })}
              </ol>
            )}

            {selected.explanation && (
              <div className="mt-6 rounded-xl bg-muted/50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Giải thích</p>
                <p className="mt-1.5 text-sm text-foreground whitespace-pre-wrap">{selected.explanation}</p>
              </div>
            )}
          </article>
        ) : (
          <div className="h-full grid place-items-center text-sm text-muted-foreground">Chọn một câu hỏi để xem</div>
        )}
      </div>
    </div>
  );
}
