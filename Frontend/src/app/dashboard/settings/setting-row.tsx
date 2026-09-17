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
    "h-9 rounded-lg px-3 text-sm font-mono text-[#ECF0F7] outline-none transition-all",
    "bg-[#0C1220]/60 border border-[#8B99B0]/15",
    "focus:border-[#7C8FFF]/50 focus:ring-2 focus:ring-[#7C8FFF]/15",
    "placeholder:text-[#5A6882]/50",
].join(" ");

const rowCls = [
    "group relative flex items-center justify-between",
    "px-5 py-4 border-b border-white/[0.04] last:border-0",
    "hover:bg-white/[0.025] transition-colors rounded-xl",
].join(" ");

function SettingLabel({ label, description }: { label: string; description: string | null }) {
    return (
        <div className="flex-1 min-w-0 pr-6">
            <p className="text-sm font-semibold text-[#D4DBE8]">{label}</p>
            {description && <p className="text-xs text-[#5A6882] mt-0.5 leading-relaxed">{description}</p>}
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
                <div className="flex-1 min-w-0 pr-6">
                    <p className="text-sm font-semibold text-[#D4DBE8]">{setting.label}</p>
                    {setting.description && (
                        <p className="text-xs text-[#5A6882] mt-0.5 leading-relaxed">{setting.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {hasExistingKey ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#36DDAB]/10 text-[#36DDAB] border border-[#36DDAB]/20">
                                <ShieldCheck className="w-3 h-3" /> Key configured
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F59E42]/10 text-[#F59E42] border border-[#F59E42]/20">
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
                        className={`${inputCls} w-72 pr-9`}
                    />
                    <SharedDashboardButton
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A6882] hover:text-[#ECF0F7] transition-colors"
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
                        isOn ? "bg-[#36DDAB] shadow-[#36DDAB]/20" : "bg-[#1E2840]"
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
                    <p className="text-sm font-semibold text-[#D4DBE8]">{setting.label}</p>
                    {setting.description && (
                        <p className="text-xs text-[#5A6882] mt-0.5 leading-relaxed">{setting.description}</p>
                    )}
                    {showTester && (
                        <div className="mt-2">
                            <AiApiTesterModal models={testerModels} />
                        </div>
                    )}
                </div>
                <Select value={localValue} onValueChange={(v) => handleChange(v ?? localValue)}>
                    <SelectTrigger className="w-48 bg-[#0C1220]/60 border-[#8B99B0]/15 text-[#ECF0F7] h-9 text-sm rounded-lg focus:border-[#7C8FFF]/50 focus:ring-2 focus:ring-[#7C8FFF]/15 transition-all">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#101828] border-[#8B99B0]/15 text-[#ECF0F7] rounded-xl shadow-2xl">
                        {setting.options.map((opt) => (
                            <SelectItem key={opt} value={opt} className="focus:bg-[#1E2840] focus:text-[#ECF0F7] rounded-lg">
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
                className={`${inputCls} w-48 text-right`}
            />
        </div>
    );
}
