"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import TemplateEditor from "./template-editor";
import { TEMPLATE_TYPES } from "@/lib/email/template-variables";
import { SharedDashboardButton } from "@/components/shares";

const TYPE_LABELS: Record<string, string> = {
    schedule_interview: "Schedule Interview",
    interview_reminder: "Interview Reminder",
    offer: "Job Offer",
    onboard_confirm: "Onboard Confirmation",
};

interface Template {
    id: string;
    type: string;
    locale: string;
    subject: string;
    body_html: string;
}

export default function TemplatesTab({ canEdit }: { canEdit: boolean }) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState<string | null>(null);
    const [activeLocale, setActiveLocale] = useState<Record<string, string>>({});

    const fetchTemplates = useCallback(async () => {
        try {
            const res = await fetch("/api/emails/templates");
            if (res.ok) setTemplates(await res.json());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[60px] rounded-xl bg-[#0C1422] border border-[#8B99B0]/10 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {TEMPLATE_TYPES.map((type) => {
                const typeTemplates = templates.filter((t) => t.type === type);
                const locale = activeLocale[type] ?? "vi";
                const current = typeTemplates.find((t) => t.locale === locale);
                const isOpen = activeType === type;

                return (
                    <div
                        key={type}
                        className="rounded-xl border border-[#8B99B0]/10 bg-[#0C1422] overflow-hidden"
                    >
                        {/* Accordion header */}
                        <SharedDashboardButton
                            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#1A2236]/60 transition-colors cursor-pointer"
                            onClick={() => setActiveType(isOpen ? null : type)}
                        >
                            <div>
                                <p className="text-sm font-medium text-[#ECF0F7]">
                                    {TYPE_LABELS[type] ?? type}
                                </p>
                                <p className="text-xs text-[#5A6882] mt-0.5">
                                    {typeTemplates.length} locale{typeTemplates.length !== 1 ? "s" : ""} &middot; VI / EN
                                </p>
                            </div>
                            <ChevronDown
                                className={`w-4 h-4 text-[#5A6882] shrink-0 transition-transform duration-200 ${
                                    isOpen ? "rotate-180" : ""
                                }`}
                            />
                        </SharedDashboardButton>

                        {/* Accordion body */}
                        {isOpen && (
                            <div className="px-5 pb-5 border-t border-[#8B99B0]/8">
                                {/* Locale switcher */}
                                <div className="flex gap-1.5 mt-4 mb-4">
                                    {["vi", "en"].map((loc) => (
                                        <SharedDashboardButton
                                            key={loc}
                                            onClick={() =>
                                                setActiveLocale((prev) => ({ ...prev, [type]: loc }))
                                            }
                                            className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                                                locale === loc
                                                    ? "bg-[#5B6CF0]/15 border-[#5B6CF0]/40 text-[#8B99FF]"
                                                    : "border-[#8B99B0]/15 text-[#5A6882] hover:text-[#8B99B0] hover:border-[#8B99B0]/30"
                                            }`}
                                        >
                                            {loc.toUpperCase()}
                                        </SharedDashboardButton>
                                    ))}
                                </div>

                                {current ? (
                                    <TemplateEditor
                                        key={`${type}-${locale}`}
                                        template={current}
                                        canEdit={canEdit}
                                        onSaved={fetchTemplates}
                                    />
                                ) : (
                                    <p className="text-sm text-[#5A6882]">
                                        No template found for locale &ldquo;{locale}&rdquo;
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
