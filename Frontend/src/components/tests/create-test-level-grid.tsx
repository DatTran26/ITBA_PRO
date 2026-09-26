"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { flowAt } from "@/lib/ui/tones";

const LEVELS = [
    { name: "Junior", desc: "0–2 năm kinh nghiệm", rung: 1 },
    { name: "Mid", desc: "2–5 năm kinh nghiệm", rung: 2 },
    { name: "Senior", desc: "5+ năm kinh nghiệm", rung: 3 },
    { name: "Other", desc: "Tự nhập cấp độ", rung: 0 },
];

export const LEVEL_NAMES = LEVELS.map((l) => l.name);

interface Props {
    selectedLevel: string;
    setSelectedLevel: (v: string) => void;
    customLevel: string;
    setCustomLevel: (v: string) => void;
}

// Step 02 — level/grade selection (preset levels + "Other" custom input).
// Split out of create-test-workbench.tsx.
export default function CreateTestLevelGrid({ selectedLevel, setSelectedLevel, customLevel, setCustomLevel }: Props) {
    return (
        <div>
            {/* Bậc thang: cấp độ có thứ tự nên dùng dải flow; số vạch = bậc */}
            <div className="flex flex-col gap-2">
                {LEVELS.map((level) => {
                    const active = selectedLevel === level.name;
                    const color = level.rung ? flowAt(level.rung - 1, 3) : "var(--muted-foreground)";
                    return (
                        <button
                            key={level.name}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setSelectedLevel(level.name)}
                            className={cn(
                                "flex items-center gap-3 rounded-xl border p-3 text-left transition",
                                active ? "bg-card" : "border-border bg-card hover:border-primary/40",
                            )}
                            style={active ? { borderColor: color, boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 18%, transparent)` } : undefined}
                        >
                            <span className="flex h-8 w-8 shrink-0 items-end justify-center gap-0.5 rounded-lg bg-muted p-1.5" aria-hidden>
                                {[1, 2, 3].map((r) => (
                                    <span
                                        key={r}
                                        className="w-1.5 rounded-sm"
                                        style={{ height: `${r * 33}%`, backgroundColor: r <= level.rung ? color : "var(--border)" }}
                                    />
                                ))}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-bold text-foreground">{level.name === "Other" ? "Khác" : level.name}</span>
                                <span className="block text-[11px] text-muted-foreground">{level.desc}</span>
                            </span>
                            <span
                                className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2"
                                style={{ borderColor: active ? color : "var(--border)", backgroundColor: active ? color : "transparent" }}
                            >
                                {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </span>
                        </button>
                    );
                })}
            </div>

            {selectedLevel === "Other" && (
                <Input
                    type="text"
                    placeholder="VD: Principal, Lead, Intern..."
                    value={customLevel}
                    onChange={(e) => setCustomLevel(e.target.value)}
                    className="mt-3 h-11 rounded-xl"
                    autoFocus
                />
            )}
        </div>
    );
}
