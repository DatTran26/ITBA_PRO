"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";
import { motion } from "framer-motion";
import AssessmentCard from "./assessment-card";
import AssessmentGridToolbar, { type SortKey } from "./assessment-grid-toolbar";
import AssessmentGridBulkBar from "./assessment-grid-bulk-bar";
import AssessmentGridEmptyState from "./assessment-grid-empty-state";
import type { DashboardTest } from "@/app/dashboard/types";

interface Props {
    tests: DashboardTest[];
    onToggleStatus: (test: { id: string; status: string; name: string }) => void;
    onDelete?: (test: { id: string; name: string }) => void;
}

export default function AssessmentGrid({ tests, onToggleStatus, onDelete }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State initialized from URL params
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState("");
    const [filterLevel, setFilterLevel] = useState("");
    const [activeTab, setActiveTab] = useState(searchParams.get("status") || "all");
    const [sortBy, setSortBy] = useState<SortKey>("newest");
    const [dateFilter, setDateFilter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectionMode, setSelectionMode] = useState(false);
    const [isBulkActing, setIsBulkActing] = useState(false);

    // Sync state with URL params on mount
    useEffect(() => {
        const status = searchParams.get("status");
        if (status && ["active", "completed", "deactivated", "all"].includes(status)) {
            setActiveTab(status);
        }
    }, [searchParams]);

    // Handle Tab Change and sync to URL
    const handleTabChange = (status: string) => {
        setActiveTab(status);
        const params = new URLSearchParams(window.location.search);
        if (status === "all") {
            params.delete("status");
        } else {
            params.set("status", status);
        }
        router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    };

    const rolesAvailable = Array.from(new Set(tests.map((t) => t.job_role)));
    const levelsAvailable = Array.from(new Set(tests.map((t) => t.level)));

    const hasActiveFilters = !!(search || filterRole || filterLevel || activeTab !== "all" || dateFilter !== "all" || startDate || endDate);

    const filtered = useMemo(() => {
        let result = tests.filter((t) => {
            const matchSearch = !search ||
                t.job_role.toLowerCase().includes(search.toLowerCase()) ||
                (t.title && t.title.toLowerCase().includes(search.toLowerCase()));
            const matchRole = !filterRole || t.job_role === filterRole;
            const matchLevel = !filterLevel || t.level === filterLevel;
            const matchStatus = activeTab === "all" || t.status === activeTab;

            // Date Logic
            let matchDate = true;
            if (dateFilter !== "all") {
                const now = new Date();
                const testDate = new Date(t.created_at);
                if (dateFilter === "today") {
                    matchDate = testDate.toDateString() === now.toDateString();
                } else if (dateFilter === "7d") {
                    const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    matchDate = testDate >= threshold;
                } else if (dateFilter === "30d") {
                    const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    matchDate = testDate >= threshold;
                } else if (dateFilter === "custom") {
                    if (startDate) {
                        const start = new Date(startDate);
                        start.setHours(0, 0, 0, 0);
                        if (testDate < start) matchDate = false;
                    }
                    if (endDate) {
                        const end = new Date(endDate);
                        end.setHours(23, 59, 59, 999);
                        if (testDate > end) matchDate = false;
                    }
                }
            }

            return matchSearch && matchRole && matchLevel && matchStatus && matchDate;
        });

        result = [...result].sort((a, b) => {
            switch (sortBy) {
                case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case "candidates": return b.resultCount - a.resultCount;
                case "passRate": {
                    const rA = a.resultCount > 0 ? a.passCount / a.resultCount : 0;
                    const rB = b.resultCount > 0 ? b.passCount / b.resultCount : 0;
                    return rB - rA;
                }
                default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });

        return result;
        // NOTE: deps intentionally match the original (pre-split) behavior. dateFilter/
        // startDate/endDate are read inside but omitted here — a pre-existing latent bug
        // (date filter doesn't recompute until another dep changes). Left as-is to keep
        // this split logic-neutral; fix separately.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tests, search, filterRole, filterLevel, activeTab, sortBy]);

    function clearFilters() {
        setSearch(""); setFilterRole(""); setFilterLevel("");
        handleTabChange("all"); setSortBy("newest"); setDateFilter("all");
        setStartDate(""); setEndDate("");
        setSelectedIds(new Set()); setSelectionMode(false);
    }

    function toggleSelect(id: string, selected: boolean) {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (selected) next.add(id);
            else next.delete(id);
            return next;
        });
    }

    function toggleSelectAll() {
        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map(t => t.id)));
        }
    }

    async function handleBulkAction(action: 'activate' | 'deactivate' | 'delete') {
        if (selectedIds.size === 0) return;

        setIsBulkActing(true);
        const ids = Array.from(selectedIds);

        try {
            const method = action === 'delete' ? 'DELETE' : 'PATCH';
            const body = action === 'delete'
                ? { ids }
                : { ids, status: action === 'activate' ? 'active' : action === 'deactivate' ? 'deactivated' : 'completed' };

            const res = await fetch('/api/tests', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error("Bulk action failed");

            // Refresh page
            window.location.reload();
        } catch (err) {
            console.error(err);
            setIsBulkActing(false);
        }
    }

    return (
        <div>
            <AssessmentGridToolbar
                count={filtered.length}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                selectionMode={selectionMode}
                onToggleSelectionMode={() => {
                    if (selectionMode) setSelectedIds(new Set());
                    setSelectionMode(!selectionMode);
                }}
                search={search}
                setSearch={setSearch}
                filterRole={filterRole}
                setFilterRole={setFilterRole}
                filterLevel={filterLevel}
                setFilterLevel={setFilterLevel}
                rolesAvailable={rolesAvailable}
                levelsAvailable={levelsAvailable}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                sortBy={sortBy}
                setSortBy={setSortBy}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
            />

            {/* Grid Container */}
            <div className="min-h-[400px]">
                {tests.length === 0 ? (
                    <AssessmentGridEmptyState />
                ) : filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-24 flex flex-col items-center gap-4 bg-[#1B253B]/20 rounded-3xl border border-dashed border-[#8B99B0]/10"
                    >
                        <div className="w-16 h-16 rounded-full bg-[#1B253B] flex items-center justify-center border border-[#8B99B0]/10">
                            <Search className="w-6 h-6 text-[#5A6882]" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-[#ECF0F7]">Missing something?</h3>
                            <p className="text-[#8B99B0] text-sm">We couldn&apos;t find any assessments matching these filters.</p>
                        </div>
                        <Button variant="link" onClick={clearFilters} className="text-[#7C8FFF] font-bold hover:no-underline">Clear all filters</Button>
                    </motion.div>
                ) : (
                    <StaggerContainer
                        key={activeTab}
                        className="grid lg:grid-cols-2 gap-6 mb-32"
                    >
                        {filtered.map((test) => (
                            <StaggerItem key={test.id}>
                                <AssessmentCard
                                    test={test}
                                    onToggleStatus={onToggleStatus}
                                    onDelete={onDelete}
                                    selectionMode={selectionMode}
                                    isSelected={selectedIds.has(test.id)}
                                    onSelect={toggleSelect}
                                />
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                )}
            </div>

            <AssessmentGridBulkBar
                selectionMode={selectionMode}
                selectedCount={selectedIds.size}
                filteredCount={filtered.length}
                isBulkActing={isBulkActing}
                onToggleSelectAll={toggleSelectAll}
                onBulkAction={handleBulkAction}
                onClose={() => {
                    setSelectedIds(new Set());
                    setSelectionMode(false);
                }}
            />
        </div>
    );
}
