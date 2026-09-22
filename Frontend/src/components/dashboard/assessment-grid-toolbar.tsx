"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/ui/motion-wrapper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, X, ArrowUpDown, Filter, Sparkles, Calendar, ChevronDown, Check, Layers } from "lucide-react";
import { motion } from "framer-motion";
import FilterPill from "./assessment-grid-filter-pill";

export type SortKey = "newest" | "oldest" | "candidates" | "passRate";
const sortLabels: Record<SortKey, string> = {
    newest: "Newest first",
    oldest: "Oldest first",
    candidates: "Most Candidates",
    passRate: "Performance"
};

interface Props {
    count: number;
    activeTab: string;
    onTabChange: (s: string) => void;
    selectionMode: boolean;
    onToggleSelectionMode: () => void;
    search: string;
    setSearch: (v: string) => void;
    filterRole: string;
    setFilterRole: (v: string) => void;
    filterLevel: string;
    setFilterLevel: (v: string) => void;
    rolesAvailable: string[];
    levelsAvailable: string[];
    dateFilter: string;
    setDateFilter: (v: string) => void;
    startDate: string;
    setStartDate: (v: string) => void;
    endDate: string;
    setEndDate: (v: string) => void;
    sortBy: SortKey;
    setSortBy: (v: SortKey) => void;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
}

