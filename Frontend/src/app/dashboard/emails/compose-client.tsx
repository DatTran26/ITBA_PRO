"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
    AlertTriangle, BellRing, CalendarPlus, Check, CheckCircle2, Circle, Eye, FileSignature,
    Loader2, Mail, PartyPopper, Send, Wand2, type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import RecipientPicker from "./_components/recipient-picker";
import VariableFields from "./_components/variable-fields";
import PositionPicker from "./_components/position-picker";
import SessionPicker, { type SessionLite } from "./_components/session-picker";
import JobApplicationPicker, { type JobApp } from "./_components/job-application-picker";
import { renderTemplate } from "@/lib/email/render-template";
import { TEMPLATE_TYPES, extractUsedVariables } from "@/lib/email/template-variables";
import { templateRecipientConfig } from "@/lib/email/recipient-config";
import type { TemplateType } from "@/lib/email/template-variables";
import { ToneIcon, TonePill } from "@/components/shares";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { flowAt, toneAt, toneByName } from "@/lib/ui/tones";
import { cn } from "@/lib/utils";

const TYPE_META: Record<string, { label: string; hint: string; icon: LucideIcon }> = {
    schedule_interview: { label: "Mời phỏng vấn", hint: "Lịch, địa điểm, link họp", icon: CalendarPlus },
    interview_reminder: { label: "Nhắc lịch", hint: "Gửi trước buổi phỏng vấn", icon: BellRing },
    offer: { label: "Thư mời nhận việc", hint: "Lương, ngày bắt đầu, hạn trả lời", icon: FileSignature },
    onboard_confirm: { label: "Xác nhận onboard", hint: "Ngày đi làm, đồ cần mang", icon: PartyPopper },
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
                    toast.info("Chế độ gửi lại — chỉ hiện ứng viên chưa phản hồi");
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
                toast.success("Đã tự điền biến");
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
                    toast.error(data.error ?? "Gửi hàng loạt thất bại");
                } else if (data.failed?.length > 0) {
                    toast.warning(`Đã gửi ${data.sent} người, lỗi ${data.failed.length}`);
                } else {
                    toast.success(`Đã gửi cho ${data.sent} người`);
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
                if (res.ok) toast.success(`Đã xếp hàng gửi tới ${primaryRecipient!.email}`);
                else {
                    const data = await res.json();
                    toast.error(data.error ?? "Gửi thất bại");
                }
            }
        } finally {
            setSending(false);
        }
    }

    const recipientSummary = recipients.length > 1
        ? `${recipients.length} người nhận`
        : primaryRecipient
          ? `${primaryRecipient.name} <${primaryRecipient.email}>`
          : "";

    const confirmRecipientLabel = isBulk
        ? `${recipients.length} người nhận`
        : primaryRecipient?.email ?? "-";

    const usedVars = currentTemplate ? extractUsedVariables(currentTemplate.body_html) : [];
    const missingVars = usedVars.filter(
        (k) => !variables[k]?.trim() && !(k === "candidate_name" && primaryRecipient),
    );
    const hasContext = Boolean(relatedId || position);

    const steps = [
        { done: Boolean(currentTemplate) },
        { done: recipients.length > 0 },
        { done: hasContext },
        { done: Boolean(currentTemplate) && missingVars.length === 0 },
    ];

    function pickType(next: TemplateType) {
        setType(next);
        setVariables({});
        setAutofilledKeys(new Set());
        setPosition(null);
        setSession(null);
        setRecipients([]);
        setJobApp(null);
        setRelatedType("");
        setRelatedId("");
    }

    const canSend = Boolean(type) && recipients.length > 0 && Boolean(currentTemplate) && !sending;

    return (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            {/* Trái: stepper dọc — đường nối theo dải flow, bước xong đổi thành dấu ✓ */}
            <ol className="relative space-y-4">
                <Step index={0} steps={steps} title="Chọn mẫu" subtitle="Loại email và ngôn ngữ">
                    <div className="grid grid-cols-2 gap-2.5">
                        {TEMPLATE_TYPES.map((t, i) => {
                            const meta = TYPE_META[t];
                            const tone = toneAt(i);
                            const active = type === t;
                            const exists = templates.some((x) => x.type === t && x.locale === locale);
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => pickType(t)}
                                    aria-pressed={active}
                                    className={cn(
                                        "flex items-start gap-3 rounded-xl border p-3 text-left transition",
                                        active ? "bg-card shadow-sm" : "border-border bg-muted/30 hover:bg-card",
                                    )}
                                    style={active ? { borderColor: tone.mark, boxShadow: `0 0 0 3px ${tone.bg}` } : undefined}
                                >
                                    <ToneIcon icon={meta?.icon ?? Mail} tone={tone} size="sm" />
                                    <span className="min-w-0">
                                        <span className="block text-sm font-bold text-foreground">{meta?.label ?? t}</span>
                                        <span className="block text-[11px] text-muted-foreground">
                                            {exists ? meta?.hint : `Chưa có mẫu ${locale.toUpperCase()}`}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">Ngôn ngữ</span>
                        <Segmented
                            size="sm"
                            value={locale}
                            onValueChange={setLocale}
                            options={[{ value: "vi", label: "Tiếng Việt" }, { value: "en", label: "English" }]}
                        />
                    </div>
                </Step>

                <Step index={1} steps={steps} title="Người nhận" subtitle="Tìm theo tên hoặc email" locked={!type}>
                    {recipientConfig?.sessionPickerEnabled && (
                        <SessionPicker value={session} onChange={setSession} disabled={!type} />
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
                </Step>

                <Step index={2} steps={steps} title="Ngữ cảnh" subtitle="Gắn bản ghi để tự điền biến" locked={!type}>
                    {type && (
                        <>
                            <PositionPicker value={position} onChange={setPosition} className="mb-3" />
                            {(type === "offer" || type === "onboard_confirm") && (
                                <JobApplicationPicker value={jobApp} onChange={setJobApp} className="mb-3" />
                            )}
                            {(type === "schedule_interview" || type === "interview_reminder") && session && (
                                <TonePill tone={toneByName("teal")} className="mb-3">
                                    Đã gắn: Vòng {session.round} · {session.jd_title ?? "Phiên phỏng vấn"}
                                </TonePill>
                            )}
                            <Button
                                variant="outline"
                                onClick={handleAutofill}
                                disabled={autofilling || !relatedType || !relatedId.trim()}
                                className="gap-2"
                            >
                                {autofilling ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                {autofilling ? "Đang tự điền..." : "Tự điền biến"}
                            </Button>
                            {!relatedId && (
                                <p className="mt-2 text-[11px] text-muted-foreground">
                                    Chọn phiên phỏng vấn hoặc hồ sơ ứng tuyển để bật tự điền.
                                </p>
                            )}
                        </>
                    )}
                </Step>

                <Step
                    index={3}
                    steps={steps}
                    title="Biến trong mẫu"
                    subtitle="Sửa giá trị trước khi gửi"
                    locked={!type}
                    last
                    aside={autofilledKeys.size > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success">
                            <Check className="h-3 w-3" /> {autofilledKeys.size} tự điền
                        </span>
                    )}
                >
                    {type && (
                        <VariableFields type={type} variables={variables} onChange={setVar} autofilledKeys={autofilledKeys} bodyHtml={currentTemplate?.body_html} />
                    )}
                </Step>
            </ol>

            {/* Phải: khung email như ứng dụng mail thật + checklist gửi */}
            <aside className="xl:sticky xl:top-24 space-y-4">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]">
                    <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
                        <span className="flex gap-1.5" aria-hidden>
                            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                        </span>
                        <span className="ml-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <Eye className="h-3.5 w-3.5" /> Xem trước
                        </span>
                        {type && (
                            <TonePill tone={toneAt(TEMPLATE_TYPES.indexOf(type))} className="ml-auto">
                                {TYPE_META[type]?.label ?? type} · {locale.toUpperCase()}
                            </TonePill>
                        )}
                    </div>
                    <dl className="divide-y divide-border text-sm">
                        <HeaderRow label="Tới" value={recipientSummary} fallback="Chưa chọn người nhận" />
                        <HeaderRow
                            label="Tiêu đề"
                            value={renderedSubject}
                            fallback={currentTemplate ? "Tiêu đề trống" : "Chọn mẫu để xem"}
                            strong
                        />
                    </dl>
                    {renderedBody ? (
                        <iframe
                            srcDoc={renderedBody}
                            sandbox="allow-same-origin"
                            className="h-[30rem] w-full border-t border-border bg-white"
                            title="Xem trước nội dung email"
                        />
                    ) : (
                        <div className="grid h-[30rem] place-items-center border-t border-border bg-muted/20 px-6 text-center">
                            <div>
                                <Mail className="mx-auto h-8 w-8 text-muted-foreground/50" />
                                <p className="mt-3 text-sm font-semibold text-foreground">Chưa có nội dung</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {type ? `Chưa có mẫu ${locale.toUpperCase()} cho loại này — đổi ngôn ngữ hoặc tạo trong Cài đặt.` : "Chọn một mẫu ở bước 1."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-border bg-card p-4">
                    <ul className="mb-4 grid grid-cols-3 gap-2 text-xs">
                        <Check3 ok={Boolean(currentTemplate)} label="Mẫu" />
                        <Check3 ok={recipients.length > 0} label={recipients.length > 1 ? `${recipients.length} người nhận` : "Người nhận"} />
                        <Check3
                            ok={Boolean(currentTemplate) && missingVars.length === 0}
                            warn={missingVars.length > 0}
                            label={missingVars.length > 0 ? `${missingVars.length} biến trống` : "Đủ biến"}
                        />
                    </ul>
                    <Button onClick={() => setShowConfirm(true)} disabled={!canSend} className="h-11 w-full gap-2 text-sm font-semibold">
                        <Send /> {recipients.length > 1 ? `Gửi cho ${recipients.length} người` : "Gửi email"}
                    </Button>
                </div>
            </aside>

            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Xác nhận gửi email</DialogTitle>
                        <DialogDescription>Kiểm tra lần cuối trước khi gửi.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2.5 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                        <ModalRow label="Tới" value={confirmRecipientLabel} />
                        <ModalRow label="Mẫu" value={type ? TYPE_META[type]?.label ?? type : "-"} />
                        <ModalRow label="Ngôn ngữ" value={locale === "vi" ? "Tiếng Việt" : "English"} />
                        {missingVars.length > 0 && (
                            <p className="flex items-start gap-1.5 pt-1 text-xs font-semibold" style={{ color: toneByName("orange").ink }}>
                                <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                                Còn trống: {missingVars.join(", ")}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirm(false)}>Huỷ</Button>
                        <Button onClick={handleSend} disabled={sending} className="gap-2">
                            {sending ? <Loader2 className="animate-spin" /> : <Check />}
                            {sending ? "Đang gửi..." : "Xác nhận gửi"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Step({
    index, steps, title, subtitle, locked, last, aside, children,
}: {
    index: number;
    steps: { done: boolean }[];
    title: string;
    subtitle: string;
    locked?: boolean;
    last?: boolean;
    aside?: ReactNode;
    children: ReactNode;
}) {
    const color = flowAt(index, steps.length);
    const done = steps[index].done;
    return (
        <li className="relative pl-12">
            {!last && (
                <span
                    aria-hidden
                    className="absolute left-[15px] top-9 -bottom-4 w-0.5 rounded-full"
                    style={{ backgroundColor: done ? color : "var(--border)" }}
                />
            )}
            <span
                className="absolute left-0 top-3 grid h-8 w-8 place-items-center rounded-full text-xs font-bold"
                style={done ? { backgroundColor: color, color: "#fff" } : { border: `2px solid ${color}`, color, backgroundColor: "var(--card)" }}
            >
                {done ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <section className={cn("rounded-2xl border border-border bg-card", locked && "opacity-55")}>
                <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                    <div>
                        <h2 className="text-sm font-bold text-foreground">{title}</h2>
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    </div>
                    {aside}
                </header>
                <div className="p-5">
                    {locked ? <p className="text-xs text-muted-foreground">Chọn mẫu ở bước 1 trước.</p> : children}
                </div>
            </section>
        </li>
    );
}

function HeaderRow({ label, value, fallback, strong }: { label: string; value: string; fallback: string; strong?: boolean }) {
    return (
        <div className="flex gap-3 px-4 py-2.5">
            <dt className="w-14 shrink-0 text-xs text-muted-foreground">{label}</dt>
            <dd className={cn("min-w-0 truncate", strong ? "font-bold text-foreground" : "text-foreground")}>
                {value || <span className="font-normal text-muted-foreground/70">{fallback}</span>}
            </dd>
        </div>
    );
}

function Check3({ ok, warn, label }: { ok: boolean; warn?: boolean; label: string }) {
    const orange = toneByName("orange");
    return (
        <li
            className={cn("flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-semibold", ok ? "bg-success/10 text-success" : !warn && "bg-muted text-muted-foreground")}
            style={warn ? { backgroundColor: orange.bg, color: orange.ink } : undefined}
        >
            {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : warn ? <AlertTriangle className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
            <span className="truncate">{label}</span>
        </li>
    );
}

function ModalRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{label}</span>
            <span className="truncate text-right font-semibold text-foreground">{value}</span>
        </div>
    );
}
