"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Eye, Loader2, Send, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import RecipientPicker from "./_components/recipient-picker";
import TemplatePreview from "./_components/template-preview";
import VariableFields from "./_components/variable-fields";
import PositionPicker from "./_components/position-picker";
import SessionPicker, { type SessionLite } from "./_components/session-picker";
import JobApplicationPicker, { type JobApp } from "./_components/job-application-picker";
import {
    emailPanelClass,
    emailSelectClass,
} from "./_components/email-page-chrome";
import { renderTemplate } from "@/lib/email/render-template";
import { TEMPLATE_TYPES } from "@/lib/email/template-variables";
import { templateRecipientConfig } from "@/lib/email/recipient-config";
import type { TemplateType } from "@/lib/email/template-variables";
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

interface Recipient {
    id: string;
    name: string;
    email: string;
}

interface Position {
    id: string;
    title: string;
    department: string | null;
}

interface Props {
    templates: Template[];
}

export default function ComposeClient({ templates }: Props) {
    const [type, setType] = useState<TemplateType | "">("");
    const [locale, setLocale] = useState<"vi" | "en">("vi");
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [relatedType, setRelatedType] = useState<"interview_schedule" | "job_application" | "interview_session" | "">("");
    const [relatedId, setRelatedId] = useState("");
    const [jobApp, setJobApp] = useState<JobApp | null>(null);
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [autofilledKeys, setAutofilledKeys] = useState<Set<string>>(new Set());
    const [tab, setTab] = useState<"summary" | "html">("summary");
    const [position, setPosition] = useState<Position | null>(null);
    const [session, setSession] = useState<SessionLite | null>(null);
    const [autofilling, setAutofilling] = useState(false);
    const [sending, setSending] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const recipientConfig = useMemo(
        () => (type ? templateRecipientConfig(type) : null),
        [type],
    );

    const recipientGate = useMemo(() => {
        if (type === "offer") return "offer";
        if (type === "onboard_confirm") return "onboard_confirm";
        return undefined;
    }, [type]);

    const primaryRecipient = recipients[0] ?? null;

    const currentTemplate = useMemo(
        () => templates.find((t) => t.type === type && t.locale === locale),
        [locale, templates, type],
    );

    const renderedSubject = currentTemplate ? renderTemplate(currentTemplate.subject, variables) : "";
    const renderedBody = currentTemplate
        ? renderTemplate(currentTemplate.body_html, {
              ...variables,
              ...(primaryRecipient ? { candidate_name: variables.candidate_name ?? primaryRecipient.name } : {}),
          })
        : "";

    const setVar = useCallback((key: string, value: string) => {
        setVariables((prev) => ({ ...prev, [key]: value }));
    }, []);

    useEffect(() => {
        if (position) setVar("position_name", position.title);
    }, [position, setVar]);

    useEffect(() => {
        if (!session || !type) return;
        let cancelled = false;
        fetch(`/api/emails/session-recipients?sessionId=${session.id}&type=${encodeURIComponent(type)}`)
            .then((r) => r.json())
            .then(({ recipients: fetched, mode }: { recipients: { id: string; name: string; email: string }[]; mode: string }) => {
                if (cancelled) return;
                setRecipients((prev) => {
                    const existingIds = new Set(prev.map((r) => r.id));
                    const merged = [...prev, ...fetched.filter((r) => !existingIds.has(r.id))];
                    return merged;
                });
                if (mode === "resend") {
                    toast.info("Resend mode - showing only pending candidates");
                }
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [session, type]);

    // Auto-wire session as linked entity for session-based templates
    useEffect(() => {
        if (session && (type === "schedule_interview" || type === "interview_reminder")) {
            setRelatedType("interview_session");
            setRelatedId(session.id);
        } else if (!session && (type === "schedule_interview" || type === "interview_reminder")) {
            setRelatedType("");
            setRelatedId("");
        }
    }, [session, type]);

    // Auto-wire job application as linked entity for offer/onboard templates
    useEffect(() => {
        if (jobApp) {
            setRelatedType("job_application");
            setRelatedId(jobApp.id);
        } else if (type === "offer" || type === "onboard_confirm") {
            setRelatedType("");
            setRelatedId("");
        }
    }, [jobApp, type]);

    async function handleAutofill() {
        if (!type || !relatedType || !relatedId.trim()) return;
        setAutofilling(true);
        try {
            const res = await fetch("/api/emails/autofill", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, locale, relatedEntityType: relatedType, relatedEntityId: relatedId }),
            });
            if (res.ok) {
                const { variables: filled } = await res.json();
                setVariables((prev) => ({ ...prev, ...filled }));
                setAutofilledKeys(new Set(Object.keys(filled)));
                toast.success("Variables autofilled");
            }
        } finally {
            setAutofilling(false);
        }
    }

    const isBulk = recipients.length > 1 || recipientConfig?.mode === "multi";

    async function handleSend() {
        if (recipients.length === 0 || !type || !currentTemplate) return;
        setSending(true);
        setShowConfirm(false);
        try {
            if (isBulk) {
                const res = await fetch("/api/emails/send-bulk", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        templateId: currentTemplate.id,
                        recipients: recipients.map((r) => ({
                            id: r.id,
                            source: recipientConfig?.source ?? "persons",
                        })),
                        sharedVariables: variables,
                        locale,
                        relatedEntityType: relatedType || undefined,
                        relatedEntityId: relatedId || undefined,
                    }),
                });
                const data = await res.json();
                if (!res.ok) {
                    toast.error(data.error ?? "Bulk send failed");
                } else if (data.failed?.length > 0) {
                    toast.warning(`Sent to ${data.sent} recipients, ${data.failed.length} failed`);
                } else {
                    toast.success(`Sent to ${data.sent} recipients`);
                }
            } else {
                const res = await fetch("/api/emails/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        templateId: currentTemplate.id,
                        recipientId: primaryRecipient!.id,
                        recipientSource: recipientConfig?.source ?? "persons",
                        variables,
                        locale,
                        relatedEntityType: relatedType || undefined,
                        relatedEntityId: relatedId || undefined,
                    }),
                });
                if (res.ok) toast.success(`Email queued for ${primaryRecipient!.email}`);
                else {
                    const data = await res.json();
                    toast.error(data.error ?? "Send failed");
                }
            }
        } finally {
            setSending(false);
        }
    }

    const recipientSummary = recipients.length > 1
        ? `${recipients.length} recipients`
        : primaryRecipient
          ? `${primaryRecipient.name} <${primaryRecipient.email}>`
          : "";

    const confirmRecipientLabel = isBulk
        ? `${recipients.length} recipient${recipients.length !== 1 ? "s" : ""}`
        : primaryRecipient?.email ?? "-";

    return (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,34rem)_1fr]">
            <div className="space-y-5">
                <section className={emailPanelClass}>
                    <StepHeader number="1" title="Choose template" description="Pick type + language to load the right skeleton." />
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <select
                            value={type}
                            onChange={(event) => {
                                setType(event.target.value as TemplateType);
                                setVariables({});
                                setAutofilledKeys(new Set());
                                setPosition(null);
                                setSession(null);
                                setRecipients([]);
                                setJobApp(null);
                                setRelatedType("");
                                setRelatedId("");
                            }}
                            className={emailSelectClass}
                        >
                            <option value="">Select template type...</option>
                            {TEMPLATE_TYPES.map((templateType) => (
                                <option key={templateType} value={templateType}>
                                    {TYPE_LABELS[templateType] ?? templateType}
                                </option>
                            ))}
                        </select>
                        <select
                            value={locale}
                            onChange={(event) => setLocale(event.target.value as "vi" | "en")}
                            className={emailSelectClass}
                        >
                            <option value="vi">Vietnamese</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                </section>

                <section className={emailPanelClass}>
                    <StepHeader number="2" title="Select recipient" description="Search by name or email." />
                    {recipientConfig?.sessionPickerEnabled && (
                        <SessionPicker
                            value={session}
                            onChange={setSession}
                            disabled={!type}
                        />
                    )}
                    <div className={recipientConfig?.sessionPickerEnabled ? "mt-3" : ""}>
                        <RecipientPicker
                            value={recipients}
                            onChange={setRecipients}
                            mode={recipientConfig?.mode ?? "single"}
                            type={type || "schedule_interview"}
                            gate={recipientGate}
                            disabled={!type}
                        />
                    </div>
                </section>

                {type && (
                    <section className={emailPanelClass}>
                        <StepHeader number="3" title="Context & autofill" description="Link a record and fill runtime variables automatically." />
                        <PositionPicker value={position} onChange={setPosition} className="mb-3" />
                        {(type === "offer" || type === "onboard_confirm") && (
                            <JobApplicationPicker value={jobApp} onChange={setJobApp} className="mb-3" />
                        )}
                        {(type === "schedule_interview" || type === "interview_reminder") && session && (
                            <div className="mb-3 flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/5 px-3 py-2 text-xs text-cyan-200/70">
                                <span className="font-medium">Linked:</span>
                                <span>Round {session.round} - {session.jd_title ?? "Session"}</span>
                            </div>
                        )}
                        <SharedDashboardButton
                            onClick={handleAutofill}
                            disabled={autofilling || !type || !relatedType || !relatedId.trim()}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 px-4 py-2.5 text-sm font-semibold text-background shadow-lg shadow-cyan-950/20 transition hover:from-cyan-300 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {autofilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                            {autofilling ? "Autofilling..." : "Autofill variables"}
                        </SharedDashboardButton>
                    </section>
                )}

                {type && (
                    <section className={emailPanelClass}>
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <StepHeader number="4" title="Template variables" description="Override any value before rendering preview." />
                            {autofilledKeys.size > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-400/15 px-2 py-1 text-xs text-emerald-200">
                                    <Check className="h-3 w-3" />
                                    {autofilledKeys.size} auto
                                </span>
                            )}
                        </div>
                        <VariableFields type={type} variables={variables} onChange={setVar} autofilledKeys={autofilledKeys} bodyHtml={currentTemplate?.body_html} />
                    </section>
                )}
            </div>

            <div className="space-y-5">
                <section className={emailPanelClass}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-cyan-200" />
                            <p className="text-sm font-semibold text-primary">Live preview</p>
                        </div>
                        <div className="flex rounded-xl border border-border bg-background p-0.5">
                            {(["summary", "html"] as const).map((item) => (
                                <SharedDashboardButton
                                    key={item}
                                    onClick={() => setTab(item)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                        tab === item ? "bg-white/[0.12] text-foreground" : "text-slate-500 hover:text-slate-200"
                                    }`}
                                >
                                    {item === "summary" ? "Summary" : "HTML"}
                                </SharedDashboardButton>
                            ))}
                        </div>
                    </div>
                    {tab === "summary" ? (
                        <div className="space-y-3">
                            <SummaryItem label="Subject" value={renderedSubject} fallback={currentTemplate ? "Empty subject" : "Select a template first"} />
                            <SummaryItem
                                label="Recipient"
                                value={recipientSummary}
                                fallback="Not selected yet"
                            />
                            <div className="rounded-2xl border border-border bg-background p-4">
                                <p className="text-xs text-slate-500">Body preview</p>
                                {renderedBody ? (
                                    <iframe
                                        srcDoc={renderedBody}
                                        sandbox="allow-same-origin"
                                        className="mt-3 h-[28rem] w-full rounded-xl bg-white"
                                        title="Email body preview"
                                    />
                                ) : (
                                    <p className="mt-1 text-sm text-slate-600">Fill in the template to see a preview.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <TemplatePreview subject={renderedSubject} body={renderedBody} />
                    )}
                </section>

                <section className="rounded-2xl border border-border bg-background/78 p-5 shadow-xl shadow-black/20">
                    <SharedDashboardButton
                        onClick={() => setShowConfirm(true)}
                        disabled={!type || recipients.length === 0 || !currentTemplate || sending}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-300 to-cyan-400 px-6 py-4 text-sm font-semibold text-background shadow-lg shadow-cyan-950/20 transition hover:from-emerald-200 hover:to-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Send className="h-4 w-4" />
                        Send email
                    </SharedDashboardButton>
                    <p className="mt-3 text-center text-xs text-slate-600">
                        Template, recipient, and preview should be checked before sending.
                    </p>
                </section>
            </div>

            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[1.5rem] border border-border bg-background p-6 shadow-2xl">
                        <div className="mb-5 flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">Final check</p>
                                <p className="mt-1 text-lg font-semibold text-primary">Confirm email send</p>
                            </div>
                            <SharedDashboardButton
                                onClick={() => setShowConfirm(false)}
                                className="rounded-xl p-2 text-slate-400 transition hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </SharedDashboardButton>
                        </div>
                        <div className="space-y-3 rounded-2xl border border-border bg-background/78 p-4 text-sm">
                            <ModalRow label="To" value={confirmRecipientLabel} />
                            <ModalRow label="Template" value={type ? TYPE_LABELS[type] ?? type : "-"} />
                            <ModalRow label="Language" value={locale === "vi" ? "Vietnamese" : "English"} />
                        </div>
                        <div className="mt-6 flex gap-3">
                            <SharedDashboardButton
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 rounded-xl border border-border bg-white/[0.03] px-4 py-3 text-sm text-slate-400 transition hover:bg-white/[0.08] hover:text-foreground"
                            >
                                Cancel
                            </SharedDashboardButton>
                            <SharedDashboardButton
                                onClick={handleSend}
                                disabled={sending}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-300 to-cyan-400 px-4 py-3 text-sm font-semibold text-background shadow-lg shadow-cyan-950/20 transition hover:from-emerald-200 hover:to-cyan-300 disabled:opacity-50"
                            >
                                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                {sending ? "Sending..." : "Confirm send"}
                            </SharedDashboardButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StepHeader({ number, title, description }: { number: string; title: string; description: string }) {
    return (
        <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-300/15 text-xs font-semibold text-cyan-200">
                {number}
            </span>
            <div>
                <p className="text-sm font-semibold text-primary">{title}</p>
                <p className="text-xs text-slate-500">{description}</p>
            </div>
        </div>
    );
}

function SummaryItem({ label, value, fallback }: { label: string; value: string; fallback: string }) {
    return (
        <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-sm text-primary">{value || <span className="text-slate-600">{fallback}</span>}</p>
        </div>
    );
}

function ModalRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">{label}</span>
            <span className="truncate text-right text-primary">{value}</span>
        </div>
    );
}
