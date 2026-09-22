"use client";

import { useState } from "react";
import { Eye, EyeOff, Send, Save, Lock } from "lucide-react";
import { toast } from "sonner";
import type { SmtpConfigPublic } from "@/lib/email/smtp-credential";
import { SharedDashboardButton } from "@/components/shares";

interface SmtpTabProps {
    config: SmtpConfigPublic;
}

const inputClass =
    "w-full rounded-lg bg-card border border-border text-foreground text-sm px-3 py-2 placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 disabled:bg-muted/40 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors";

const labelClass = "block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]">
            <div className="px-5 py-4 border-b border-border/8">
                <p className="text-sm font-medium text-foreground">{title}</p>
                {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
            </div>
            <div className="p-5 space-y-4">{children}</div>
        </div>
    );
}

export default function SmtpTab({ config }: SmtpTabProps) {
    const [enabled, setEnabled] = useState(config.enabled);
    const [providerType, setProviderType] = useState(config.provider_type);
    const [senderEmail, setSenderEmail] = useState(config.sender_email ?? "");
    const [senderName, setSenderName] = useState(config.sender_name ?? "");
    const [smtpHost, setSmtpHost] = useState(config.smtp_host ?? "");
    const [smtpPort, setSmtpPort] = useState<number>(config.smtp_port ?? 465);
    const [smtpUsername, setSmtpUsername] = useState(config.smtp_username ?? "");
    const [smtpPassword, setSmtpPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [minInterval, setMinInterval] = useState(config.min_interval_seconds ?? 60);
    const [hasPassword, setHasPassword] = useState(config.has_password);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    const fieldsDisabled = !enabled;

    async function handleSave() {
        setSaving(true);
        try {
            const body: Record<string, unknown> = {
                enabled,
                provider_type: providerType,
                sender_email: senderEmail,
                sender_name: senderName,
                smtp_host: smtpHost || null,
                smtp_port: smtpPort,
                smtp_username: smtpUsername || null,
                min_interval_seconds: minInterval,
            };
            if (smtpPassword.trim()) {
                body.smtp_password = smtpPassword.trim();
            }

            const res = await fetch("/api/emails/smtp-config", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error ?? "Failed to save config");
                return;
            }
            setHasPassword(data.has_password);
            setSmtpPassword("");
            toast.success("SMTP configuration saved");
        } catch {
            toast.error("Network error while saving");
        } finally {
            setSaving(false);
        }
    }

    async function handleTestSend() {
        setTesting(true);
        try {
            const res = await fetch("/api/emails/test-send", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                toast.success("Test email sent successfully");
            } else {
                toast.error(data.error ?? "Test send failed");
            }
        } catch {
            toast.error("Network error during test send");
        } finally {
            setTesting(false);
        }
    }

    return (
        <div className="space-y-4 max-w-2xl">
            {/* Enable toggle */}
            <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-foreground">Enable custom SMTP</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Use your own SMTP server instead of the default provider
                        </p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        onClick={() => setEnabled((v) => !v)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none ${
                            enabled ? "bg-success" : "bg-muted-foreground/30"
                        }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${
                                enabled ? "translate-x-5" : "translate-x-0"
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* Provider */}
            <Section title="Provider" description="Outgoing mail provider and sender identity">
                <div>
                    <label className={labelClass}>Provider type</label>
                    <select
                        disabled={fieldsDisabled}
                        value={providerType}
                        onChange={(e) => setProviderType(e.target.value as SmtpConfigPublic["provider_type"])}
                        className={inputClass}
                    >
                        <option value="gmail_smtp">Gmail SMTP</option>
                        <option value="resend">Resend</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Sender email</label>
                        <input
                            type="email"
                            disabled={fieldsDisabled}
                            value={senderEmail}
                            onChange={(e) => setSenderEmail(e.target.value)}
                            placeholder="noreply@example.com"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Sender name</label>
                        <input
                            type="text"
                            disabled={fieldsDisabled}
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            placeholder="ITBA AI"
                            className={inputClass}
                        />
                    </div>
                </div>
            </Section>

            {/* SMTP Server */}
            <Section title="SMTP Server" description="Connection details for your mail server">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                        <label className={labelClass}>Host</label>
                        <input
                            type="text"
                            disabled={fieldsDisabled}
                            value={smtpHost}
                            onChange={(e) => setSmtpHost(e.target.value)}
                            placeholder="smtp.gmail.com"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Port</label>
                        <input
                            type="number"
                            disabled={fieldsDisabled}
                            value={smtpPort}
                            onChange={(e) => setSmtpPort(Number(e.target.value))}
                            placeholder="465"
                            className={inputClass}
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Username</label>
                    <input
                        type="text"
                        disabled={fieldsDisabled}
                        value={smtpUsername}
                        onChange={(e) => setSmtpUsername(e.target.value)}
                        placeholder="you@gmail.com"
                        className={inputClass}
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className={labelClass + " mb-0"}>Password</label>
                        {hasPassword && !smtpPassword && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success uppercase tracking-wide">
                                <Lock className="w-3 h-3" />
                                Saved (encrypted)
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            disabled={fieldsDisabled}
                            value={smtpPassword}
                            onChange={(e) => setSmtpPassword(e.target.value)}
                            placeholder={hasPassword ? "Enter new password to replace" : "App password or API key"}
                            className={inputClass + " pr-10"}
                        />
                        <SharedDashboardButton
                            type="button"
                            disabled={fieldsDisabled}
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </SharedDashboardButton>
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Min send interval (seconds)</label>
                    <input
                        type="number"
                        disabled={fieldsDisabled}
                        value={minInterval}
                        onChange={(e) => setMinInterval(Number(e.target.value))}
                        min={0}
                        className={inputClass}
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                        Minimum time between outgoing emails to avoid rate limiting
                    </p>
                </div>
            </Section>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
                <SharedDashboardButton
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save changes"}
                </SharedDashboardButton>

                <SharedDashboardButton
                    type="button"
                    onClick={handleTestSend}
                    disabled={testing || !enabled || !hasPassword}
                    title={!enabled ? "Enable SMTP first" : !hasPassword ? "Save a password first" : "Send a test email to yourself"}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border/15 text-muted-foreground hover:text-foreground hover:border-border/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                    <Send className="w-4 h-4" />
                    {testing ? "Sending..." : "Send test email"}
                </SharedDashboardButton>
            </div>
        </div>
    );
}
