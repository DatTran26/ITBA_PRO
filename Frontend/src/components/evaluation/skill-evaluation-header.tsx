"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import type { SkillEvalFormItem } from "@/app/dashboard/results/[id]/evaluation-types";

interface SkillEvaluationHeaderProps {
    positionName: string;
    items: SkillEvalFormItem[];
    isSaving: boolean;
    onSave: () => void;
}

export default function SkillEvaluationHeader({ positionName, items, isSaving, onSave }: SkillEvaluationHeaderProps) {
    const passedCount = items.filter((i) => i.status === "pass").length;
    const mandatoryTotal = items.filter((i) => i.is_mandatory).length;
    const mandatoryPassed = items.filter((i) => i.is_mandatory && i.status === "pass").length;
    const mandatoryRemaining = mandatoryTotal - mandatoryPassed;
    const hasDirty = items.some((i) => i.isDirty);
    const completionPct = items.length > 0
        ? Math.round((items.filter((i) => i.status !== "not_evaluated").length / items.length) * 100)
        : 0;

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
                <h3 className="text-lg font-display font-medium text-[#ECF0F7]">
                    Skill Evaluation
                </h3>
                <p className="text-xs text-[#5A6882] mt-0.5">Position: {positionName}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25">
                    {passedCount}/{items.length} Passed
                </Badge>
                {mandatoryRemaining > 0 && (
                    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25">
                        {mandatoryRemaining} Required Remaining
                    </Badge>
                )}
                <Badge variant="outline" className="text-[#8B99B0] border-[#8B99B0]/20">
                    {completionPct}% Evaluated
                </Badge>

                <Button
                    size="sm"
                    disabled={!hasDirty || isSaving}
                    onClick={onSave}
                    className="bg-[#5B6CF0] hover:bg-[#5B6CF0]/80 text-white h-8 px-4 rounded-lg cursor-pointer disabled:opacity-40"
                >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                    Save All
                </Button>
            </div>
        </div>
    );
}
