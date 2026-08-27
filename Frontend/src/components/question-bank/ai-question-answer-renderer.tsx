"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AiQuestion, AnswerPayload, QuestionType } from "./question-bank-types";

interface Props {
  question: AiQuestion;
  editing: boolean;
  onChange: (patch: Partial<AiQuestion>) => void;
}

// Each question type has a distinct answer shape. This dispatches to the right view.
export function AiQuestionAnswerRenderer({ question, editing, onChange }: Props) {
  const type = (question.question_type ?? "single_choice") as QuestionType;

  if (type === "single_choice") return <SingleChoiceView q={question} editing={editing} onChange={onChange} />;
  if (type === "multiple_choice") return <MultipleChoiceView q={question} editing={editing} onChange={onChange} />;
  if (type === "true_false") return <TrueFalseView q={question} editing={editing} onChange={onChange} />;
  if (type === "matching") return <PairsView pairs={(question.answer_payload?.pairs ?? []) as Array<{ left: string; right: string }>} />;
  if (type === "ordering") return <SequenceView sequence={(question.answer_payload?.sequence ?? []) as string[]} />;
  if (type === "fill_blank") return <BlanksView blanks={(question.answer_payload?.blanks ?? []) as string[]} />;
  if (type === "short_answer" || type === "sql_logic_code" || type === "short_case_study") {
    return <ManualGradingView payload={question.answer_payload ?? {}} editing={editing} onChange={onChange} />;
  }
  // scenario / reading_comprehension / priority_severity / image_diagram / communication_response
  // typically render as A-D options just like single_choice — fall back.
  return <SingleChoiceView q={question} editing={editing} onChange={onChange} />;
}

// ── Single-correct A/B/C/D ──────────────────────────────────────────────────
function SingleChoiceView({ q, editing, onChange }: { q: AiQuestion; editing: boolean; onChange: (p: Partial<AiQuestion>) => void }) {
  const hasOptions = [q.option_a, q.option_b, q.option_c, q.option_d].some(Boolean);
  if (!hasOptions) return <EmptyOptionsHint />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {(["a", "b", "c", "d"] as const).map((opt) => (
        <OptionRow
          key={opt}
          letter={opt}
          value={(q[`option_${opt}` as const] ?? "") as string}
          isCorrect={q.correct_answer === opt}
          editing={editing}
          onSelectCorrect={() => onChange({ correct_answer: opt })}
          onTextChange={(v) => onChange({ [`option_${opt}`]: v })}
        />
      ))}
    </div>
  );
}

// ── Multi-correct A/B/C/D — checkboxes, stored as array in answer_payload.correct_answer ─
function MultipleChoiceView({ q, editing, onChange }: { q: AiQuestion; editing: boolean; onChange: (p: Partial<AiQuestion>) => void }) {
  const hasOptions = [q.option_a, q.option_b, q.option_c, q.option_d].some(Boolean);
  if (!hasOptions) return <EmptyOptionsHint />;
  const correct = readMultiCorrect(q);

  function toggleCorrect(letter: string) {
    const next = correct.includes(letter) ? correct.filter((l) => l !== letter) : [...correct, letter].sort();
    onChange({ answer_payload: { ...(q.answer_payload ?? {}), correct_answer: next } });
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-[#5A6882]">Multi-correct — select all that apply</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(["a", "b", "c", "d"] as const).map((opt) => (
          <OptionRow
            key={opt}
            letter={opt}
            value={(q[`option_${opt}` as const] ?? "") as string}
            isCorrect={correct.includes(opt)}
            editing={editing}
            multi
            onSelectCorrect={() => toggleCorrect(opt)}
            onTextChange={(v) => onChange({ [`option_${opt}`]: v })}
          />
        ))}
      </div>
    </div>
  );
}

