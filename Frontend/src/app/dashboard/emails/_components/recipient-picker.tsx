"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Search, UserRound, X } from "lucide-react";
import { emailInputClass } from "./email-page-chrome";
import { SharedDashboardButton } from "@/components/shares";

interface Recipient {
    id: string;
    name: string;
    email: string;
}

interface Props {
    value: Recipient[];
    onChange: (next: Recipient[]) => void;
    type: string;
    gate?: string;
    mode?: "single" | "multi";
    disabled?: boolean;
}

function RecipientChip({ recipient, onRemove }: { recipient: Recipient; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-300/15 px-2.5 py-1 text-xs font-medium text-cyan-200">
            {recipient.name}
            <SharedDashboardButton
                type="button"
                onClick={onRemove}
                className="rounded-sm text-cyan-300/60 transition hover:text-cyan-100"
                aria-label={`Remove ${recipient.name}`}
            >
                <X className="h-3 w-3" />
            </SharedDashboardButton>
        </span>
    );
}

export default function RecipientPicker({ value, onChange, type, gate, mode = "single", disabled = false }: Props) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Recipient[]>([]);
    const [open, setOpen] = useState(false);
    const [focused, setFocused] = useState(false);
    const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Single mode: keep input text synced with selected value
    const singleDisplay = mode === "single" && value.length > 0
        ? `${value[0].name} <${value[0].email}>`
        : "";

    useEffect(() => {
        if (mode === "single") setQuery(singleDisplay);
    }, [mode, singleDisplay]);

    // Update portal position when open
    useEffect(() => {
        if (open && wrapperRef.current) {
            setDropdownRect(wrapperRef.current.getBoundingClientRect());
        }
    }, [open, results]);

    // Reposition on scroll/resize
    useEffect(() => {
        if (!open) return;
        const update = () => {
            if (wrapperRef.current) setDropdownRect(wrapperRef.current.getBoundingClientRect());
        };
        window.addEventListener("scroll", update, true);
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update, true);
            window.removeEventListener("resize", update);
        };
    }, [open]);

    useEffect(() => {
        if (disabled) return;
        if (mode === "single" && value.length > 0 && query === singleDisplay) {
            setResults([]);
            return;
        }
        if (query.length === 1) { setResults([]); setOpen(false); return; }
        if (query.length === 0 && !focused) { setResults([]); setOpen(false); return; }

        clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            const gateParam = gate ? `&gate=${encodeURIComponent(gate)}` : "";
            const res = await fetch(`/api/emails/recipients?type=${encodeURIComponent(type)}&q=${encodeURIComponent(query)}${gateParam}`);
            if (res.ok) {
                const data: Recipient[] = await res.json();
                const filtered = mode === "multi"
                    ? data.filter((r) => !value.some((v) => v.id === r.id))
                    : data;
                setResults(filtered);
                setOpen(filtered.length > 0);
            }
        }, query.length === 0 ? 0 : 300);
        return () => clearTimeout(timer.current);
    }, [query, type, mode, disabled, focused]); // eslint-disable-line react-hooks/exhaustive-deps

    function select(recipient: Recipient) {
        if (mode === "multi") {
            onChange([...value, recipient]);
            setQuery("");
        } else {
            onChange([recipient]);
            setQuery(`${recipient.name} <${recipient.email}>`);
        }
        setResults([]);
        setOpen(false);
    }

    function removeAt(index: number) {
        onChange(value.filter((_, i) => i !== index));
    }

    function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        const next = event.target.value;
        setQuery(next);
        if (!next && mode === "single") onChange([]);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (mode === "multi" && event.key === "Backspace" && query === "" && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    }

    const dropdown = open && results.length > 0 && dropdownRect ? createPortal(
        <ul
            style={{
                position: "fixed",
                top: dropdownRect.bottom + 8,
                left: dropdownRect.left,
                width: dropdownRect.width,
                zIndex: 9999,
            }}
            className="overflow-hidden rounded-2xl border border-border bg-background p-1 shadow-2xl shadow-black/40"
        >
            {results.map((recipient) => (
                <li key={recipient.id}>
                    <SharedDashboardButton
                        type="button"
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/[0.06]"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => select(recipient)}
                    >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300/12 text-cyan-200">
                            <UserRound className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-primary">{recipient.name}</span>
                            <span className="block truncate text-xs text-slate-500">{recipient.email}</span>
                        </span>
                    </SharedDashboardButton>
                </li>
            ))}
        </ul>,
        document.body
    ) : null;

    return (
        <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
            {mode === "multi" && value.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                    {value.map((r, i) => (
                        <RecipientChip key={r.id} recipient={r} onRemove={() => removeAt(i)} />
                    ))}
                </div>
            )}
            <div ref={wrapperRef} className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <input
                    ref={inputRef}
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setFocused(true)}
                    onBlur={() => { setFocused(false); setTimeout(() => setOpen(false), 150); }}
                    disabled={disabled}
                    placeholder={disabled ? "Select a template type first..." : "Search by name or email..."}
                    className={`${emailInputClass} pl-11`}
                />
            </div>
            {dropdown}
        </div>
    );
}
