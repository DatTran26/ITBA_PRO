"use client";

import { Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";

const LEVELS = [
    { name: "Junior", color: "emerald", desc: "0-2 years exp" },
    { name: "Mid", color: "sky", desc: "2-5 years exp" },
    { name: "Senior", color: "rose", desc: "5+ years exp" },
    { name: "Other", color: "orange", desc: "Custom level" },
];

export const LEVEL_NAMES = LEVELS.map((l) => l.name);

const levelThemeMap: Record<string, string> = {
    Junior: "hover:bg-emerald-500/10 hover:border-emerald-500/50 text-emerald-400/50 hover:text-emerald-400 data-[state=active]:bg-emerald-500/10 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-400 data-[state=active]:shadow-[0_0_20px_-5px_color-mix(in_srgb,var(--success)_30%,transparent)]",
    Mid: "hover:bg-sky-500/10 hover:border-sky-500/50 text-sky-400/50 hover:text-sky-400 data-[state=active]:bg-sky-500/10 data-[state=active]:border-sky-500 data-[state=active]:text-sky-400 data-[state=active]:shadow-[0_0_20px_-5px_color-mix(in_srgb,var(--primary)_30%,transparent)]",
    Senior: "hover:bg-rose-500/10 hover:border-rose-500/50 text-rose-400/50 hover:text-rose-400 data-[state=active]:bg-rose-500/10 data-[state=active]:border-rose-500 data-[state=active]:text-rose-400 data-[state=active]:shadow-[0_0_20px_-5px_color-mix(in_srgb,var(--danger)_30%,transparent)]",
    Other: "hover:bg-amber-500/10 hover:border-amber-500/50 text-amber-400/50 hover:text-amber-400 data-[state=active]:bg-amber-500/10 data-[state=active]:border-amber-500 data-[state=active]:text-amber-400 data-[state=active]:shadow-[0_0_20px_-5px_color-mix(in_srgb,var(--warning)_30%,transparent)]",
};

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
            <FadeIn delay={0.3} className="opacity-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-xs font-mono text-primary shadow-lg">02</div>
                    <h2 className="text-xl font-medium font-display text-foreground">Determine Grade</h2>
                </div>

                <StaggerContainer className="flex flex-col gap-3">
                    {LEVELS.map((level) => (
                        <StaggerItem key={level.name}>
                            <div
                                data-state={selectedLevel === level.name ? 'active' : 'inactive'}
                                onClick={() => setSelectedLevel(level.name)}
                                className={`group cursor-pointer p-5 rounded-2xl border border-border bg-muted/40 backdrop-blur-sm transition-all duration-300 flex items-center justify-between ${levelThemeMap[level.name]}`}
                            >
                                <div>
                                    <div className="text-lg font-medium font-display mb-1">{level.name}</div>
                                    <div className="text-xs font-mono opacity-60 flex items-center gap-2">
                                        <Zap className="w-3 h-3" />
                                        {level.desc}
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                    ${selectedLevel === level.name ? 'border-current bg-current' : 'border-border/15 group-hover:border-current'}
                                `}>
                                    {selectedLevel === level.name && <div className="w-2 h-2 rounded-full bg-muted" />}
                                </div>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>

                {selectedLevel === "Other" && (
                    <FadeIn delay={0.1} className="mt-4">
                        <Input
                            type="text"
                            placeholder="E.g., Principal, Lead, Intern..."
                            value={customLevel}
                            onChange={(e) => setCustomLevel(e.target.value)}
                            className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground h-12 rounded-xl focus-visible:ring-primary/30 font-mono text-sm backdrop-blur-md"
                        />
                    </FadeIn>
                )}
            </FadeIn>
        </div>
    );
}
