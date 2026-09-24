"use client";

import { useState, useEffect, useRef } from "react";
import { CalendarClock, ChevronDown, Check, X } from "lucide-react";

export interface SessionLite {
    id: string;
    round: 1 | 2 | 3;
    scheduled_at: string;
    candidate_count: number;
    jd_title: string | null;
}

interface Props {
    value: SessionLite | null;
    onChange: (s: SessionLite | null) => void;
    disabled?: boolean;
}

function formatSessionLabel(s: SessionLite): string {
    const date = new Date(s.scheduled_at).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
    const parts = [`Round ${s.round}`];
    if (s.jd_title) parts.push(s.jd_title);
    parts.push(date);
    parts.push(`${s.candidate_count} candidates`);
    return parts.join(" • ");
}

export default function SessionPicker({ value, onChange, disabled = false }: Props) {
    const [open, setOpen]         = useState(false);
    const [query, setQuery]       = useState("");
    const [sessions, setSessions] = useState<SessionLite[]>([]);
    const [loading, setLoading]   = useState(false);
    const containerRef            = useRef<HTMLDivElement>(null);
    const inputRef                = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch("/api/recruitment/sessions")
            .then((r) => r.json())
            .then(({ sessions: raw }) => {
                const mapped: SessionLite[] = (raw ?? []).map((s: {
                    id: string;
                    round: 1 | 2 | 3;
                    scheduled_at: string;
                    candidate_count: number;
                    job_descriptions: { title: string } | { title: string }[] | null;
                }) => {
                    const jd = Array.isArray(s.job_descriptions)
                        ? (s.job_descriptions[0] ?? null)
                        : s.job_descriptions;
                    return {
                        id: s.id,
                        round: s.round,
                        scheduled_at: s.scheduled_at,
                        candidate_count: s.candidate_count,
                        jd_title: jd?.title ?? null,
                    };
                });
                setSessions(mapped);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filtered = query.trim()
        ? sessions.filter((s) =>
            (s.jd_title ?? "").toLowerCase().includes(query.toLowerCase()) ||
            `round ${s.round}`.includes(query.toLowerCase())
          )
        : sessions;

    function handleSelect(s: SessionLite) {
        onChange(s);
        setQuery("");
        setOpen(false);
    }

    function handleClear(e: React.MouseEvent) {
        e.stopPropagation();
        onChange(null);
        setQuery("");
    }

    const displayValue = !open && value ? formatSessionLabel(value) : query;

    return (
        <div ref={containerRef} className={`relative${disabled ? " opacity-50 pointer-events-none" : ""}`}>
            <div
                onClick={() => { setOpen(true); inputRef.current?.focus(); }}
                className="flex items-center gap-2 w-full bg-card border border-border rounded-xl px-3 py-2.5 cursor-text focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/15"
            >
                <CalendarClock className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                <input
                    ref={inputRef}
                    value={displayValue}
                    onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    placeholder={loading ? "Đang tải phiên..." : "Chọn phiên phỏng vấn..."}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 outline-none min-w-0"
                />
                {value && !open ? (
                    <button type="button" onClick={handleClear} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-3.5 h-3.5" />
                    </button>
                ) : (
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
                )}
            </div>

            {open && (
                <div className="absolute z-50 top-full mt-1.5 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-muted-foreground">
                                {query ? "Không có phiên khớp" : "Chưa có phiên nào"}
                            </p>
                        ) : (
                            filtered.map((s) => (
                                <button
                                    type="button"
                                    key={s.id}
                                    onClick={() => handleSelect(s)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted transition-colors"
                                >
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-sm text-primary truncate">
                                            Round {s.round}{s.jd_title ? ` • ${s.jd_title}` : ""}
                                        </span>
                                        <span className="block text-xs text-muted-foreground truncate">
                                            {new Date(s.scheduled_at).toLocaleDateString("vi-VN", {
                                                weekday: "short", day: "2-digit", month: "2-digit", year: "numeric",
                                            })} • {s.candidate_count} candidates
                                        </span>
                                    </span>
                                    {value?.id === s.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
