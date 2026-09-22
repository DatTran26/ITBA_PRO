"use client";

import { useCallback, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Filter, Mail, X } from "lucide-react";
import { TEMPLATE_TYPES } from "@/lib/email/template-variables";
import { emailInputClass, emailPanelClass, emailSelectClass } from "../_components/email-page-chrome";
import { SharedDashboardButton } from "@/components/shares";
import KpiCardGrid from "@/components/crm/kpi-card-grid";
import OverviewBand from "@/components/shares/overview-band";
import { DonutStat, HBarList, TrendArea, colorAt } from "@/components/charts";
import { countByDay } from "@/lib/ui/series";
import type { KpiCardData } from "@/lib/crm/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Log {
    id: string;
    template_type: string;
    locale: string;
    to_email: string;
    to_name: string | null;
    subject: string;
    status: string;
    sent_at: string;
    error_message: string | null;
    sent_by: string;
    variables: Record<string, string>;
}

interface Props {
    initialLogs: Log[];
    initialTotal: number;
}

const TYPE_LABELS: Record<string, string> = {
    schedule_interview: "Schedule Interview",
    interview_reminder: "Interview Reminder",
    offer: "Job Offer",
    onboard_confirm: "Onboard Confirmation",
};

const PAGE_SIZE = 20;

