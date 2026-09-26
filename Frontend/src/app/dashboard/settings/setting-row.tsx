"use client";

import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, ShieldAlert } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AiApiTesterModal } from "./ai-api-tester-modal";
import { SharedDashboardButton } from "@/components/shares";
import { SETTINGS_MASK_PLACEHOLDER } from "@/lib/settings/sensitive";

export type InputType = "text" | "number" | "select" | "toggle" | "json" | "password";

export type SystemSetting = {
    id: string;
    key: string;
    value: unknown;
    category: string;
    label: string;
    description: string | null;
    input_type: InputType;
    options: string[] | null;
};

const inputCls = [
    "h-9 rounded-lg px-3 text-sm font-mono text-foreground outline-none transition-all",
    "bg-background/60 border border-border/15",
    "focus:border-border/50 focus:ring-2 focus:ring-primary/15",
    "placeholder:text-muted-foreground/50",
].join(" ");

const rowCls = [
    "group relative flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between",
    "px-5 py-4 border-b border-border last:border-0",
    "hover:bg-muted/50 transition-colors",
].join(" ");

function SettingLabel({ label, description }: { label: string; description: string | null }) {
    return (
        <div className="flex-1 min-w-0 sm:pr-6">
            <p className="text-sm font-bold text-foreground">{label}</p>
            {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
        </div>
    );
}

export function SettingRow({
    setting,
    onChange,
    showTester = false,
    testerModels,
}: {
    setting: SystemSetting;
    onChange: (key: string, value: unknown) => void;
    showTester?: boolean;
    testerModels?: string[];
}) {
    const [localValue, setLocalValue] = useState(String(setting.value ?? ""));
    const [showPassword, setShowPassword] = useState(false);

    const isMasked = setting.input_type === "password" && localValue === SETTINGS_MASK_PLACEHOLDER;
    const hasExistingKey = setting.input_type === "password" && localValue !== "" && localValue !== '""';

    function handleChange(raw: string) {
        setLocalValue(raw);
        const parsed: unknown =
            setting.input_type === "number" ? Number(raw) :
            setting.input_type === "toggle" ? raw === "true" :
            setting.input_type === "json" ? (() => { try { return JSON.parse(raw); } catch { return raw; } })() :
            raw;
        onChange(setting.key, parsed);
    }

    // PASSWORD
    if (setting.input_type === "password") {
        return (
            <div className={rowCls}>
                <div className="flex-1 min-w-0 sm:pr-6">
                    <p className="text-sm font-bold text-foreground">{setting.label}</p>
                    {setting.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{setting.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {hasExistingKey ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-success/10 text-success border border-border/20">
                                <ShieldCheck className="w-3 h-3" /> Key configured
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-warning/10 text-warning border border-border/20">
                                <ShieldAlert className="w-3 h-3" /> Not configured
                            </span>
                        )}
                        {showTester && <AiApiTesterModal models={testerModels} />}
                    </div>
                </div>
                <div className="relative shrink-0">
                    <input
                        value={isMasked ? "" : localValue === '""' ? "" : localValue}
                        type={showPassword ? "text" : "password"}
                        placeholder={
                            hasExistingKey
                                ? "Enter new key to replace..."
                                : setting.key === "gemini_api_key"
                                    ? "AIza..."
                                    : "sk-proj-..."
                        }
                        autoComplete="off"
                        spellCheck={false}
                        onCopy={(e) => e.preventDefault()}
                        onCut={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        onChange={(e) => handleChange(e.target.value)}
                        className={`${inputCls} w-full sm:w-72 pr-9`}
                    />
                    <SharedDashboardButton
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </SharedDashboardButton>
                </div>
            </div>
        );
    }

    // TOGGLE
    if (setting.input_type === "toggle") {
        const isOn = localValue === "true";
        return (
            <div className={rowCls}>
                <SettingLabel label={setting.label} description={setting.description} />
                <SharedDashboardButton
                    type="button"
                    role="switch"
                    aria-checked={isOn}
                    onClick={() => handleChange(String(!isOn))}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-all cursor-pointer focus-visible:outline-none shadow-inner ${
                        isOn ? "bg-success shadow-success/20" : "bg-muted"
                    }`}
                >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform ${isOn ? "translate-x-5" : "translate-x-1"}`} />
                </SharedDashboardButton>
            </div>
        );
    }

    // SELECT
    if (setting.input_type === "select" && setting.options?.length) {
        return (
            <div className={rowCls}>
                <div className="flex-1 min-w-0 pr-6">
                    <p className="text-sm font-semibold text-foreground">{setting.label}</p>
                    {setting.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{setting.description}</p>
                    )}
                    {showTester && (
                        <div className="mt-2">
                            <AiApiTesterModal models={testerModels} />
                        </div>
                    )}
                </div>
                <Select value={localValue} onValueChange={(v) => handleChange(v ?? localValue)}>
                    <SelectTrigger className="w-full sm:w-48 bg-background/60 border-border/15 text-foreground h-9 text-sm rounded-lg focus:border-border/50 focus:ring-2 focus:ring-primary/15 transition-all">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border/15 text-foreground rounded-xl shadow-2xl">
                        {setting.options.map((opt) => (
                            <SelectItem key={opt} value={opt} className="focus:bg-muted focus:text-foreground rounded-lg">
                                {opt}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        );
    }

    // TEXT / NUMBER
    return (
        <div className={rowCls}>
            <SettingLabel label={setting.label} description={setting.description} />
            <input
                value={localValue}
                type={setting.input_type === "number" ? "number" : "text"}
                onChange={(e) => handleChange(e.target.value)}
                className={`${inputCls} w-full sm:w-48 text-right`}
            />
        </div>
    );
}
