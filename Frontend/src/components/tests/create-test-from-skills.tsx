"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Database, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import QuestionPullPreview from "@/components/question-bank/question-pull-preview";
import type { BankQuestion, LevelConfig, ShortageProposal } from "@/components/question-bank/question-bank-types";

interface Skill {
  id: string;
  name: string;
  category: string | null;
}

// Level distribution choices. "random" ignores level entirely and shuffles the pool.
const DISTRIBUTIONS = [
  { key: "junior", label: "Junior" },
  { key: "middle", label: "Middle" },
  { key: "senior", label: "Senior" },
  { key: "mixed", label: "Mixed (J/M/S)" },
  { key: "random", label: "Random" },
] as const;
type Distribution = (typeof DISTRIBUTIONS)[number]["key"];

interface Props {
  onBack: () => void;
  embedded?: boolean;
  onCreated?: (test: { id: string }) => void | Promise<void>;
  // Pre-selected skill ids (e.g. when launched from a skill detail page).
  initialSkillIds?: string[];
}

const fieldCls = "bg-background border-border h-10 rounded-xl text-foreground focus-visible:ring-primary/30 text-sm";

// Free-text numeric field: lets the user type/clear freely, only normalizing
// (digits-only + min/max clamp) on blur — avoids the spinner arrows and the
// "snaps back to 1 while typing" annoyance of a native number input.
function NumField({
  label, value, min, max, onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max?: number;
  onCommit: (n: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);

  function commit() {
    const parsed = parseInt(draft, 10);
    const clamped = Number.isNaN(parsed)
      ? min
      : Math.max(min, max !== undefined ? Math.min(max, parsed) : parsed);
    onCommit(clamped);
    setDraft(String(clamped));
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] text-muted-foreground uppercase tracking-wide ml-1">{label}</Label>
      <Input
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={commit}
        className={fieldCls}
      />
    </div>
  );
}

// Self-contained "create test from 1+ skills" flow. Reuses the question-bank pull API
// (skillIds filter + random mode), the shared QuestionPullPreview, and the tests API.
export default function CreateTestFromSkills({ onBack, embedded = false, onCreated, initialSkillIds }: Props) {
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSkillIds ?? []));
  const [distribution, setDistribution] = useState<Distribution>("mixed");
  const [total, setTotal] = useState(10);
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState(15);
  const [maxParticipants, setMaxParticipants] = useState(1);

  const [step, setStep] = useState<"config" | "preview">("config");
  const [pulled, setPulled] = useState<BankQuestion[]>([]);
  const [config, setConfig] = useState<LevelConfig | null>(null);
  const [shortage, setShortage] = useState<ShortageProposal | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/skills");
        const json = await res.json();
        setSkills(json.skills ?? []);
      } catch {
        toast.error("Failed to load skills");
      }
    })();
  }, []);

  function toggleSkill(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function buildConfig(confirmSubstitution = false): LevelConfig & { skillIds: string[]; random?: boolean } {
    const skillIds = [...selected];
    if (distribution === "random") {
      return { mode: "single", level: "junior", total, skillIds, random: true, confirmSubstitution };
    }
    if (distribution === "mixed") {
      return { mode: "mixed", total, ratios: { junior: 33, middle: 33, senior: 34 }, skillIds, confirmSubstitution };
    }
    return { mode: "single", level: distribution, total, skillIds, confirmSubstitution };
  }

  async function handlePull(cfg = buildConfig()) {
    if (selected.size === 0) {
      toast.error("Select at least one skill");
      return;
    }
    setConfig(cfg);
    setShortage(null);
    setIsPulling(true);
    try {
      const res = await fetch("/api/question-bank/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Pull failed");
      setPulled(json.questions ?? []);
      setShortage(json.shortage_proposal ?? null);
      setStep("preview");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to pull questions");
    } finally {
      setIsPulling(false);
    }
  }

  async function handleCreate(questions: BankQuestion[]) {
    setIsCreating(true);
    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || undefined,
          question_count: questions.length,
          time_limit_minutes: timeLimit,
          max_participants: maxParticipants,
          target_type: "employee",
          bank_questions: questions,
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed to create test");
      }
      const data = await res.json();
      toast.success("Test created from skills");
      if (onCreated) await onCreated(data.test);
      else router.push(`/dashboard/tests/${data.test.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create test");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className={embedded ? "" : "max-w-3xl mx-auto"}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-success">
          <Database className="w-5 h-5" />
          <h2 className="text-lg font-display text-white">Create Test from Skills</h2>
        </div>
        <Button
          variant="outline"
          onClick={onBack}
          className="border-border/30 text-primary hover:bg-primary/10 rounded-xl h-9 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <Card className="border-border/20 bg-muted/40 rounded-2xl">
        <CardContent className="p-6 space-y-6">
          {step === "config" ? (
            <>
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">Skills</Label>
                {skills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No skills available.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => {
                      const active = selected.has(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleSkill(s.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            active
                              ? "bg-success/20 border-border/40 text-success"
                              : "border-border/20 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">Level Distribution</Label>
                <div className="flex flex-wrap gap-2">
                  {DISTRIBUTIONS.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setDistribution(d.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1.5 ${
                        distribution === d.key
                          ? "bg-primary/20 border-border/40 text-primary"
                          : "border-border/20 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {d.key === "random" && <Shuffle className="w-3 h-3" />}
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <NumField label="Questions" value={total} min={1} max={200} onCommit={setTotal} />
                <NumField label="Time (min)" value={timeLimit} min={1} max={180} onCommit={setTimeLimit} />
                <NumField label="Participants" value={maxParticipants} min={1} onCommit={setMaxParticipants} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide ml-1">Title (optional)</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Optional display name..."
                  className={fieldCls}
                />
              </div>

              <Button
                onClick={() => handlePull()}
                disabled={selected.size === 0 || isPulling}
                className="w-full bg-success hover:bg-success text-white border-0 h-11 rounded-xl"
              >
                {isPulling ? "Pulling..." : "Pull Questions"}
              </Button>
            </>
          ) : (
            config && (
              <QuestionPullPreview
                questions={pulled}
                config={config}
                shortageProposal={shortage}
                onConfirmed={handleCreate}
                onAcceptSubstitution={() => handlePull(buildConfig(true))}
                onBack={() => setStep("config")}
              />
            )
          )}
          {isCreating && <p className="text-xs text-muted-foreground text-center">Creating test...</p>}
        </CardContent>
      </Card>
    </div>
  );
}
