"use client";

import SkillEvaluationItem from "./skill-evaluation-item";
import type { SkillEvalFormItem } from "@/app/dashboard/results/[id]/evaluation-types";

interface SkillEvaluationListProps {
    items: SkillEvalFormItem[];
    onChange: (skillId: string, updates: Partial<SkillEvalFormItem>) => void;
}

export default function SkillEvaluationList({ items, onChange }: SkillEvaluationListProps) {
    const sorted = [...items].sort((a, b) => {
        if (a.is_mandatory !== b.is_mandatory) return a.is_mandatory ? -1 : 1;
        return a.checklist_order - b.checklist_order;
    });

    return (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {sorted.map((item) => (
                <SkillEvaluationItem
                    key={item.skill_id}
                    item={item}
                    onChange={(updates) => onChange(item.skill_id, updates)}
                />
            ))}
        </div>
    );
}
