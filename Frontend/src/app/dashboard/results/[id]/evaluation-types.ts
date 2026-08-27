export interface SkillEvalFormItem {
    skill_id: string;
    skill_name: string;
    skill_category: string | null;
    required_level: number;
    is_mandatory: boolean;
    checklist_order: number;
    score: number;
    status: "not_evaluated" | "pass" | "fail";
    reviewer_comment: string;
    ai_insight: string | null;
    evaluation_id: string | null;
    isDirty: boolean;
}

export interface LevelSuggestion {
    suggested_level: string;
    confidence: number;
    reasoning: string;
    skill_gaps: Array<{ skill: string; current: number; required: number }>;
    warnings: string[];
}

export interface SkillRequirementRow {
    id: string;
    skill_id: string;
    required_level: number;
    is_mandatory: boolean;
    checklist_order: number;
    skills: { id: string; name: string; category: string | null };
}

export interface SkillEvaluationRow {
    id: string;
    result_id: string;
    skill_id: string;
    score: number;
    status: string;
    reviewer_comment: string | null;
    ai_insight: string | null;
}