export default function LogsClient({ initialLogs, initialTotal }: Props) {
    const [logs, setLogs] = useState(initialLogs);
    const [total, setTotal] = useState(initialTotal);
    const [page, setPage] = useState(1);
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [toFilter, setToFilter] = useState("");
    const [selected, setSelected] = useState<Log | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchLogs = useCallback(async (nextPage: number, type: string, status: string, to: string) => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(nextPage) });
        if (type) params.set("type", type);
        if (status) params.set("status", status);
        if (to) params.set("to_email", to);
        const res = await fetch(`/api/emails/logs?${params}`);
        if (res.ok) {
            const data = await res.json();
            setLogs(data.logs);
            setTotal(data.total);
            setPage(nextPage);
        }
        setLoading(false);
    }, []);

    function applyFilters() {
        fetchLogs(1, typeFilter, statusFilter, toFilter);
    }

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const sent = logs.filter((log) => log.status === "sent").length;
    const failed = logs.filter((log) => log.status === "failed").length;
    const pending = logs.filter((log) => log.status === "pending").length;

    /* Log phân trang 20 dòng: ngoài "Tổng sự kiện", mọi số chỉ tính trên trang đang xem. */
    const kpis: KpiCardData[] = [
        { label: "Tổng sự kiện", value: total, icon: Mail, badge: "Toàn bộ" },
        { label: "Đã gửi", value: sent, icon: CheckCircle2, badge: "Trên trang này" },
        { label: "Lỗi", value: failed, icon: AlertTriangle, badge: "Trên trang này", tone: "pink" },
        { label: "Đang chờ", value: pending, icon: Clock3, badge: "Trên trang này" },
        { label: "Tỉ lệ gửi thành công", value: logs.length ? `${Math.round((sent / logs.length) * 100)}%` : "0%", icon: CheckCircle2, badge: "Trên trang này" },
    ];
    const byStatus = [
        { label: "Sent", value: sent, color: "var(--success)" },
        { label: "Failed", value: failed, color: "var(--danger)" },
        { label: "Pending", value: pending, color: "var(--warning)" },
    ].filter((x) => x.value > 0);
    const byType = [...logs.reduce((m, l) => {
        const t = TYPE_LABELS[l.template_type] ?? l.template_type;
        return m.set(t, (m.get(t) ?? 0) + 1);
    }, new Map<string, number>())].map(([label, value]) => ({ label, value }));
    const byDay = countByDay(logs.map((l) => l.sent_at));

    return (
        <div className="space-y-5">
            <KpiCardGrid items={kpis} />

            {logs.length > 0 && (
                <OverviewBand className="mb-0">
                    <DonutStat title="Trạng thái gửi" subtitle="Sent, failed, pending trên trang này" tag={{ label: "Trạng thái" }} slices={byStatus} centerLabel="Email" />
                    <HBarList title="Theo loại template" subtitle="Số email mỗi loại trên trang này" tag={{ label: "Template", tone: "violet" }} items={byType} />
                    <TrendArea title="Email theo ngày" subtitle="14 ngày gần nhất, trên trang này" tag={{ label: "14 ngày", tone: "teal" }} points={byDay} color={colorAt(2)} />
                </OverviewBand>
            )}

            <section className={emailPanelClass}>
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
                    <Filter className="h-4 w-4 text-primary" />
                    Smart filters
                </div>
                <div className="grid gap-3 lg:grid-cols-[14rem_12rem_1fr_auto]">
                    <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className={emailSelectClass}>
                        <option value="">All types</option>
                        {TEMPLATE_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {TYPE_LABELS[type] ?? type}
                            </option>
                        ))}
                    </select>
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={emailSelectClass}>
                        <option value="">All statuses</option>
                        {[
                            ["sent", "Sent"],
                            ["failed", "Failed"],
                            ["pending", "Pending"],
                        ].map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                    <input
                        value={toFilter}
                        onChange={(event) => setToFilter(event.target.value)}
                        onKeyDown={(event) => event.key === "Enter" && applyFilters()}
                        placeholder="Filter by recipient email..."
                        className={emailInputClass}
                    />
                    <SharedDashboardButton variant="primary" onClick={applyFilters} disabled={loading}>
                        {loading ? "Loading..." : "Apply"}
                    </SharedDashboardButton>
                </div>
            </section>

            <section className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]">
                <div className="hidden lg:block">
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow>
                                {["Date", "Template", "Recipient", "Subject", "Status"].map((heading) => (
                                    <TableHead key={heading}>{heading}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody className={loading ? "opacity-50" : ""}>
                            {logs.map((log) => (
                                <TableRow
                                    key={log.id}
                                    onClick={() => setSelected(log)}
                                    className="cursor-pointer"
                                >
                                    <TableCell className="text-muted-foreground">{new Date(log.sent_at).toLocaleString("vi-VN")}</TableCell>
                                    <TableCell className="text-primary">{TYPE_LABELS[log.template_type] ?? log.template_type}</TableCell>
                                    <TableCell>
                                        <p className="text-primary">{log.to_name ?? "Unknown"}</p>
                                        <p className="text-xs text-muted-foreground">{log.to_email}</p>
                                    </TableCell>
                                    <TableCell className="max-w-sm truncate text-muted-foreground">{log.subject}</TableCell>
                                    <TableCell><StatusPill status={log.status} /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="divide-y divide-border lg:hidden">
                    {logs.map((log) => (
                        <SharedDashboardButton key={log.id} onClick={() => setSelected(log)} className="block w-full p-4 text-left transition hover:bg-muted">
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-primary">{log.to_name ?? log.to_email}</p>
                                    <p className="text-xs text-muted-foreground">{log.to_email}</p>
                                </div>
                                <StatusPill status={log.status} />
                            </div>
                            <p className="text-sm text-foreground/80">{log.subject}</p>
                            <p className="mt-2 text-xs text-muted-foreground/70">{new Date(log.sent_at).toLocaleString("vi-VN")}</p>
                        </SharedDashboardButton>
                    ))}
                </div>

                {logs.length === 0 && (
                    <div className="p-12 text-center">
                        <Mail className="mx-auto h-10 w-10 text-muted-foreground/70" />
                        <p className="mt-3 text-sm font-medium text-primary">No emails found</p>
                        <p className="mt-1 text-xs text-muted-foreground">Try removing filters or checking another recipient.</p>
                    </div>
                )}
            </section>

            <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 p-3 sm:flex-row">
                <p className="text-sm text-muted-foreground">Page {page} of {totalPages} · {total} total events</p>
                <div className="flex gap-2">
                    <PagerButton disabled={page <= 1} onClick={() => fetchLogs(page - 1, typeFilter, statusFilter, toFilter)} icon={ChevronLeft} />
                    <PagerButton disabled={page >= totalPages} onClick={() => fetchLogs(page + 1, typeFilter, statusFilter, toFilter)} icon={ChevronRight} />
                </div>
            </div>

            {selected && <LogModal log={selected} onClose={() => setSelected(null)} />}
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const styles: Record<string, string> = {
        sent: "bg-success/12 text-success ring-success/20",
        failed: "bg-danger/12 text-danger ring-danger/20",
        pending: "bg-warning/12 text-warning ring-warning/20",
    };
    return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${styles[status] ?? "bg-muted text-foreground/80 ring-border"}`}>{status}</span>;
}

function PagerButton({ disabled, onClick, icon: Icon }: { disabled: boolean; onClick: () => void; icon: React.ElementType }) {
    return (
        <SharedDashboardButton onClick={onClick} disabled={disabled} className="rounded-xl border border-border bg-muted/40 p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30">
            <Icon className="h-4 w-4" />
        </SharedDashboardButton>
    );
}

function LogModal({ log, onClose }: { log: Log; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="max-h-[84vh] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] border border-border bg-background shadow-2xl">
                <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background/95 p-5 backdrop-blur">
                    <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-primary">Email event</p>
                        <h3 className="mt-1 text-lg font-semibold text-primary">Log detail</h3>
                    </div>
                    <SharedDashboardButton onClick={onClose} className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></SharedDashboardButton>
                </div>
                <div className="space-y-4 p-5">
                    <Detail label="Template" value={`${TYPE_LABELS[log.template_type] ?? log.template_type} (${log.locale})`} />
                    <Detail label="Subject" value={log.subject} />
                    <Detail label="Recipient" value={log.to_name ? `${log.to_name} <${log.to_email}>` : log.to_email} />
                    <Detail label="Sent at & by" value={`${new Date(log.sent_at).toLocaleString("vi-VN")} - ${log.sent_by}`} />
                    <div>
                        <p className="mb-1.5 text-xs text-muted-foreground">Variables</p>
                        <pre className="overflow-x-auto rounded-2xl border border-border bg-background p-4 text-xs text-success">
                            {JSON.stringify(log.variables, null, 2)}
                        </pre>
                    </div>
                    {log.error_message && <Detail label="Error" value={log.error_message} tone="error" />}
                    <div className="flex justify-end"><StatusPill status={log.status} /></div>
                </div>
            </div>
        </div>
    );
}

function Detail({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "error" }) {
    return (
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`mt-1 text-sm ${tone === "error" ? "text-danger" : "text-primary"}`}>{value}</p>
        </div>
    );
}
