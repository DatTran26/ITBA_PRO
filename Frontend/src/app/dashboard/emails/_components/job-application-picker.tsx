"use client";

import { useRef, useState, useEffect } from "react";
import { Search, FileText, X } from "lucide-react";
import { emailInputClass } from "./email-page-chrome";
import { SharedDashboardButton } from "@/components/shares";

export interface JobApp {
    id: string;
    candidate_name: string;
    position_title: string;
    pipeline_status: string;
}

interface Props {
    value: JobApp | null;
    onChange: (app: JobApp | null) => void;
    className?: string;
}

const STATUS_LABELS: Record<string, string> = {
    NEW: "New", SCREENING: "Screening", INTERVIEW_1: "Round 1", INTERVIEW_2: "Round 2",
    INTERVIEW_3: "Round 3", OFFERED: "Offered", ACCEPTED: "Accepted",
    OFFER_REJECTED: "Offer Rejected", ONBOARDED: "Onboarded", REJECTED: "Rejected",
};

export default function JobApplicationPicker({ value, onChange, className = "" }: Props) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<JobApp[]>([]);
    const [open, setOpen] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Display selected value in input when not focused
    const displayValue = !open && value ? `${value.candidate_name} - ${value.position_title}` : query;

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (query.length < 2) { setResults([]); return; }
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            const res = await fetch(`/api/emails/job-applications?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data: JobApp[] = await res.json();
                setResults(data);
                setOpen(data.length > 0);
            }
        }, 300);
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [query]);

    function select(app: JobApp) {
        onChange(app);
        setQuery("");
        setOpen(false);
    }

    function handleClear(e: React.MouseEvent) {
        e.stopPropagation();
        onChange(null);
        setQuery("");
        setResults([]);
    }

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <input
                    value={displayValue}
                    onChange={(e) => { setQuery(e.target.value); if (!e.target.value) onChange(null); }}
                    onFocus={() => { if (value) setQuery(""); setOpen(results.length > 0); }}
                    placeholder="Search job application by candidate name..."
                    className={`${emailInputClass} pl-11 pr-10`}
                />
                {value && (
                    <SharedDashboardButton onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        <X className="h-3.5 w-3.5" />
                    </SharedDashboardButton>
                )}
            </div>

            {open && results.length > 0 && (
                <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0B1220] p-1 shadow-2xl shadow-black/40">
                    {results.map((app) => (
                        <li key={app.id}>
                            <SharedDashboardButton
                                type="button"
                                onClick={() => select(app)}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/[0.06]"
                            >
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300/12 text-cyan-200 shrink-0">
                                    <FileText className="h-4 w-4" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-medium text-[#F6F8FC]">{app.candidate_name}</span>
                                    <span className="block truncate text-xs text-slate-500">
                                        {app.position_title}
                                        {app.pipeline_status && (
                                            <span className="ml-2 text-slate-600">• {STATUS_LABELS[app.pipeline_status] ?? app.pipeline_status}</span>
                                        )}
                                    </span>
                                </span>
                            </SharedDashboardButton>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