// ── True / False — A=True, B=False only ─────────────────────────────────────
function TrueFalseView({ q, editing, onChange }: { q: AiQuestion; editing: boolean; onChange: (p: Partial<AiQuestion>) => void }) {
  const correct = q.correct_answer ?? readBooleanCorrect(q.answer_payload);
  return (
    <div className="grid grid-cols-2 gap-2">
      {(["a", "b"] as const).map((opt) => {
        const label = opt === "a" ? "True" : "False";
        const isCorrect = correct === opt || (correct === "true" && opt === "a") || (correct === "false" && opt === "b");
        return (
          <button
            key={opt}
            type="button"
            disabled={!editing}
            onClick={() => onChange({ correct_answer: opt })}
            className={`text-xs px-3 py-2 rounded-lg border text-left transition-colors ${
              isCorrect
                ? "border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]"
                : "border-[#8B99B0]/10 bg-[#0C1220]/60 text-[#8B99B0] hover:border-[#10B981]/30"
            } ${editing ? "cursor-pointer" : "cursor-default"}`}
          >
            <span className="font-mono font-bold uppercase mr-2">{opt}.</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Matching pairs ──────────────────────────────────────────────────────────
function PairsView({ pairs }: { pairs: Array<{ left: string; right: string }> }) {
  if (!pairs.length) return <EmptyPayloadHint label="matching pairs" />;
  return (
    <div className="space-y-1.5">
      {pairs.map((p, i) => (
        <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
          <div className="px-3 py-2 rounded-lg bg-[#0C1220]/60 border border-[#8B99B0]/10 text-[#ECF0F7]">{p.left}</div>
          <span className="text-[#7C8FFF] font-mono">→</span>
          <div className="px-3 py-2 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981]">{p.right}</div>
        </div>
      ))}
    </div>
  );
}

// ── Ordering sequence ───────────────────────────────────────────────────────
function SequenceView({ sequence }: { sequence: string[] }) {
  if (!sequence.length) return <EmptyPayloadHint label="sequence" />;
  return (
    <ol className="space-y-1.5">
      {sequence.map((step, i) => (
        <li key={i} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-[#0C1220]/60 border border-[#8B99B0]/10 text-[#ECF0F7]">
          <span className="font-mono font-bold text-[#7C8FFF] w-5">{i + 1}.</span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

// ── Fill-in-the-blank ───────────────────────────────────────────────────────
function BlanksView({ blanks }: { blanks: string[] }) {
  if (!blanks.length) return <EmptyPayloadHint label="blanks" />;
  return (
    <div className="space-y-1.5">
      {blanks.map((answer, i) => (
        <div key={i} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981]">
          <span className="font-mono text-[#5A6882]">Blank {i + 1}:</span>
          <span className="font-medium">{answer}</span>
        </div>
      ))}
    </div>
  );
}

// ── Manual grading (short_answer / sql_logic_code / short_case_study) ───────
function ManualGradingView({
  payload,
  editing,
  onChange,
}: {
  payload: AnswerPayload;
  editing: boolean;
  onChange: (p: Partial<AiQuestion>) => void;
}) {
  const expected = (payload.expected_answer ?? "") as string;
  const rubric = payload.rubric ?? null;
  const rubricItems = Array.isArray(rubric) ? rubric : rubric ? [rubric] : [];

  return (
    <div className="space-y-2 text-xs">
      <div className="px-3 py-2 rounded-lg bg-[#7C8FFF]/5 border border-[#7C8FFF]/15 text-[#94A3B8]">
        Manual grading — reviewer scores against the rubric/expected answer below.
      </div>
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wider text-[#5A6882]">Expected answer</label>
        {editing ? (
          <Textarea
            value={expected}
            onChange={(e) =>
              onChange({ answer_payload: { ...payload, expected_answer: e.target.value } })
            }
            rows={2}
            className="text-xs bg-[#0C1220]/60 border-[#8B99B0]/20"
          />
        ) : (
          <div className="px-3 py-2 rounded-lg bg-[#10B981]/5 border border-[#10B981]/20 text-[#ECF0F7] whitespace-pre-wrap">
            {expected || <span className="text-[#5A6882] italic">No expected answer set</span>}
          </div>
        )}
      </div>
      {rubricItems.length > 0 && (
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-[#5A6882]">Rubric</label>
          <ul className="space-y-1">
            {rubricItems.map((item, i) => (
              <li key={i} className="px-3 py-1.5 rounded-lg bg-[#0C1220]/60 border border-[#8B99B0]/10 text-[#ECF0F7]">
                · {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Shared option row used by single_choice and multiple_choice ─────────────
function OptionRow({
  letter,
  value,
  isCorrect,
  editing,
  multi,
  onSelectCorrect,
  onTextChange,
}: {
  letter: string;
  value: string;
  isCorrect: boolean;
  editing: boolean;
  multi?: boolean;
  onSelectCorrect: () => void;
  onTextChange: (v: string) => void;
}) {
  return (
    <div
      className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
        isCorrect
          ? "border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]"
          : "border-[#8B99B0]/10 bg-[#0C1220]/60 text-[#8B99B0]"
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSelectCorrect}
          className={`font-mono font-bold uppercase ${
            isCorrect ? "text-[#10B981]" : "text-[#5A6882] hover:text-[#10B981]"
          }`}
          title={multi ? "Toggle as correct" : "Mark as correct"}
        >
          {multi ? (isCorrect ? "☑" : "☐") : ""}
          {letter}.
        </button>
        {editing ? (
          <Input
            value={value}
            onChange={(e) => onTextChange(e.target.value)}
            className="h-7 text-xs bg-transparent border-[#8B99B0]/20"
          />
        ) : (
          <span className="flex-1">{value}</span>
        )}
      </div>
    </div>
  );
}

function EmptyOptionsHint() {
  return (
    <div className="text-xs text-[#8B99B0] bg-[#0C1220]/60 border border-[#8B99B0]/10 rounded-lg px-3 py-2">
      No options provided for this question.
    </div>
  );
}

function EmptyPayloadHint({ label }: { label: string }) {
  return (
    <div className="text-xs text-[#8B99B0] bg-[#0C1220]/60 border border-[#8B99B0]/10 rounded-lg px-3 py-2">
      AI did not return {label} in answer_payload. Edit the question manually to add them.
    </div>
  );
}

function readMultiCorrect(q: AiQuestion): string[] {
  const v = q.answer_payload?.correct_answer;
  if (Array.isArray(v)) return v.map(String);
  // Fallback: comma-separated string or single letter
  if (typeof v === "string") return v.split(/[,\s]+/).filter(Boolean);
  if (typeof q.correct_answer === "string" && q.correct_answer) {
    return q.correct_answer.split(/[,\s]+/).filter(Boolean);
  }
  return [];
}

function readBooleanCorrect(payload?: AnswerPayload): string | null {
  const v = payload?.correct_answer;
  if (typeof v === "boolean") return v ? "a" : "b";
  if (v === "true") return "a";
  if (v === "false") return "b";
  return null;
}
