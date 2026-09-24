"use client";
import { toneByName, type ToneName } from "@/lib/ui/tones";

import { useState, useCallback, Fragment } from "react";
import { toast } from "sonner";
import {
    Sparkles, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp,
    Check, X, GitBranch, FileText, Loader2, ShieldAlert,
    Archive, FilePen, Zap,
} from "lucide-react";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import VersionCreateDialog, { type VersionData } from "@/components/dashboard/version-create-dialog";
import { ArrowUpCircle, Pencil } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { SharedDashboardPageHeader } from "@/components/shares";

type Status = "draft" | "pending" | "approved" | "rejected" | "archived";

const STATUS_CONFIG: Record<Status, {
    label: string; icon: React.ComponentType<{ className?: string }>; bg: string; text: string; border: string; dot: string;
}> = {
    draft: { label: "Draft", icon: FilePen, bg: "bg-muted-foreground/10", text: "text-muted-foreground", border: "border-muted-foreground/25", dot: "bg-muted-foreground" },
    pending: { label: "Chờ duyệt", icon: Clock, bg: "bg-warning/10", text: "text-warning", border: "border-warning/25", dot: "bg-warning" },
    approved: { label: "Published", icon: CheckCircle2, bg: "bg-success/10", text: "text-success", border: "border-success/25", dot: "bg-success" },
    rejected: { label: "Từ chối", icon: XCircle, bg: "bg-danger/10", text: "text-danger", border: "border-danger/25", dot: "bg-danger" },
    archived: { label: "Archived", icon: Archive, bg: "bg-muted", text: "text-foreground/70", border: "border-border", dot: "bg-foreground/40" },
};

const CATEGORY_TONE: Record<string, ToneName> = { platform: "blue", feature: "violet", security: "pink", performance: "teal", fix: "orange" };

const ADMIN_TABS: { key: Status | "all"; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "draft", label: "Nháp" },
    { key: "pending", label: "Chờ duyệt" },
    { key: "approved", label: "Đã phát hành" },
    { key: "rejected", label: "Bị từ chối" },
    { key: "archived", label: "Lưu trữ" },
];

const CATEGORIES = [
    { value: "platform", label: "Platform", color: "text-primary" },
    { value: "feature", label: "Feature", color: "text-ai" },
    { value: "security", label: "Security", color: "text-danger" },
    { value: "performance", label: "Performance", color: "text-success" },
    { value: "fix", label: "Fix", color: "text-danger" },
] as const;

