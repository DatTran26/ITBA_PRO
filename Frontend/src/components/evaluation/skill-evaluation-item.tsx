"use client";

import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { SkillEvalFormItem } from "@/app/dashboard/results/[id]/evaluation-types";

interface SkillEvaluationItemProps {
    item: SkillEvalFormItem;
    onChange: (updates: Partial<SkillEvalFormItem>) => void;
}

const SCORE_BUTTONS = [1, 2, 3, 4, 5];

export default function SkillEvaluationItem({ item, onChange }: SkillEvaluationItemProps) {
    function handleScoreClick(score: number) {
        const newStatus = score >= item.required_level ? "pass" : "fail";
        onChange({ score, status: newStatus as SkillEvalFormItem["status"], isDirty: true });
    }

    function handleStatusToggle(status: "pass" | "fail") {
        onChange({ status, isDirty: true });
    }

    return (
        <div className={`p-4 rounded-xl border transition-all ${item.is_mandatory
            ? "border-amber-500/30 bg-amber-500/[0.03]"
            : "border-border/10 bg-card"
        }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {item.is_mandatory && (
                        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 text-[10px]">Required</Badge>
                    )}
                    <span className="font-medium text-foreground">{item.skill_name}</span>
                    {item.skill_category && (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/20">{item.skill_category}</Badge>
                    )}
                </div>
                <span className="text-xs text-muted-foreground">
                    Required: {item.required_level}/5
                </span>
            </div>

            {/* Score buttons + Status */}
            <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground mr-1">Score:</span>
                    {SCORE_BUTTONS.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => handleScoreClick(s)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all cursor-pointer ${item.score === s
                                ? s >= item.required_level
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                    : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                                : "bg-muted text-muted-foreground border border-border/10 hover:border-border/30"
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                    <button
                        type="button"
                        onClick={() => handleStatusToggle("pass")}
                        className={`px-3 h-8 rounded-lg text-xs font-medium transition-all cursor-pointer ${item.status === "pass"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : "bg-muted text-muted-foreground border border-border/10 hover:border-border/30"
                        }`}
                    >
                        Pass
                    </button>
                    <button
                        type="button"
                        onClick={() => handleStatusToggle("fail")}
                        className={`px-3 h-8 rounded-lg text-xs font-medium transition-all cursor-pointer ${item.status === "fail"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                            : "bg-muted text-muted-foreground border border-border/10 hover:border-border/30"
                        }`}
                    >
                        Fail
                    </button>
                </div>
            </div>

            {/* Comment */}
            <Textarea
                placeholder="Reviewer comment..."
                value={item.reviewer_comment}
                onChange={(e) => onChange({ reviewer_comment: e.target.value, isDirty: true })}
                className="bg-background border-border/10 text-foreground placeholder:text-muted-foreground min-h-[60px] text-sm resize-none"
            />

            {/* AI Insight */}
            {item.ai_insight && (
                <p className="mt-2 text-xs text-violet-400/80 italic leading-relaxed">{item.ai_insight}</p>
            )}
        </div>
    );
}
