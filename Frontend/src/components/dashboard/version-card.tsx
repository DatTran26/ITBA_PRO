"use client";

import { ChevronDown, ChevronUp, Calendar, FileText, Sparkles, Check, X, Loader2, Archive } from "lucide-react";
import type { VersionData } from "./version-create-dialog";

type Status = "draft" | "pending" | "approved" | "rejected" | "archived";

export const STATUS_CONFIG: Record<Status, {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bg: string; text: string; border: string; dot: string;
}> = {
    draft: {
        label: "Draft",
        icon: () => <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />,
        bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/25", dot: "bg-slate-400",
    },
    pending: {
        label: "Chờ duyệt",
        icon: ({ className }) => {
            const { Clock } = require("lucide-react");
            return <Clock className={className} />;
        },
        bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/25", dot: "bg-amber-400",
    },
    approved: {
        label: "Published",
        icon: ({ className }) => {
            const { CheckCircle2 } = require("lucide-react");
            return <CheckCircle2 className={className} />;
        },
        bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/25", dot: "bg-emerald-400",
    },
    rejected: {
        label: "Từ chối",
        icon: ({ className }) => {
            const { XCircle } = require("lucide-react");
            return <XCircle className={className} />;
        },
        bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/25", dot: "bg-rose-400",
    },
    archived: {
        label: "Archived",
        icon: Archive,
        bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/25", dot: "bg-amber-500",
    },
};

export const CATEGORY_BADGE: Record<string, string> = {
    platform: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    feature: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    security: "bg-red-500/10 text-red-400 border-red-500/20",
    performance: "bg-green-500/10 text-green-400 border-green-500/20",
};

interface Props {
    v: VersionData;
    isAdmin: boolean;
    isExpanded: boolean;
    isProcessing: boolean;
    noteInput: string;
    onToggle: () => void;
    onNoteChange: (note: string) => void;
    onStatusChange: (id: string, status: "approved" | "rejected" | "archived") => void;
}

export default function VersionCard({ v, isAdmin, isExpanded, isProcessing, noteInput, onToggle, onNoteChange, onStatusChange }: Props) {
    const status = (v.status as Status) in STATUS_CONFIG ? v.status as Status : "pending";
    const cfg = STATUS_CONFIG[status];
    const Icon = cfg.icon;
    const features: string[] = Array.isArray(v.features) ? v.features : [];
    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

    return (
        <div className={`bg-muted border rounded-2xl overflow-hidden transition-colors ${v.status === "pending" ? "border-amber-500/25" : "border-muted-foreground/10"}`}>
            <button className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-accent/40 transition-colors" onClick={onToggle}>
                <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
                    <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">v{v.version_number}</span>
                    <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                            <span className="text-[15px] font-medium text-foreground">{v.title}</span>
                            {v.category && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${CATEGORY_BADGE[v.category] ?? "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20"}`}>
                                    {v.category}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                <Icon className="w-3 h-3" />
                                {cfg.label}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Calendar className="w-3 h-3" />{formatDate(v.created_at)}
                            </span>
                            {features.length > 0 && <span className="text-[11px] text-muted-foreground">{features.length} tính năng</span>}
                        </div>
                    </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>

            {isExpanded && (
                <div className="px-6 pb-6 border-t border-muted-foreground/8 pt-5 space-y-5">
                    {v.description && (
                        <div className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                            <FileText className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                            <p>{v.description}</p>
                        </div>
                    )}

                    {features.length > 0 && (
                        <div>
                            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3" /> Tính năng trong version này
                            </p>
                            <ul className="space-y-2">
                                {features.map((feat, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {v.notes && v.status !== "pending" && (
                        <div className="bg-muted/60 border border-muted-foreground/10 rounded-xl px-4 py-3 text-sm text-muted-foreground">
                            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground block mb-1">Ghi chú</span>
                            {v.notes}
                        </div>
                    )}

                    {isAdmin && v.status === "pending" && (
                        <div className="space-y-3 pt-2">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Ghi chú khi duyệt (tuỳ chọn)</label>
                                <textarea
                                    rows={2}
                                    value={noteInput}
                                    onChange={e => onNoteChange(e.target.value)}
                                    placeholder="Nhập ghi chú hoặc phản hồi..."
                                    className="w-full bg-muted/60 border border-muted-foreground/15 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/50 resize-none focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => onStatusChange(v.id, "approved")} disabled={isProcessing}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_20px_-5px_color-mix(in_srgb,var(--success)_40%,transparent)]">
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Duyệt version này
                                </button>
                                <button onClick={() => onStatusChange(v.id, "rejected")} disabled={isProcessing}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm font-semibold hover:bg-rose-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                    Từ chối
                                </button>
                            </div>
                        </div>
                    )}

                    {isAdmin && v.status === "approved" && (
                        <div className="pt-2">
                            <button onClick={() => onStatusChange(v.id, "archived")} disabled={isProcessing}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                                Archive
                            </button>
                        </div>
                    )}

                    {v.approved_at && (
                        <p className="text-xs text-muted-foreground/60">Duyệt lúc: {new Date(v.approved_at).toLocaleString("vi-VN")}</p>
                    )}
                </div>
            )}
        </div>
    );
}
