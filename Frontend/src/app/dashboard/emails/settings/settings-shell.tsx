"use client";

import { useState } from "react";
import { FileText, Server } from "lucide-react";
import SmtpTab from "./smtp-tab";
import TemplatesTab from "./templates-tab";
import type { SmtpConfigPublic } from "@/lib/email/smtp-credential";

interface SettingsShellProps {
    config: SmtpConfigPublic;
    canEdit: boolean;
}

const TABS = [
    { key: "templates", label: "Templates", icon: FileText },
    { key: "smtp", label: "SMTP", icon: Server },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SettingsShell({ config, canEdit }: SettingsShellProps) {
    const [tab, setTab] = useState<TabKey>("templates");

    return (
        <div>
            <div className="flex gap-1 mb-6 bg-muted/60 rounded-xl p-1 w-fit max-w-full overflow-x-auto border border-border">
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button
                        type="button"
                        key={key}
                        onClick={() => setTab(key)}
                        aria-pressed={tab === key}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                            tab === key
                                ? "bg-card text-primary shadow-sm border border-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                        }`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                    </button>
                ))}
            </div>

            {tab === "templates" && <TemplatesTab canEdit={canEdit} />}
            {tab === "smtp" && <SmtpTab config={config} />}
        </div>
    );
}
