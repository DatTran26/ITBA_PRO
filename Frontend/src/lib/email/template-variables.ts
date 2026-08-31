export const TEMPLATE_VARIABLES = {
    schedule_interview: [
        "candidate_name", "position_name", "interview_date", "interview_time",
        "interview_location", "interview_type", "meeting_link",
        "interviewer_names", "company_name", "hr_name", "hr_email",
    ],
    interview_reminder: [
        "interviewer_name", "candidate_name", "position_name",
        "interview_date", "interview_time", "interview_location",
        "meeting_link", "candidate_cv_link",
    ],
    offer: [
        "candidate_name", "position_name", "salary", "start_date",
        "response_deadline", "company_name", "hr_name", "contract_link",
    ],
    onboard_confirm: [
        "candidate_name", "position_name", "start_date", "work_location",
        "manager_name", "items_to_bring", "hr_name", "contact_email",
    ],
} as const;

export type TemplateType = keyof typeof TEMPLATE_VARIABLES;
export const TEMPLATE_TYPES = Object.keys(TEMPLATE_VARIABLES) as TemplateType[];

export function variablesFor(type: TemplateType): readonly string[] {
    return TEMPLATE_VARIABLES[type];
}

export function extractUsedVariables(body: string): string[] {
    const matches = body.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/g);
    return Array.from(new Set([...matches].map((m) => m[1])));
}

export function findUnknownVariables(type: TemplateType, body: string): string[] {
    const used = extractUsedVariables(body);
    const known = new Set<string>(variablesFor(type));
    return used.filter((v) => !known.has(v));
}
