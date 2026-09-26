"use client";

import { variablesFor, extractUsedVariables } from "@/lib/email/template-variables";
import type { TemplateType } from "@/lib/email/template-variables";
import { emailInputClass } from "./email-page-chrome";

const FIELD_LABELS: Record<string, string> = {
    candidate_name: "Tên ứng viên",
    position_name: "Vị trí",
    interview_date: "Ngày phỏng vấn",
    interview_time: "Giờ phỏng vấn",
    interview_location: "Địa điểm",
    interview_type: "Hình thức",
    meeting_link: "Link họp",
    interviewer_name: "Người phỏng vấn",
    interviewer_names: "Hội đồng phỏng vấn",
    company_name: "Tên công ty",
    hr_name: "Tên HR",
    hr_email: "Email HR",
    candidate_cv_link: "Link CV",
    salary: "Mức lương",
    start_date: "Ngày bắt đầu",
    response_deadline: "Hạn phản hồi",
    contract_link: "Link hợp đồng",
    work_location: "Nơi làm việc",
    manager_name: "Quản lý trực tiếp",
    items_to_bring: "Đồ cần mang",
    contact_email: "Email liên hệ",
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
                    <span className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                        {FIELD_LABELS[variable] ?? variable}
                        {autofilledKeys?.has(variable) && (
                            <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-success">
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
