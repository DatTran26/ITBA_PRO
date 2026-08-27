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
                        <div className="p-2.5 rounded-2xl bg-[#7C8FFF]/10 border border-[#7C8FFF]/20">
                            <Sparkles className="w-5 h-5 text-[#7C8FFF]" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#ECF0F7] font-display">Assessments</h2>
                        <div className="px-2 py-0.5 rounded-full bg-[#1B253B] border border-[#8B99B0]/20 text-[10px] font-bold text-[#7C8FFF] uppercase">
                            {count} total
                        </div>
                    </div>
                    <p className="text-sm text-[#5A6882] ml-12">Manage and track your evaluation pipelines</p>
                </div>

                <div className="flex items-center gap-3">
                     <div className="flex items-center bg-[#0F172A]/80 backdrop-blur-md p-1 rounded-2xl border border-[#8B99B0]/10 overflow-hidden relative min-w-[316px]">
                        {/* Sliding active background */}
                        <motion.div
                            className="absolute h-8 bg-[#FFB86C]/20 border border-[#FFB86C]/30 rounded-xl"
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
                                    activeTab === t.val ? "text-[#FFB86C]" : "text-[#5A6882] hover:text-[#8B99B0]"
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
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                        }`}
                    >
                        {selectionMode ? <X className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                        {selectionMode ? "Cancel Selection" : "Multiple Choice Mode"}
                    </Button>
                </div>
            </div>

            {/* Filter bar card - Pro VIP Version */}
            <Card className="border-[#8B99B0]/10 bg-[#1B253B]/40 backdrop-blur-md shadow-xl rounded-3xl overflow-hidden">
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search input with focus effects */}
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6882] group-focus-within:text-[#7C8FFF] transition-colors" />
                            <Input
                                placeholder="Search assessments..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-12 h-12 bg-[#0F172A]/40 border-[#8B99B0]/10 text-[#ECF0F7] placeholder:text-[#5A6882]/60 rounded-2xl focus-visible:ring-[#7C8FFF]/30 focus-visible:border-[#7C8FFF]/50 transition-all text-sm font-medium"
                            />
                        </div>

                        {/* Pro Selects */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 px-3 h-12 bg-[#0F172A]/40 border border-[#8B99B0]/10 rounded-2xl">
                                <Filter className="w-3.5 h-3.5 text-[#5A6882]" />
                                <div className="w-px h-4 bg-[#8B99B0]/10 ml-1 mr-1" />
                                <FilterPill value={filterRole} onChange={setFilterRole} options={rolesAvailable} allLabel="All Roles" type="role" />
                                <FilterPill value={filterLevel} onChange={setFilterLevel} options={levelsAvailable} allLabel="All Levels" type="level" />
                            </div>

                            <Popover>
                                <PopoverTrigger className="h-12 rounded-2xl text-sm min-w-[160px] bg-[#0F172A]/40 border-[#8B99B0]/10 text-[#8B99B0] hover:border-[#FFB86C]/30 transition-all font-medium cursor-pointer px-4 outline-none">
                                    <div className="flex items-center justify-between w-full gap-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-[#5A6882]" />
                                            <span className={dateFilter !== 'all' ? "text-[#FFB86C]" : ""}>
                                                {dateFilter === 'all' ? 'All Time' : dateFilter === 'today' ? 'Today' : dateFilter === '7d' ? 'Last 7 Days' : dateFilter === '30d' ? 'Last 30 Days' : 'Custom Range'}
                                            </span>
                                        </div>
                                        <ChevronDown className="w-3.5 h-3.5 text-[#5A6882]" />
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="bg-[#0F172A]/98 backdrop-blur-xl border border-[#8B99B0]/20 text-[#ECF0F7] rounded-[1.5rem] p-2 w-[280px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
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
                                                    dateFilter === opt.id ? "bg-[#FFB86C]/10 text-[#FFB86C]" : "hover:bg-white/[0.03] text-[#8B99B0]"
                                                }`}
                                            >
                                                {opt.label}
                                                {dateFilter === opt.id && <Check className="w-3 h-3" />}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-white/[0.05]">
                                        <div className="px-3 mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#5A6882]">Custom Range</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 p-1">
                                            <div className="relative group">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#5A6882] group-focus-within:text-[#FFB86C]">FROM</span>
                                                <input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => {
                                                        setStartDate(e.target.value);
                                                        setDateFilter('custom');
                                                    }}
                                                    className="w-full bg-black/20 border border-white/[0.05] rounded-xl pl-12 pr-3 py-2 text-xs text-[#ECF0F7] focus:outline-none focus:border-[#FFB86C]/30 focus:bg-black/40 transition-all [color-scheme:dark]"
                                                />
                                            </div>
                                            <div className="relative group">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#5A6882] group-focus-within:text-[#FFB86C]">TO</span>
                                                <input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => {
                                                        setEndDate(e.target.value);
                                                        setDateFilter('custom');
                                                    }}
                                                    className="w-full bg-black/20 border border-white/[0.05] rounded-xl pl-12 pr-3 py-2 text-xs text-[#ECF0F7] focus:outline-none focus:border-[#FFB86C]/30 focus:bg-black/40 transition-all [color-scheme:dark]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
                                <SelectTrigger className="h-12 rounded-2xl text-sm min-w-[160px] bg-[#0F172A]/40 border-[#8B99B0]/10 text-[#8B99B0] hover:border-[#FFB86C]/30 transition-all font-medium cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <ArrowUpDown className="w-3.5 h-3.5 text-[#5A6882]" />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-[#0F172A]/95 backdrop-blur-xl border-[#8B99B0]/15 text-[#ECF0F7] rounded-2xl p-1">
                                    {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                                        <SelectItem key={key} value={key} className="rounded-xl focus:bg-[#FFB86C]/10 focus:text-[#FFB86C] cursor-pointer">
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
