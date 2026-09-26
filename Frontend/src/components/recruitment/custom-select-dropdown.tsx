"use client";
import { alpha } from "@/lib/utils";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption { value: string; label: string }

interface CustomSelectDropdownProps {
    value: string;
    onChange: (val: string) => void;
    options: SelectOption[];
    placeholder?: string;
    allowCustomInput?: boolean;
    accentColor?: string;
    className?: string;
    error?: boolean;
    placement?: "bottom" | "top";
}

export default function CustomSelectDropdown({
    value, onChange, options, placeholder = "Chọn…",
    allowCustomInput = false, accentColor = "var(--primary)", className = "",
    error = false, placement = "bottom"
}: CustomSelectDropdownProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onDown(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, []);

    // reset query when closing
    const filtered = options.filter((o) =>
        !query || o.label.toLowerCase().includes(query.toLowerCase())
    );
    const displayLabel = value ? (options.find((o) => o.value === value)?.label ?? value) : "";

    function select(val: string) { onChange(val); setQuery(""); setOpen(false); }

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {allowCustomInput ? (
                <div className="relative">
                    <input
                        value={open ? query : displayLabel}
                        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
                        onFocus={() => setOpen(true)}
                        placeholder={placeholder}
                        className={`w-full h-9 pl-3 pr-8 bg-background/70 border text-foreground text-sm rounded-xl focus:outline-none placeholder:text-muted-foreground transition-all ${error ? "border-danger/40" : "border-muted-foreground/15"
                            }`}
                        style={{ borderColor: open ? `${alpha(accentColor, 50)}` : (error ? undefined : undefined) }}
                    />
                    <button type="button" onClick={() => setOpen((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors cursor-pointer">
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                    </button>
                </div>
            ) : (
                <button type="button" onClick={() => setOpen((v) => !v)}
                    className={`w-full h-9 pl-3 pr-8 bg-background/70 border rounded-xl text-sm text-left flex items-center transition-all cursor-pointer relative ${error ? "border-danger/40" : "border-muted-foreground/15"
                        }`}
                    style={{ borderColor: open ? `${alpha(accentColor, 50)}` : (error ? undefined : undefined), color: value ? "var(--foreground)" : "var(--muted-foreground)" }}>
                    <span className="truncate flex-1">{displayLabel || placeholder}</span>
                    <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                </button>
            )}

            {open && (
                <div className={`absolute left-0 right-0 ${placement === "bottom" ? "top-full mt-1" : "bottom-full mb-1"} bg-background border border-muted rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] z-50 max-h-[180px] overflow-y-auto`}>
                    {value && (
                        <button type="button" onMouseDown={() => select("")}
                            className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:bg-muted-foreground/8 cursor-pointer transition-colors italic">
                            Bỏ chọn
                        </button>
                    )}
                    {filtered.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-muted-foreground italic">Không có kết quả</p>
                    ) : (
                        filtered.map((opt) => (
                            <button key={opt.value} type="button" onMouseDown={() => select(opt.value)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-muted-foreground/8 cursor-pointer transition-colors flex items-center justify-between gap-2"
                                style={{ color: value === opt.value ? accentColor : "var(--muted-foreground)" }}>
                                <span className="truncate flex-1">{opt.label}</span>
                                {value === opt.value && <Check className="w-3 h-3 shrink-0" style={{ color: accentColor }} />}
                            </button>
                        ))
                    )}
                    {allowCustomInput && query && !options.some((o) => o.label.toLowerCase() === query.toLowerCase()) && (
                        <button type="button" onMouseDown={() => select(query)}
                            className="w-full text-left px-4 py-2 text-sm border-t border-muted cursor-pointer transition-colors flex items-center gap-2"
                            style={{ color: accentColor }}>
                            <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">Thêm mới</span>
                            &ldquo;{query}&rdquo;
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