const STATUSES = [
    { value: "draft", label: "Draft", color: "text-muted-foreground", bg: "bg-muted-foreground/10", border: "border-muted-foreground/20" },
    { value: "pending", label: "Pending", color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
    { value: "approved", label: "Approved", color: "text-success", bg: "bg-success/10", border: "border-success/20" },
    { value: "rejected", label: "Rejected", color: "text-danger", bg: "bg-danger/10", border: "border-danger/20" },
    { value: "archived", label: "Archived", color: "text-foreground/70", bg: "bg-muted", border: "border-border" },
] as const;

const inputCls = "w-full bg-muted/60 border border-border/15 rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-border/40 focus:ring-1 focus:ring-primary/20 transition-all";
const labelCls = "text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2";

interface Props {
    versions: VersionData[];
    isAdmin: boolean;
    isSuperAdmin: boolean;
}

export default function VersionsClient({ versions: initialVersions, isAdmin, isSuperAdmin }: Props) {
    const [versions, setVersions] = useState<VersionData[]>(initialVersions);
    const [tab, setTab] = useState<Status | "all">("all");
    const [expanded, setExpanded] = useState<string | null>(
        initialVersions.find(v => v.status === "pending")?.id ?? null
    );
    const [processing, setProcessing] = useState<string | null>(null);
    const [noteInput, setNoteInput] = useState<Record<string, string>>({});

    // In-line Edit States
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>(null);
    const [standardizing, setStandardizing] = useState(false);
    const [rawInput, setRawInput] = useState("");

    const displayed = tab === "all" ? versions : versions.filter(v => v.status === tab);
    const pendingCount = versions.filter(v => v.status === "pending").length;

    const countStatus = (st: Status | "all") => st === "all" ? versions.length : versions.filter((v) => v.status === st).length;
    const monthOf = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { month: "long", year: "numeric" });

    const handleStatusChange = useCallback(async (id: string, newStatus: "approved" | "rejected" | "archived") => {
        setProcessing(id);
        try {
            const res = await fetch("/api/versions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id,
                    status: newStatus,
                    notes: noteInput[id]?.trim() || null,
                    ...(newStatus === "approved" ? { approved_at: new Date().toISOString() } : {}),
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "Update failed");

            setVersions(prev => prev.map(v => v.id === id ? json.version : v));
            const labels: Record<string, string> = { approved: "đã được duyệt", rejected: "đã bị từ chối", archived: "đã được lưu trữ" };
            toast.custom(() => (
                <div className="flex items-center gap-3 bg-muted border border-border/15 px-4 py-3 rounded-2xl shadow-2xl">
                    <span className="text-sm font-medium text-foreground">Version {labels[newStatus]}</span>
                </div>
            ));
        } catch {
            toast.error("Không thể cập nhật trạng thái, thử lại sau.");
        } finally {
            setProcessing(null);
        }
    }, [noteInput]);

    const handleStartEdit = (v: VersionData) => {
        setEditForm({
            id: v.id,
            version_number: v.version_number,
            title: v.title,
            description: v.description ?? "",
            category: v.category ?? "feature",
            status: v.status || "draft",
            ui_changes: v.ui_changes ?? "",
            ux_changes: v.ux_changes ?? "",
            bug_fixes: v.bug_fixes ?? "",
            is_critical: v.is_critical,
        });
        setEditingId(v.id);
        setExpanded(v.id);
        setRawInput("");
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm(null);
        setRawInput("");
    };

    const handleStandardizeEdit = async () => {
        if (!rawInput.trim()) { toast.error("Cần nhập nội dung thô để AI phân tích."); return; }
        setStandardizing(true);
        try {
            const res = await fetch("/api/ai/standardize-version", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ raw_content: rawInput, title: editForm.title, version_number: editForm.version_number }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "AI failed");
            setEditForm((prev: any) => ({
                ...prev,
                ui_changes: Array.isArray(data.ui_changes) ? data.ui_changes.join("\n") : data.ui_changes || "",
                ux_changes: Array.isArray(data.ux_changes) ? data.ux_changes.join("\n") : data.ux_changes || "",
                bug_fixes: Array.isArray(data.bug_fixes) ? data.bug_fixes.join("\n") : data.bug_fixes || "",
                description: data.summary || prev.description,
                is_critical: !!data.is_critical,
            }));
            toast.success("AI đã tối ưu hóa thông tin. Vui lòng kiểm tra lại trước khi lưu.");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Standardization failed");
        } finally {
            setStandardizing(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editForm.title.trim()) { toast.error("Tiêu đề không được để trống."); return; }
        setProcessing(editForm.id);
        try {
            const res = await fetch("/api/versions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editForm.id,
                    title: editForm.title.trim(),
                    description: editForm.description.trim() || null,
                    category: editForm.category,
                    status: editForm.status,
                    ui_changes: editForm.ui_changes || null,
                    ux_changes: editForm.ux_changes || null,
                    bug_fixes: editForm.bug_fixes || null,
                    is_critical: editForm.is_critical,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "Update failed");
            setVersions(prev => prev.map(v => v.id === editForm.id ? json.version : v));
            setEditingId(null);
            setEditForm(null);
            toast.success("Đã cập nhật phiên bản thành công.");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Cập nhật thất bại.");
        } finally {
            setProcessing(null);
        }
    };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

    return (
        <div className="min-h-screen bg-transparent text-foreground font-body">
            <AppNavbar />

            <PageContainer className="relative z-10 py-12">
                <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Version History" }]} />
                <SharedDashboardPageHeader
                    title="Version History"
                    icon={GitBranch}
                    badge={{ label: `${versions.length} phiên bản` }}
                    description="Quản lý và duyệt các phiên bản tính năng mới của hệ thống"
                    actions={isSuperAdmin ? <VersionCreateDialog onCreated={v => setVersions(prev => [v, ...prev])} /> : undefined}
                />
                <div className="mb-8">
                    {isSuperAdmin && pendingCount > 0 && (
                        <div className="flex items-start gap-3 bg-warning/[0.08] border border-warning/25 rounded-2xl px-5 py-4 mb-6">
                            <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-warning">{pendingCount} version đang chờ bạn duyệt</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Xem xét các tính năng mới và phê duyệt hoặc từ chối bên dưới.</p>
                            </div>
                        </div>
                    )}

                </div>

                {isSuperAdmin && (
                    <div className="flex items-center gap-1 mb-8 bg-card border border-border rounded-xl p-1 w-fit max-w-full overflow-x-auto">
                        {ADMIN_TABS.map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${tab === t.key ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {t.label}
                                <span className={`tabular-nums text-[10px] px-1.5 rounded-full ${tab === t.key ? "bg-white/25" : "bg-background"}`}>{countStatus(t.key)}</span>
                            </button>
                        ))}
                    </div>
                )}

                {displayed.length === 0 && (
                        <EmptyState
                            className="py-16"
                            icon={<GitBranch />}
                            title={tab === "all" ? "Chưa có phiên bản nào" : "Không có phiên bản ở trạng thái này"}
                            description={tab === "all" ? "Các bản phát hành sẽ hiện ở đây theo dòng thời gian." : "Chuyển sang tab khác để xem các phiên bản còn lại."}
                        />
                    )}

                <ol className={`relative ml-[132px] border-l-2 border-border pl-8 flex flex-col gap-5 ${displayed.length ? "" : "hidden"}`}>
                    {displayed.map((v, idx) => {
                        const month = monthOf(v.created_at);
                        const newMonth = idx === 0 || monthOf(displayed[idx - 1].created_at) !== month;
                        const status = (v.status as Status) in STATUS_CONFIG ? v.status as Status : "pending";
                        const cfg = STATUS_CONFIG[status];
                        const Icon = cfg.icon;
                        const isExpanded = expanded === v.id;
                        const isProcessing = processing === v.id;
                        const features: string[] = Array.isArray(v.features) ? v.features : [];

                        return (
                            <Fragment key={v.id}>
                            {newMonth && (
                                <li className="relative -mb-1 pt-2">
                                    <span className="absolute -left-[41px] top-2.5 w-4 h-4 rounded-full bg-background border-2 border-border" />
                                    <span className="absolute right-[calc(100%+3.5rem)] top-1.5 whitespace-nowrap text-sm font-extrabold capitalize text-foreground">{month}</span>
                                </li>
                            )}
                            <li className="relative">
                                <span className={`absolute -left-[39px] top-7 w-3 h-3 rounded-full ring-4 ring-background ${cfg.dot}`} />
                                <span className="absolute right-[calc(100%+3.5rem)] top-6 whitespace-nowrap text-right">
                                    <span className="block font-mono text-sm font-bold text-primary">v{v.version_number}</span>
                                    <span className="block text-[11px] text-muted-foreground tabular-nums">{formatDate(v.created_at)}</span>
                                </span>
                            <div
                                className={`bg-card border rounded-2xl overflow-hidden transition-shadow shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)] hover:shadow-[0_8px_24px_color-mix(in_srgb,var(--primary)_14%,transparent)] ${v.status === "pending" ? "border-warning/40" : "border-border"}`}
                            >
                                <div
                                    className="w-full flex flex-col md:flex-row md:items-center justify-between px-6 py-5 text-left transition-all cursor-pointer group hover:bg-muted/40"
                                    onClick={() => setExpanded(isExpanded ? null : v.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shrink-0 shadow-[0_0_8px_color-mix(in_srgb,var(--success)_30%,transparent)]`} />
                                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 flex-1">
                                            <div className="flex flex-col items-start">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-base font-semibold text-foreground group-hover:text-foreground transition-colors">{v.title}</span>
                                                    {v.category && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ color: toneByName(CATEGORY_TONE[v.category] ?? "gold").ink, backgroundColor: toneByName(CATEGORY_TONE[v.category] ?? "gold").bg }}>
                                                            {v.category}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                                                    <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                                        <Icon className="w-3 h-3" />
                                                        {cfg.label.toUpperCase()}
                                                    </span>
                                                    {features.length > 0 && (
                                                        <span className="flex items-center gap-1.5 text-[11px] font-medium opacity-70">
                                                            <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                                                            {features.length} tính năng
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 mt-4 md:mt-0 ml-7 md:ml-0" onClick={e => e.stopPropagation()}>
                                        {isSuperAdmin && editingId !== v.id && (
                                            <button
                                                onClick={() => handleStartEdit(v)}
                                                title="Sửa phiên bản"
                                                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        )}
                                        <div className="p-1.5 rounded-lg text-muted-foreground group-hover:text-foreground transition-colors">
                                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-6 pb-6 border-t border-border/8 pt-5 space-y-5">
                                        {editingId === v.id ? (
                                            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 ease-out pb-2">
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                    <div className="md:col-span-2">
                                                        <label className={labelCls}>Mô tả Tiêu đề</label>
                                                        <input
                                                            className={inputCls}
                                                            value={editForm.title}
                                                            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                                            placeholder="VD: Nâng cấp bảo mật & Giao diện"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={labelCls}>Phân loại</label>
                                                        <select
                                                            className={inputCls}
                                                            value={editForm.category}
                                                            onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                                        >
                                                            {CATEGORIES.map(c => <option key={c.value} value={c.value} className="bg-muted">{c.label}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className={labelCls}>Trạng thái hiện tại</label>
                                                        <select
                                                            className={`${inputCls} font-bold ${STATUS_CONFIG[editForm.status as Status]?.text}`}
                                                            value={editForm.status}
                                                            onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                                        >
                                                            {STATUSES.map(s => <option key={s.value} value={s.value} className="bg-muted text-foreground">{s.label}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className={labelCls}>Tóm tắt thay đổi chung</label>
                                                    <textarea
                                                        rows={2}
                                                        className={`${inputCls} resize-none h-24 leading-relaxed`}
                                                        value={editForm.description}
                                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                                        placeholder="Mô tả ngắn gọn về phiên bản cập nhật này..."
                                                    />
                                                </div>

                                                <div className="relative group/ai">
                                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-success/20 rounded-[28px] blur opacity-75 group-hover/ai:opacity-100 transition duration-1000 group-hover/ai:duration-200" />
                                                    <div className="relative bg-background/80 backdrop-blur-xl border border-border rounded-[24px] p-6 space-y-5 overflow-hidden">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
                                                                    <Sparkles className="w-4.5 h-4.5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Draft Intelligence</h3>
                                                                    <p className="text-[10px] text-muted-foreground font-medium">AI sẽ phân loại UI/UX từ dữ liệu thô của bạn</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={handleStandardizeEdit}
                                                                disabled={standardizing || !rawInput.trim()}
                                                                className="group/btn flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-background text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_8px_20px_-8px_rgba(255,255,255,0.4)]"
                                                            >
                                                                {standardizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-current" />}
                                                                {standardizing ? "Đang xử lý..." : "Optimize with AI"}
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            rows={3}
                                                            className="w-full bg-black/40 border border-border rounded-2xl px-5 py-4 text-sm text-foreground placeholder-muted-foreground/40 resize-none h-32 outline-none focus:border-border/30 transition-all font-mono leading-relaxed"
                                                            placeholder="Dán các bullet points hoặc ghi chú thô tại đây để AI tự động phân loại..."
                                                            value={rawInput}
                                                            onChange={e => setRawInput(e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-6">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-lg">🎨</span>
                                                                <label className={labelCls.replace("mb-2", "mb-0")}>Giao diện (UI)</label>
                                                            </div>
                                                            <textarea
                                                                rows={3}
                                                                className={`${inputCls} border-emerald-500/10 focus:border-emerald-500/40 resize-none h-28`}
                                                                value={editForm.ui_changes}
                                                                onChange={e => setEditForm({ ...editForm, ui_changes: e.target.value })}
                                                                placeholder="Mô tả các thay đổi về màu sắc, layout, icons..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-lg">✨</span>
                                                                <label className={labelCls.replace("mb-2", "mb-0")}>Trải nghiệm (UX)</label>
                                                            </div>
                                                            <textarea
                                                                rows={3}
                                                                className={`${inputCls} border-blue-500/10 focus:border-blue-500/40 resize-none h-28`}
                                                                value={editForm.ux_changes}
                                                                onChange={e => setEditForm({ ...editForm, ux_changes: e.target.value })}
                                                                placeholder="Thay đổi về luồng thao tác, độ mượt, tương tác..."
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-6">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-lg">🐛</span>
                                                                <label className={labelCls.replace("mb-2", "mb-0")}>Sửa lỗi (Bug Fixes)</label>
                                                            </div>
                                                            <textarea
                                                                rows={3}
                                                                className={`${inputCls} border-rose-500/10 focus:border-rose-500/40 resize-none h-28`}
                                                                value={editForm.bug_fixes}
                                                                onChange={e => setEditForm({ ...editForm, bug_fixes: e.target.value })}
                                                                placeholder="Mô tả các lỗi quan trọng đã được vá..."
                                                            />
                                                        </div>
                                                        <div
                                                            className={`p-5 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                                                                editForm.is_critical
                                                                    ? "bg-rose-500/10 border-rose-500/30"
                                                                    : "bg-muted/50 border-border hover:border-border"
                                                            }`}
                                                            onClick={() => setEditForm({ ...editForm, is_critical: !editForm.is_critical })}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                                                                    editForm.is_critical
                                                                        ? "bg-rose-500 text-foreground shadow-lg shadow-rose-500/30 rotate-12"
                                                                        : "bg-background text-muted-foreground"
                                                                }`}>
                                                                    <ArrowUpCircle className="w-5.5 h-5.5" />
                                                                </div>
                                                                <div>
                                                                    <p className={`text-sm font-bold transition-colors ${editForm.is_critical ? "text-rose-400" : "text-foreground"}`}>Bản vá Quan trọng</p>
                                                                    <p className="text-[10px] text-muted-foreground font-medium">Đánh dấu update ưu tiên cao</p>
                                                                </div>
                                                            </div>
                                                            <div className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${editForm.is_critical ? "bg-rose-500" : "bg-black/40"}`}>
                                                                <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 ${editForm.is_critical ? "translate-x-6" : "translate-x-0"}`} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-6 border-t border-border">
                                                    <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-2">
                                                        <Clock className="w-3 h-3" /> Chế độ Chỉnh sửa In-Line đang hoạt động
                                                    </p>
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={handleCancelEdit}
                                                            className="px-6 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all uppercase tracking-widest"
                                                        >
                                                            Hủy thao tác
                                                        </button>
                                                        <button
                                                            onClick={handleSaveEdit}
                                                            disabled={!!processing || !editForm.title.trim()}
                                                            className="flex items-center gap-2.5 px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-primary hover:shadow-[0_0_25px_-5px_color-mix(in_srgb,var(--primary)_50%,transparent)] text-white text-[11px] font-black uppercase tracking-[0.10em] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                                        >
                                                            {processing === editForm.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                                                            {processing === editForm.id ? "Đang lưu..." : "Lưu phiên bản"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {v.description && (
                                                    <div className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                                                        <FileText className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                                                        <p>{v.description}</p>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {v.ui_changes && (
                                                        <div className="space-y-3">
                                                            <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 flex items-center gap-2">
                                                                <Sparkles className="w-3 h-3" /> UI Enhancement
                                                            </p>
                                                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                                                {v.ui_changes}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {v.ux_changes && (
                                                        <div className="space-y-3">
                                                            <p className="text-[10px] uppercase tracking-widest font-bold text-blue-400 flex items-center gap-2">
                                                                <Sparkles className="w-3 h-3" /> UX Optimization
                                                            </p>
                                                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                                                {v.ux_changes}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {v.bug_fixes && (
                                                    <div className="space-y-3 pt-2">
                                                        <p className="text-[10px] uppercase tracking-widest font-bold text-rose-400 flex items-center gap-2">
                                                            <ShieldAlert className="w-3 h-3" /> {v.is_critical ? "Critical Bug Fix" : "Bug Fixes"}
                                                        </p>
                                                        <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                                            {v.bug_fixes}
                                                        </div>
                                                    </div>
                                                )}

                                                {v.notes && v.status !== "pending" && (
                                                    <div className="bg-muted/60 border border-border/10 rounded-xl px-4 py-3 text-sm text-muted-foreground">
                                                        <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground block mb-1">Ghi chú</span>
                                                        {v.notes}
                                                    </div>
                                                )}

                                                {isSuperAdmin && v.status === "pending" && (
                                                    <div className="space-y-3 pt-2">
                                                        <div>
                                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                                                Ghi chú khi duyệt (tuỳ chọn)
                                                            </label>
                                                            <textarea
                                                                rows={2}
                                                                value={noteInput[v.id] ?? ""}
                                                                onChange={e => setNoteInput(prev => ({ ...prev, [v.id]: e.target.value }))}
                                                                placeholder="Nhập ghi chú hoặc phản hồi..."
                                                                className="w-full bg-muted/60 border border-border/15 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/50 resize-none focus:outline-none focus:border-border/40 focus:ring-1 focus:ring-primary/20 transition-all"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => handleStatusChange(v.id, "approved")}
                                                                disabled={!!processing}
                                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_20px_-5px_color-mix(in_srgb,var(--success)_40%,transparent)]"
                                                            >
                                                                {processing === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                                Duyệt version này
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusChange(v.id, "rejected")}
                                                                disabled={!!processing}
                                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm font-semibold hover:bg-rose-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                                            >
                                                                {processing === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                                                Từ chối
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {isSuperAdmin && v.status === "approved" && (
                                                    <div className="pt-2">
                                                        <button
                                                            onClick={() => handleStatusChange(v.id, "archived")}
                                                            disabled={!!processing}
                                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                                        >
                                                            {processing === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                                                            Archive
                                                        </button>
                                                    </div>
                                                )}

                                                {v.approved_at && (
                                                    <p className="text-xs text-muted-foreground/60">
                                                        Duyệt lúc: {new Date(v.approved_at).toLocaleString("vi-VN")}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            </li>
                            </Fragment>
                        );
                    })}
                </ol>
            </PageContainer>
        </div>
    );
}
