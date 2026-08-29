"use client";

import { variablesFor, extractUsedVariables } from "@/lib/email/template-variables";
import type { TemplateType } from "@/lib/email/template-variables";
import { emailInputClass } from "./email-page-chrome";

const FIELD_LABELS: Record<string, string> = {
    candidate_name: "Candidate Name",
    position_name: "Position",
    interview_date: "Interview Date",
    interview_time: "Interview Time",
    interview_location: "Location",
    interview_type: "Interview Type",
    meeting_link: "Meeting Link",
    interviewer_name: "Interviewer",
    interviewer_names: "Interviewers",
    company_name: "Company Name",
    hr_name: "HR Name",
    hr_email: "HR Email",
    candidate_cv_link: "CV Link",
    salary: "Salary",
    start_date: "Start Date",
    response_deadline: "Response Deadline",
    contract_link: "Contract Link",
    work_location: "Work Location",
    manager_name: "Manager",
    items_to_bring: "Items to Bring",
    contact_email: "Contact Email",
};

interface Props {
    type: TemplateType;
    variables: Record<string, string>;
    onChange: (key: string, value: string) => void;
    autofilledKeys?: Set<string>;
    /** When provided, only show fields for vars actually used in the template body */
    bodyHtml?: string;
}

export default function VariableFields({ type, variables, onChange, autofilledKeys, bodyHtml }: Props) {
    const vars = bodyHtml ? extractUsedVariables(bodyHtml) : variablesFor(type);
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {vars.map((variable) => (
                <label key={variable} className="group block">
                    <span className="mb-1.5 flex items-center gap-2 text-xs text-slate-500">
                        {FIELD_LABELS[variable] ?? variable}
                        {autofilledKeys?.has(variable) && (
                            <span className="rounded-full bg-emerald-400/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                                auto
                            </span>
                        )}
                    </span>
                    <input
                        value={variables[variable] ?? ""}
                        onChange={(event) => onChange(variable, event.target.value)}
                        placeholder={`{{${variable}}}`}
                        className={emailInputClass}
                    />
                </label>
            ))}
        </div>
    );
}
