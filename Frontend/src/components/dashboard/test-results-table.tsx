"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusChip } from "@/components/ui/status-chip";
import { ScoreBar } from "@/components/ui/score-bar";
import { Segmented, SegmentedOption } from "@/components/ui/segmented";
import { User, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Result {
    id: string;
    candidate_name: string;
    candidate_email: string;
    score: number;
    total_questions: number;
    time_taken: number;
    submitted_at: string;
    status: "pass" | "fail" | null;
    grading_status?: "pending_grading" | "graded" | null;
    ai_analysis: {
        recommendation?: string;
    } | null;
}

interface TestResultsTableProps {
    results: Result[];
    hasManualQuestions: boolean;
}

type FilterValue = "all" | "pending_grading" | "graded";

export function TestResultsTable({ results, hasManualQuestions }: TestResultsTableProps) {
    const router = useRouter();
    const [filter, setFilter] = React.useState<FilterValue>("all");

    const filteredResults = React.useMemo(() => {
        if (!hasManualQuestions || filter === "all") return results;
        return results.filter((r) => {
            const status = r.grading_status || "graded";
            return status === filter;
        });
    }, [results, filter, hasManualQuestions]);

    const filterOptions: SegmentedOption<FilterValue>[] = [
        { label: "Tất cả", value: "all" },
        { label: "Cần chấm", value: "pending_grading" },
        { label: "Đã chấm", value: "graded" },
    ];

    const columns: DataTableColumn<Result>[] = [
        {
            key: "candidate",
            header: <span className="text-[10px] uppercase tracking-wider font-black text-[#5A6882]">Ứng viên</span>,
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#222C4A] border border-[#8B99B0]/15 flex items-center justify-center text-sm font-bold text-[#8B99B0] font-display shrink-0">
                        {row.candidate_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-[#ECF0F7] font-display truncate">
                            {row.candidate_name}
                        </span>
                        <span className="text-[11px] text-[#5A6882] truncate">
                            {row.candidate_email}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            key: "submitted_at",
            header: <span className="text-[10px] uppercase tracking-wider font-black text-[#5A6882]">Nộp bài</span>,
            cell: (row) => {
                const date = new Date(row.submitted_at);
                return (
                    <div className="flex flex-col">
                        <span className="text-xs text-[#ECF0F7]/90 font-medium">
                            {formatDistanceToNow(date, { addSuffix: true, locale: vi })}
                        </span>
                        <span className="text-[10px] text-[#5A6882] font-mono">
                            {date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                    </div>
                );
            },
        },
        {
            key: "duration",
            header: <span className="text-[10px] uppercase tracking-wider font-black text-[#5A6882]">Thời gian</span>,
            cell: (row) => {
                const mins = Math.floor(row.time_taken / 60);
                const secs = row.time_taken % 60;
                return (
                    <span className="text-xs font-mono text-[#8B99B0]">
                        {mins > 0 ? `${mins}m ${secs}s` : `${secs}s`}
                    </span>
                );
            },
        },
        {
            key: "score",
            header: <span className="text-[10px] uppercase tracking-wider font-black text-[#5A6882]">Điểm số</span>,
            cell: (row) => {
                const pct = row.total_questions > 0 ? Math.round((row.score / row.total_questions) * 100) : 0;
                const isPending = hasManualQuestions && row.grading_status === "pending_grading";
                return (
                    <div className="flex items-center gap-3">
                        <ScoreBar value={pct} max={100} showValue={false} trackWidth={50} />
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-0.5">
                                <span className="text-sm font-bold text-[#ECF0F7] font-mono">
                                    {pct}%
                                </span>
                                {isPending && (
                                    <span className="text-[10px] text-amber-400 font-semibold ml-1">
                                        (Tạm tính)
                                    </span>
                                )}
                            </div>
                            <span className="text-[9px] text-[#5A6882] font-mono">
                                {row.score}/{row.total_questions} đúng
                            </span>
                        </div>
                    </div>
                );
            },
        },
        ...(hasManualQuestions
            ? [
                  {
                      key: "grading_status",
                      header: <span className="text-[10px] uppercase tracking-wider font-black text-[#5A6882]">Trạng thái chấm</span>,
                      cell: (row: Result) => {
                          const status = row.grading_status || "graded";
                          return status === "pending_grading" ? (
                              <StatusChip tone="warning" label="Cần chấm" />
                          ) : (
                              <StatusChip tone="success" label="Đã chấm" />
                          );
                      },
                  },
              ]
            : []),
        {
            key: "status",
            header: <span className="text-[10px] uppercase tracking-wider font-black text-[#5A6882]">Kết quả</span>,
            cell: (row) => {
                if (!row.status) return <span className="text-xs text-[#5A6882]">-</span>;
                return row.status === "pass" ? (
                    <StatusChip tone="success" label="ĐẠT" />
                ) : (
                    <StatusChip tone="danger" label="TRƯỢT" />
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            {hasManualQuestions && (
                <div className="flex items-center justify-between bg-[#111827]/20 border border-[#8B99B0]/10 p-4 rounded-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[#5A6882]" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#8B99B0]">
                            Bộ lọc tự luận
                        </span>
                    </div>
                    <Segmented
                        options={filterOptions}
                        value={filter}
                        onValueChange={setFilter}
                        size="sm"
                    />
                </div>
            )}

            <div className="bg-[#111827]/40 border border-[#8B99B0]/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
                <DataTable
                    columns={columns}
                    rows={filteredResults}
                    rowKey={(row) => row.id}
                    onRowClick={(row) => router.push(`/dashboard/results/${row.id}`)}
                    className="border-none"
                    empty={
                        <div className="p-16 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4">
                                <User className="w-5 h-5 text-[#5A6882]" />
                            </div>
                            <h3 className="text-sm font-bold text-[#ECF0F7] mb-1 font-display">
                                Không có kết quả nào
                            </h3>
                            <p className="text-xs text-[#5A6882]">
                                {filter === "all"
                                    ? "Chưa có ứng viên nào tham gia bài kiểm tra này."
                                    : "Không tìm thấy kết quả nào khớp với bộ lọc."}
                            </p>
                        </div>
                    }
                />
            </div>
        </div>
    );
}
