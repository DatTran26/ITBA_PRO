"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, Check, Briefcase, X } from "lucide-react";
import { SharedDashboardButton } from "@/components/shares";

interface Position {
    id: string;
    title: string;
    department: string | null;
}

interface Props {
    value: Position | null;
    onChange: (pos: Position | null) => void;
    className?: string;
}

export default function PositionPicker({ value, onChange, className = "" }: Props) {
    const [open, setOpen]           = useState(false);
    const [query, setQuery]         = useState("");
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading]     = useState(false);
    const containerRef              = useRef<HTMLDivElement>(null);
    const inputRef                  = useRef<HTMLInputElement>(null);

    // Fetch job descriptions once
    useEffect(() => {
        setLoading(true);
        fetch("/api/recruitment/job-descriptions")
            .then((r) => r.json())
            .then(({ jobDescriptions }) => setPositions(jobDescriptions ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Close on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filtered = query.trim()
        ? positions.filter((p) => p.title.toLowerCase().includes(query.toLowerCase()) ||
                                  (p.department ?? "").toLowerCase().includes(query.toLowerCase()))
        : positions;

    function handleSelect(pos: Position) {
        onChange(pos);
        setQuery("");
        setOpen(false);
    }

    function handleClear(e: React.MouseEvent) {
        e.stopPropagation();
        onChange(null);
        setQuery("");
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        setQuery(e.target.value);
        if (!open) setOpen(true);
    }

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger / input */}
            <div
                onClick={() => { setOpen(true); inputRef.current?.focus(); }}
                className="flex items-center gap-2 w-full bg-[#0A1020] border border-white/10 rounded-xl px-3 py-2.5 cursor-text"
            >
                <Briefcase className="w-3.5 h-3.5 text-cyan-200/60 shrink-0" />
                <input
                    ref={inputRef}
                    value={open ? query : (value?.title ?? "")}
                    onChange={handleInputChange}
                    onFocus={() => setOpen(true)}
                    placeholder={loading ? "Loading..." : "Search position..."}
                    className="flex-1 bg-transparent text-sm text-[#F6F8FC] placeholder:text-slate-600 outline-none min-w-0"
                />
                {value && !open ? (
                    <SharedDashboardButton onClick={handleClear} className="text-slate-500 hover:text-slate-300 transition-colors">
                        <X className="w-3.5 h-3.5" />
                    </SharedDashboardButton>
                ) : (
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
                )}
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 top-full mt-1.5 w-full bg-[#0D1628] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-slate-500">
                                {query ? "No matching positions" : "No positions found"}
                            </p>
                        ) : (
                            filtered.map((pos) => (
                                <SharedDashboardButton
                                    key={pos.id}
                                    onClick={() => handleSelect(pos)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.06] transition-colors group"
                                >
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-sm text-[#F6F8FC] truncate">{pos.title}</span>
                                        {pos.department && (
                                            <span className="block text-xs text-slate-500 truncate">{pos.department}</span>
                                        )}
                                    </span>
                                    {value?.id === pos.id && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                                </SharedDashboardButton>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
