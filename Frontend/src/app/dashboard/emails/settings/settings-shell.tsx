"use client";

import { useState } from "react";
import { FileText, Server } from "lucide-react";
import SmtpTab from "./smtp-tab";
import TemplatesTab from "./templates-tab";
import type { SmtpConfigPublic } from "@/lib/email/smtp-credential";
import { SharedDashboardButton } from "@/components/shares";

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
            <div className="flex gap-0.5 mb-6 bg-[#0C1422] rounded-xl p-1 w-fit border border-[#8B99B0]/10">
                {TABS.map(({ key, label, icon: Icon }) => (
                    <SharedDashboardButton
                        key={key}
                        onClick={() => setTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all cursor-pointer ${
                            tab === key
                                ? "bg-[#1A2236] text-[#ECF0F7] font-medium shadow-sm"
                                : "text-[#5A6882] hover:text-[#8B99B0]"
                        }`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                    </SharedDashboardButton>
                ))}
            </div>

            {tab === "templates" && <TemplatesTab canEdit={canEdit} />}
            {tab === "smtp" && <SmtpTab config={config} />}
        </div>
    );
}
