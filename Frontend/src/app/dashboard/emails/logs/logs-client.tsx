"use client";

import { useCallback, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Filter, Mail, X } from "lucide-react";
import { TEMPLATE_TYPES } from "@/lib/email/template-variables";
import { emailInputClass, emailPanelClass, emailSelectClass } from "../_components/email-page-chrome";
import { SharedDashboardButton } from "@/components/shares";
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

    return (
        <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
                <Metric icon={CheckCircle2} label="Sent on page" value={sent} tone="emerald" />
                <Metric icon={AlertTriangle} label="Failed on page" value={failed} tone="rose" />
                <Metric icon={Clock3} label="Pending on page" value={pending} tone="amber" />
            </div>

            <section className={emailPanelClass}>
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#F6F8FC]">
                    <Filter className="h-4 w-4 text-cyan-200" />
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
                    <SharedDashboardButton
                        onClick={applyFilters}
                        disabled={loading}
                        className="rounded-2xl bg-[#EDF7FF] px-5 py-3 text-sm font-semibold text-[#0C1627] transition hover:bg-white disabled:opacity-50"
                    >
                        {loading ? "Loading..." : "Apply"}
                    </SharedDashboardButton>
                </div>
            </section>

            <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#111A2D]/78 shadow-xl shadow-black/20">
                <div className="hidden lg:block">
                    <Table>
                        <TableHeader className="bg-white/[0.03]">
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
                                    <TableCell className="text-slate-400">{new Date(log.sent_at).toLocaleString("vi-VN")}</TableCell>
                                    <TableCell className="text-[#F6F8FC]">{TYPE_LABELS[log.template_type] ?? log.template_type}</TableCell>
                                    <TableCell>
                                        <p className="text-[#F6F8FC]">{log.to_name ?? "Unknown"}</p>
                                        <p className="text-xs text-slate-500">{log.to_email}</p>
                                    </TableCell>
                                    <TableCell className="max-w-sm truncate text-slate-400">{log.subject}</TableCell>
                                    <TableCell><StatusPill status={log.status} /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="divide-y divide-white/[0.06] lg:hidden">
                    {logs.map((log) => (
                        <SharedDashboardButton key={log.id} onClick={() => setSelected(log)} className="block w-full p-4 text-left transition hover:bg-white/[0.04]">
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-[#F6F8FC]">{log.to_name ?? log.to_email}</p>
                                    <p className="text-xs text-slate-500">{log.to_email}</p>
                                </div>
                                <StatusPill status={log.status} />
                            </div>
                            <p className="text-sm text-slate-300">{log.subject}</p>
                            <p className="mt-2 text-xs text-slate-600">{new Date(log.sent_at).toLocaleString("vi-VN")}</p>
                        </SharedDashboardButton>
                    ))}
                </div>

                {logs.length === 0 && (
                    <div className="p-12 text-center">
                        <Mail className="mx-auto h-10 w-10 text-slate-600" />
                        <p className="mt-3 text-sm font-medium text-[#F6F8FC]">No emails found</p>
                        <p className="mt-1 text-xs text-slate-500">Try removing filters or checking another recipient.</p>
                    </div>
                )}
            </section>

            <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:flex-row">
                <p className="text-sm text-slate-500">Page {page} of {totalPages} · {total} total events</p>
                <div className="flex gap-2">
                    <PagerButton disabled={page <= 1} onClick={() => fetchLogs(page - 1, typeFilter, statusFilter, toFilter)} icon={ChevronLeft} />
                    <PagerButton disabled={page >= totalPages} onClick={() => fetchLogs(page + 1, typeFilter, statusFilter, toFilter)} icon={ChevronRight} />
                </div>
            </div>

            {selected && <LogModal log={selected} onClose={() => setSelected(null)} />}
        </div>
    );
}

function Metric({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number; tone: "emerald" | "rose" | "amber" }) {
    const tones = {
        emerald: "bg-emerald-400/12 text-emerald-200",
        rose: "bg-rose-400/12 text-rose-200",
        amber: "bg-amber-300/12 text-amber-200",
    };
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></div>
            <p className="font-display text-2xl text-[#F6F8FC]">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const styles: Record<string, string> = {
        sent: "bg-emerald-400/12 text-emerald-200 ring-emerald-300/20",
        failed: "bg-rose-400/12 text-rose-200 ring-rose-300/20",
        pending: "bg-amber-300/12 text-amber-200 ring-amber-300/20",
    };
    return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${styles[status] ?? "bg-slate-400/12 text-slate-300 ring-slate-300/20"}`}>{status}</span>;
}

function PagerButton({ disabled, onClick, icon: Icon }: { disabled: boolean; onClick: () => void; icon: React.ElementType }) {
    return (
        <SharedDashboardButton onClick={onClick} disabled={disabled} className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
            <Icon className="h-4 w-4" />
        </SharedDashboardButton>
    );
}

function LogModal({ log, onClose }: { log: Log; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="max-h-[84vh] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] border border-white/10 bg-[#0B1220] shadow-2xl">
                <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[#0B1220]/95 p-5 backdrop-blur">
                    <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">Email event</p>
                        <h3 className="mt-1 text-lg font-semibold text-[#F6F8FC]">Log detail</h3>
                    </div>
                    <SharedDashboardButton onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></SharedDashboardButton>
                </div>
                <div className="space-y-4 p-5">
                    <Detail label="Template" value={`${TYPE_LABELS[log.template_type] ?? log.template_type} (${log.locale})`} />
                    <Detail label="Subject" value={log.subject} />
                    <Detail label="Recipient" value={log.to_name ? `${log.to_name} <${log.to_email}>` : log.to_email} />
                    <Detail label="Sent at & by" value={`${new Date(log.sent_at).toLocaleString("vi-VN")} - ${log.sent_by}`} />
                    <div>
                        <p className="mb-1.5 text-xs text-slate-500">Variables</p>
                        <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0A1020] p-4 text-xs text-emerald-200">
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
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`mt-1 text-sm ${tone === "error" ? "text-rose-200" : "text-[#F6F8FC]"}`}>{value}</p>
        </div>
    );
}
