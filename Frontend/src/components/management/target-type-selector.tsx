"use client";

import { Users, UserCheck } from "lucide-react";

interface Props {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    allowedTypes?: string[]; // if omitted, all types shown
}

const OPTIONS = [
    { value: "candidate", label: "Candidate", icon: Users, desc: "For external applicants" },
    { value: "employee", label: "Employee", icon: UserCheck, desc: "For internal evaluation" },
];

export default function TargetTypeSelector({ value, onChange, disabled, allowedTypes }: Props) {
    const visibleOptions = allowedTypes
        ? OPTIONS.filter((o) => allowedTypes.includes(o.value))
        : OPTIONS;

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                Assessment Type<span className="text-red-500 text-sm font-bold ml-1">*</span>
            </span>
            <div className={`grid gap-3 ${visibleOptions.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {visibleOptions.map((opt) => {
                    const Icon = opt.icon;
                    const active = value === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange(opt.value)}
                            className={`flex flex-col items-start gap-2 p-3 rounded-xl border text-left transition-all duration-300 disabled:opacity-50 ${
                                active
                                    ? "bg-primary border-border text-white shadow-[0_4px_15px_-3px_color-mix(in_srgb,var(--primary)_40%,transparent)] ring-1 ring-primary"
                                    : "bg-muted/50 border-border text-muted-foreground hover:border-border hover:bg-muted hover:text-white"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Icon className={`w-3.5 h-3.5 ${active ? "text-foreground" : "text-muted-foreground"}`} />
                                <div className="text-[11px] font-bold tracking-wide">{opt.label}</div>
                            </div>
                            <div className="text-[9px] opacity-70 leading-tight">{opt.desc}</div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
