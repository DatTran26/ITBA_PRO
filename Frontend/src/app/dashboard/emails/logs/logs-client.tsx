"use client";
import { toneFor } from "@/lib/ui/tones";

import { useCallback, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Mail, Search, type LucideIcon } from "lucide-react";
import { TEMPLATE_TYPES } from "@/lib/email/template-variables";

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
    const [selectedId, setSelectedId] = useState<string | null>(initialLogs[0]?.id ?? null);
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
            setSelectedId(data.logs[0]?.id ?? null);
        }
        setLoading(false);
    }, []);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const selected = logs.find((l) => l.id === selectedId) ?? null;
    const setStatus = (st: string) => { setStatusFilter(st); fetchLogs(1, typeFilter, st, toFilter); };

    return (
        <div className="grid grid-cols-[420px_1fr] h-[calc(100vh-260px)] min-h-[560px] rounded-2xl border border-border bg-card overflow-hidden shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]">
            {/* Khung danh sách */}
            <div className="flex flex-col border-r border-border min-h-0">
                <div className="p-4 space-y-3 border-b border-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            value={toFilter}
                            onChange={(e) => setToFilter(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && fetchLogs(1, typeFilter, statusFilter, toFilter)}
                            placeholder="Email người nhận, Enter để lọc"
                            className="w-full h-10 rounded-xl bg-muted/50 border border-border pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex p-0.5 rounded-lg bg-muted/60 border border-border">
                            {[["", "Tất cả"], ["sent", "Đã gửi"], ["failed", "Lỗi"], ["pending", "Chờ"]].map(([v, l]) => (
                                <button key={v} type="button" onClick={() => setStatus(v)}
                                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${statusFilter === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                                    {l}
                                </button>
                            ))}
                        </div>
                        <select value={typeFilter}
                                onChange={(e) => { setTypeFilter(e.target.value); fetchLogs(1, e.target.value, statusFilter, toFilter); }}
                                className="h-8 flex-1 min-w-0 rounded-lg border border-border bg-card px-2 text-xs font-semibold text-foreground outline-none focus:border-primary cursor-pointer">
                            <option value="">Mọi template</option>
                            {TEMPLATE_TYPES.map((type) => <option key={type} value={type}>{TYPE_LABELS[type] ?? type}</option>)}
                        </select>
                    </div>
                </div>

                <ul className={`flex-1 overflow-y-auto divide-y divide-border ${loading ? "opacity-50" : ""}`}>
                    {logs.map((log) => {
                        const on = log.id === selectedId;
                        const st = STATUS[log.status] ?? STATUS.pending;
                        return (
                            <li key={log.id}>
                                <button type="button" onClick={() => setSelectedId(log.id)}
                                        className={`w-full text-left px-4 py-3 border-l-[3px] transition-colors cursor-pointer ${on ? "bg-accent border-primary" : "border-transparent hover:bg-muted/50"}`}>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="flex items-center gap-2 min-w-0">
                                            <st.icon className="w-3.5 h-3.5 shrink-0" style={{ color: st.color }} aria-label={st.label} />
                                            <span className="font-bold text-sm text-foreground truncate">{log.to_name ?? log.to_email}</span>
                                        </span>
                                        <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">{shortTime(log.sent_at)}</span>
                                    </div>
                                    <p className="mt-0.5 text-sm text-foreground/80 truncate">{log.subject}</p>
                                    <span className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: toneFor(log.template_type).ink, backgroundColor: toneFor(log.template_type).bg }}>{TYPE_LABELS[log.template_type] ?? log.template_type}</span>
                                </button>
                            </li>
                        );
                    })}
                    {logs.length === 0 && (
                        <li className="p-10 text-center">
                            <Mail className="mx-auto h-8 w-8 text-muted-foreground/60" />
                            <p className="mt-3 text-sm font-semibold text-foreground">Không có email nào</p>
                            <p className="mt-1 text-xs text-muted-foreground">Thử bỏ bộ lọc hoặc người nhận khác.</p>
                        </li>
                    )}
                </ul>

                <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-border text-xs text-muted-foreground">
                    <span className="tabular-nums">Trang {page}/{totalPages} · {total} email</span>
                    <div className="flex gap-1">
                        <PagerButton disabled={page <= 1 || loading} onClick={() => fetchLogs(page - 1, typeFilter, statusFilter, toFilter)} icon={ChevronLeft} label="Trang trước" />
                        <PagerButton disabled={page >= totalPages || loading} onClick={() => fetchLogs(page + 1, typeFilter, statusFilter, toFilter)} icon={ChevronRight} label="Trang sau" />
                    </div>
                </div>
            </div>

            {/* Khung đọc */}
            <div className="min-h-0 overflow-y-auto">
                {selected ? <LogReader log={selected} /> : (
                    <div className="h-full grid place-items-center text-center p-10">
                        <div>
                            <Mail className="mx-auto h-12 w-12 text-muted-foreground/40" />
                            <p className="mt-3 text-sm text-muted-foreground">Chọn một email để xem chi tiết</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const STATUS: Record<string, { label: string; color: string; icon: LucideIcon }> = {
    sent: { label: "Đã gửi", color: "var(--success)", icon: CheckCircle2 },
    failed: { label: "Lỗi", color: "var(--danger)", icon: AlertTriangle },
    pending: { label: "Đang chờ", color: "var(--warning)", icon: Clock3 },
};

function shortTime(iso: string) {
    const d = new Date(iso);
    const today = new Date().toDateString() === d.toDateString();
    return today
        ? d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function PagerButton({ disabled, onClick, icon: Icon, label }: { disabled: boolean; onClick: () => void; icon: LucideIcon; label: string }) {
    return (
        <button type="button" aria-label={label} onClick={onClick} disabled={disabled}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
            <Icon className="h-4 w-4" />
        </button>
    );
}

function LogReader({ log }: { log: Log }) {
    const st = STATUS[log.status] ?? STATUS.pending;
    const vars = Object.entries(log.variables ?? {});
    return (
        <article className="p-8 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                      style={{ color: st.color, backgroundColor: `color-mix(in srgb, ${st.color} 12%, transparent)` }}>
                    <st.icon className="w-3.5 h-3.5" />{st.label}
                </span>
                <span className="rounded-full px-2.5 py-1" style={{ color: toneFor(log.template_type).ink, backgroundColor: toneFor(log.template_type).bg }}>
                    {TYPE_LABELS[log.template_type] ?? log.template_type} · {log.locale.toUpperCase()}
                </span>
            </div>
            <h2 className="mt-4 text-2xl font-extrabold leading-tight text-foreground">{log.subject}</h2>

            <dl className="mt-6 grid grid-cols-[80px_1fr] gap-y-2 text-sm border-y border-border py-4">
                <dt className="text-muted-foreground">Đến</dt>
                <dd className="text-foreground font-semibold">{log.to_name ? <>{log.to_name} <span className="font-normal text-muted-foreground">&lt;{log.to_email}&gt;</span></> : log.to_email}</dd>
                <dt className="text-muted-foreground">Gửi bởi</dt>
                <dd className="text-foreground">{log.sent_by}</dd>
                <dt className="text-muted-foreground">Lúc</dt>
                <dd className="text-foreground tabular-nums">{new Date(log.sent_at).toLocaleString("vi-VN")}</dd>
            </dl>

            {log.error_message && (
                <div className="mt-6 rounded-xl border border-danger/30 bg-danger/5 p-4">
                    <p className="flex items-center gap-2 text-sm font-bold text-danger"><AlertTriangle className="w-4 h-4" />Gửi thất bại</p>
                    <p className="mt-1.5 font-mono text-xs text-foreground/80 whitespace-pre-wrap">{log.error_message}</p>
                </div>
            )}

            <h3 className="mt-8 mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Biến đã điền ({vars.length})</h3>
            {vars.length ? (
                <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                    {vars.map(([k, v]) => (
                        <div key={k} className="grid grid-cols-[200px_1fr] gap-4 px-4 py-2.5 text-sm">
                            <span className="font-mono text-xs text-primary self-center">{`{{${k}}}`}</span>
                            <span className="text-foreground break-words">{String(v)}</span>
                        </div>
                    ))}
                </div>
            ) : <p className="text-sm text-muted-foreground">Không có biến nào.</p>}
        </article>
    );
}
