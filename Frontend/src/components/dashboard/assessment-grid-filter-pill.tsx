"use client";

import { useState } from "react";
import { Search, ChevronDown, Check, Briefcase, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Searchable role/level filter pill used in the assessment grid toolbar.
// Split out of assessment-grid.tsx.
export default function FilterPill({ value, onChange, options, allLabel, labels, type = "role" }: {
    value: string;
    onChange: (v: string) => void;
    options: string[];
    allLabel: string;
    labels?: Record<string, string>;
    type?: "role" | "level";
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const isActive = !!value;

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(search.toLowerCase()) ||
        (labels?.[opt] || "").toLowerCase().includes(search.toLowerCase())
    );

    const Icon = type === "role" ? Briefcase : Sparkles;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                className={`h-9 rounded-2xl text-xs px-4 flex items-center gap-2 transition-all duration-300 font-bold border outline-none cursor-pointer ${
                    isActive
                        ? "bg-warning/15 text-warning border-warning/30"
                        : "bg-transparent text-muted-foreground border-transparent hover:text-muted-foreground hover:bg-muted"
                }`}
            >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-warning" : "text-muted-foreground"}`} />
                <span className="truncate max-w-[120px]">
                    {isActive ? (labels?.[value] || value) : allLabel}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="p-1.5 w-[260px] bg-background/98 backdrop-blur-2xl border-muted-foreground/20 rounded-[1.2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[60]"
            >
                <div className="relative mb-1.5 px-1 pt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                        placeholder={`Search ${type}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 bg-muted border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-warning/30 focus:bg-white/[0.08] transition-all"
                    />
                </div>

                <div className="max-h-[280px] overflow-y-auto custom-scrollbar px-0.5 space-y-0.5">
                    {/* All Option */}
                    <button
                        onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            !isActive ? "bg-warning/10 text-warning" : "hover:bg-muted text-muted-foreground"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${!isActive ? "bg-warning" : "bg-muted-foreground/40"}`} />
                             {allLabel}
                        </div>
                        {!isActive && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <div className="h-px bg-muted my-1 mx-2" />

                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => { onChange(opt); setOpen(false); setSearch(""); }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                                    value === opt ? "bg-warning/10 text-warning" : "hover:bg-muted text-muted-foreground"
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Icon className={`w-3.5 h-3.5 transition-colors ${value === opt ? "text-warning" : "text-muted-foreground group-hover:text-muted-foreground"}`} />
                                    <span className="truncate max-w-[180px]">{labels?.[opt] || opt}</span>
                                </div>
                                {value === opt && <Check className="w-3.5 h-3.5" />}
                            </button>
                        ))
                    ) : (
                        <div className="py-8 text-center text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                            No match found
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
