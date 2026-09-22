"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import SkillEvaluationHeader from "./skill-evaluation-header";
import SkillEvaluationList from "./skill-evaluation-list";
import LevelSuggestionCard from "./level-suggestion-card";
import type { SkillEvalFormItem, SkillRequirementRow, SkillEvaluationRow } from "@/app/dashboard/results/[id]/evaluation-types";

interface SkillEvaluationPanelProps {
    resultId: string;
    positionName: string;
    positionId: string;
    personId: string | null;
    skillRequirements: SkillRequirementRow[];
    existingEvaluations: SkillEvaluationRow[];
}

function buildFormItems(reqs: SkillRequirementRow[], evals: SkillEvaluationRow[]): SkillEvalFormItem[] {
    const evalMap = new Map(evals.map((e) => [e.skill_id, e]));
    return reqs.map((req) => {
        const existing = evalMap.get(req.skill_id);
        return {
            skill_id: req.skill_id,
            skill_name: req.skills?.name ?? "Unknown",
            skill_category: req.skills?.category ?? null,
            required_level: req.required_level,
            is_mandatory: req.is_mandatory,
            checklist_order: req.checklist_order,
            score: existing?.score ?? 0,
            status: (existing?.status as SkillEvalFormItem["status"]) ?? "not_evaluated",
            reviewer_comment: existing?.reviewer_comment ?? "",
            ai_insight: existing?.ai_insight ?? null,
            evaluation_id: existing?.id ?? null,
            isDirty: false,
        };
    });
}

export default function SkillEvaluationPanel({
    resultId, positionName, positionId, personId, skillRequirements, existingEvaluations,
}: SkillEvaluationPanelProps) {
    const [items, setItems] = useState<SkillEvalFormItem[]>(() =>
        buildFormItems(skillRequirements, existingEvaluations)
    );
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = useCallback((skillId: string, updates: Partial<SkillEvalFormItem>) => {
        setItems((prev) => prev.map((i) => i.skill_id === skillId ? { ...i, ...updates } : i));
    }, []);

    const handleSave = useCallback(async () => {
        const dirtyItems = items.filter((i) => i.isDirty);
        if (dirtyItems.length === 0) return;

        setIsSaving(true);
        try {
            for (const item of dirtyItems) {
                const body = {
                    skill_id: item.skill_id,
                    score: item.score,
                    status: item.status === "not_evaluated" ? "pending" : item.status,
                    reviewer_comment: item.reviewer_comment || null,
                };
                const res = await fetch(`/api/skill-evaluations/${resultId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || `Failed to save ${item.skill_name}`);
                }
            }
            setItems((prev) => prev.map((i) => ({ ...i, isDirty: false })));
            toast.success(`${dirtyItems.length} evaluation(s) saved`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Save failed");
        } finally {
            setIsSaving(false);
        }
    }, [items, resultId]);

    return (
        <Card className="border-border/10 bg-background mt-8">
            <CardContent className="p-6">
                <SkillEvaluationHeader
                    positionName={positionName}
                    items={items}
                    isSaving={isSaving}
                    onSave={handleSave}
                />
                <SkillEvaluationList items={items} onChange={handleChange} />
                <LevelSuggestionCard
                    resultId={resultId}
                    positionId={positionId}
                    personId={personId}
                />
            </CardContent>
        </Card>
    );
}