// Header + filter bar of the assessment grid. Split out of assessment-grid.tsx.
export default function AssessmentGridToolbar({
    count, activeTab, onTabChange, selectionMode, onToggleSelectionMode,
    search, setSearch, filterRole, setFilterRole, filterLevel, setFilterLevel,
    rolesAvailable, levelsAvailable, dateFilter, setDateFilter, startDate, setStartDate,
    endDate, setEndDate, sortBy, setSortBy, hasActiveFilters, onClearFilters,
}: Props) {
    return (
        <FadeIn delay={0.2} className="mb-6">
            {/* Visual Header Enhancement */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground font-display">Assessments</h2>
                        <div className="px-2 py-0.5 rounded-full bg-muted border border-muted-foreground/20 text-[10px] font-bold text-primary uppercase">
                            {count} total
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground ml-12">Manage and track your evaluation pipelines</p>
                </div>

                <div className="flex items-center gap-3">
                     <div className="flex items-center bg-background/80 backdrop-blur-md p-1 rounded-2xl border border-muted-foreground/10 overflow-hidden relative min-w-[316px]">
                        {/* Sliding active background */}
                        <motion.div
                            className="absolute h-8 bg-warning/20 border border-warning/30 rounded-xl"
                            initial={false}
                            animate={{
                                x: activeTab === "all" ? 4 : activeTab === "completed" ? 64 : activeTab === "active" ? 148 : 222,
                                width: activeTab === "all" ? 56 : activeTab === "completed" ? 80 : activeTab === "active" ? 70 : 90
                            }}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                        {[
                            { val: "all", label: "All" },
                            { val: "completed", label: "Completed" },
                            { val: "active", label: "Live" },
                            { val: "deactivated", label: "Deactivate" }
                        ].map(t => (
                            <button
                                key={t.val}
                                onClick={() => onTabChange(t.val)}
                                className={`relative z-10 py-1.5 text-xs font-bold transition-all duration-300 ${
                                    t.val === "all" ? "w-[64px]" : t.val === "completed" ? "w-[84px]" : t.val === "active" ? "w-[74px]" : "w-[94px]"
                                } ${
                                    activeTab === t.val ? "text-warning" : "text-muted-foreground hover:text-muted-foreground"
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleSelectionMode}
                        className={`h-10 rounded-2xl gap-2 font-black transition-all px-4 ${
                            selectionMode
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 shadow-[0_0_15px_color-mix(in_srgb,var(--success)_15%,transparent)]"
                        }`}
                    >
                        {selectionMode ? <X className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                        {selectionMode ? "Cancel Selection" : "Multiple Choice Mode"}
                    </Button>
                </div>
            </div>

            {/* Filter bar card - Pro VIP Version */}
            <Card className="border-muted-foreground/10 bg-muted/40 backdrop-blur-md shadow-xl rounded-3xl overflow-hidden">
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search input with focus effects */}
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search assessments..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-12 h-12 bg-background/40 border-muted-foreground/10 text-foreground placeholder:text-muted-foreground/60 rounded-2xl focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all text-sm font-medium"
                            />
                        </div>

                        {/* Pro Selects */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 px-3 h-12 bg-background/40 border border-muted-foreground/10 rounded-2xl">
                                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                                <div className="w-px h-4 bg-muted-foreground/10 ml-1 mr-1" />
                                <FilterPill value={filterRole} onChange={setFilterRole} options={rolesAvailable} allLabel="All Roles" type="role" />
                                <FilterPill value={filterLevel} onChange={setFilterLevel} options={levelsAvailable} allLabel="All Levels" type="level" />
                            </div>

                            <Popover>
                                <PopoverTrigger className="h-12 rounded-2xl text-sm min-w-[160px] bg-background/40 border-muted-foreground/10 text-muted-foreground hover:border-warning/30 transition-all font-medium cursor-pointer px-4 outline-none">
                                    <div className="flex items-center justify-between w-full gap-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className={dateFilter !== 'all' ? "text-warning" : ""}>
                                                {dateFilter === 'all' ? 'All Time' : dateFilter === 'today' ? 'Today' : dateFilter === '7d' ? 'Last 7 Days' : dateFilter === '30d' ? 'Last 30 Days' : 'Custom Range'}
                                            </span>
                                        </div>
                                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="bg-background/98 backdrop-blur-xl border border-muted-foreground/20 text-foreground rounded-[1.5rem] p-2 w-[280px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                    <div className="space-y-1">
                                        {[
                                            { id: "all", label: "All Time" },
                                            { id: "today", label: "Today" },
                                            { id: "7d", label: "Last 7 Days" },
                                            { id: "30d", label: "Last 30 Days" }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setDateFilter(opt.id)}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                                                    dateFilter === opt.id ? "bg-warning/10 text-warning" : "hover:bg-white/[0.03] text-muted-foreground"
                                                }`}
                                            >
                                                {opt.label}
                                                {dateFilter === opt.id && <Check className="w-3 h-3" />}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-white/[0.05]">
                                        <div className="px-3 mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Custom Range</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 p-1">
                                            <div className="relative group">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground group-focus-within:text-warning">FROM</span>
                                                <input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => {
                                                        setStartDate(e.target.value);
                                                        setDateFilter('custom');
                                                    }}
                                                    className="w-full bg-black/20 border border-white/[0.05] rounded-xl pl-12 pr-3 py-2 text-xs text-foreground focus:outline-none focus:border-warning/30 focus:bg-black/40 transition-all [color-scheme:dark]"
                                                />
                                            </div>
                                            <div className="relative group">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground group-focus-within:text-warning">TO</span>
                                                <input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => {
                                                        setEndDate(e.target.value);
                                                        setDateFilter('custom');
                                                    }}
                                                    className="w-full bg-black/20 border border-white/[0.05] rounded-xl pl-12 pr-3 py-2 text-xs text-foreground focus:outline-none focus:border-warning/30 focus:bg-black/40 transition-all [color-scheme:dark]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
                                <SelectTrigger className="h-12 rounded-2xl text-sm min-w-[160px] bg-background/40 border-muted-foreground/10 text-muted-foreground hover:border-warning/30 transition-all font-medium cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-background/95 backdrop-blur-xl border-muted-foreground/15 text-foreground rounded-2xl p-1">
                                    {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                                        <SelectItem key={key} value={key} className="rounded-xl focus:bg-warning/10 focus:text-warning cursor-pointer">
                                            {sortLabels[key]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClearFilters}
                                    className="text-rose-400 hover:bg-rose-400/10 hover:text-rose-300 text-xs h-12 px-4 rounded-2xl cursor-pointer gap-2 border border-transparent hover:border-rose-400/20"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </FadeIn>
    );
}
