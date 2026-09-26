"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Clock, FileText, Trash2, Play, Globe, ListChecks, LayoutTemplate } from "lucide-react";
import { SharedDashboardButton, SharedDashboardPageHeader } from "@/components/shares";
import { EmptyState } from "@/components/ui/empty-state";
import FilterBar from "@/components/crm/filter-bar";
import type { FilterOption } from "@/lib/crm/types";
import { toneByName, toneAt, type ToneName } from "@/lib/ui/tones";

interface Template {
    id: string;
    name: string;
    description: string | null;
    job_role: string;
    level: string;
    question_count: number;
    time_limit: number;
    target_type: string;
    job_description: string | null;
    test_description: string | null;
    is_global: boolean;
    created_by: string;
    created_at: string;
}

interface Props {
    templates: Template[];
    isAdmin: boolean;
    userId: string;
}

/* Cấp độ là phân loại, không phải trạng thái: dùng tông, không dùng xanh/đỏ. */
const LEVEL_TONE: Record<string, ToneName> = { Junior: "teal", Mid: "blue", Senior: "violet" };
const levelTone = (l: string) => toneByName(LEVEL_TONE[l] ?? "gold");

const LEVELS = ["Junior", "Mid", "Senior"];
const levelOptions: FilterOption[] = LEVELS.map((l) => ({ value: l, label: l }));

export default function TemplatesClient({ templates: initial, isAdmin, userId }: Props) {
    const router = useRouter();
    const [templates, setTemplates] = useState(initial);
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ name: "", description: "", job_role: "", level: "Junior", question_count: 10, time_limit: 30, target_type: "candidate", job_description: "", test_description: "" });

    const [levelFilter, setLevelFilter] = useState("");

    const filtered = templates.filter((t) =>
        (!levelFilter || t.level === levelFilter) &&
        (t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.job_role.toLowerCase().includes(search.toLowerCase()))
    );

    /* Kệ theo vị trí: role nhiều mẫu nhất lên trước. */
    const shelves = useMemo(() => {
        const m = new Map<string, Template[]>();
        for (const t of filtered) m.set(t.job_role, [...(m.get(t.job_role) ?? []), t]);
        return [...m].sort((a, b) => b[1].length - a[1].length);
    }, [filtered]);
    const roleCount = new Set(templates.map((t) => t.job_role)).size;

    async function handleCreate() {
        if (!form.name || !form.job_role) { toast.error("Name and job role are required"); return; }
        setCreating(true);
        try {
            const res = await fetch("/api/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setTemplates((prev) => [data.template, ...prev]);
            setShowCreate(false);
            setForm({ name: "", description: "", job_role: "", level: "Junior", question_count: 10, time_limit: 30, target_type: "candidate", job_description: "", test_description: "" });
            toast.success("Template created");
        } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create template"); }
        finally { setCreating(false); }
    }

    async function handleDelete(id: string) {
        try {
            const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
            setTemplates((prev) => prev.filter((t) => t.id !== id));
            toast.success("Template deleted");
        } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to delete"); }
    }

    function handleUseTemplate(t: Template) {
        const params = new URLSearchParams({
            template_name: t.name,
            job_role: t.job_role,
            level: t.level,
            question_count: String(t.question_count),
            time_limit: String(t.time_limit),
            target_type: t.target_type,
            ...(t.job_description ? { job_description: t.job_description } : {}),
            ...(t.test_description ? { test_description: t.test_description } : {}),
        });
        router.push(`/dashboard/create?${params.toString()}`);
    }

    return (
        <div className="space-y-6 pb-12 text-foreground">
            <SharedDashboardPageHeader
                title="Templates"
                icon={LayoutTemplate}
                badge={{ label: `${templates.length} mẫu · ${roleCount} vị trí` }}
                description="Mẫu đề đánh giá tái sử dụng cho ứng viên và nhân viên"
                actions={(
                    <SharedDashboardButton
                        variant="primary"
                        onClick={() => setShowCreate(true)}
                        leadingIcon={<Plus className="h-4 w-4" />}
                    >
                        New Template
                    </SharedDashboardButton>
                )}
            />

            <FilterBar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Tìm theo tên, vị trí..."
                filters={[{ key: "level", label: "Level", options: levelOptions, value: levelFilter, onChange: setLevelFilter }]}
                onClearAll={() => { setSearch(""); setLevelFilter(""); }}
            />

            {/* Grid */}
            {filtered.length === 0 ? (
                (search || levelFilter) ? (
                    <EmptyState
                        className="py-16"
                        icon={<FileText />}
                        title="Không có mẫu phù hợp"
                        description="Thử từ khoá khác hoặc bỏ bộ lọc cấp độ."
                        action={<Button variant="outline" onClick={() => { setSearch(""); setLevelFilter(""); }}>Bỏ bộ lọc</Button>}
                    />
                ) : (
                    <EmptyState
                        className="py-16"
                        icon={<LayoutTemplate />}
                        title="Chưa có mẫu bài test nào"
                        description="Lưu cấu hình đề hay dùng thành mẫu để tạo bài test nhanh hơn."
                        action={<Button onClick={() => setShowCreate(true)} className="gap-1.5"><Plus />Tạo mẫu</Button>}
                    />
                )
            ) : (
                <div className="space-y-8">
                    {shelves.map(([role, items], si) => {
                        const tone = toneAt(si);
                        return (
                            <section key={role}>
                                <div className="flex items-baseline gap-3 mb-3">
                                    <span className="w-2 h-5 rounded-full self-center" style={{ backgroundColor: tone.mark }} />
                                    <h2 className="text-lg font-extrabold text-foreground">{role}</h2>
                                    <span className="text-xs font-semibold text-muted-foreground tabular-nums">{items.length} mẫu</span>
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x">
                                    {items.map((t) => {
                                        const lt = levelTone(t.level);
                                        return (
                                            <article key={t.id} className="group snap-start w-[300px] shrink-0 rounded-2xl border border-border bg-card overflow-hidden flex flex-col transition-shadow shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)] hover:shadow-[0_8px_24px_color-mix(in_srgb,var(--primary)_14%,transparent)]">
                                                <div className="h-1.5" style={{ backgroundColor: lt.mark }} />
                                                <div className="p-5 flex-1 flex flex-col">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ color: lt.ink, backgroundColor: lt.bg }}>{t.level}</span>
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                                                            {t.is_global ? <><Globe className="w-3 h-3" />Dùng chung</> : "Của tôi"}
                                                        </span>
                                                    </div>
                                                    <h3 className="mt-3 font-bold text-foreground leading-snug line-clamp-2">{t.name}</h3>
                                                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 min-h-8">{t.description}</p>
                                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                                        <div className="rounded-xl bg-muted/60 px-3 py-2">
                                                            <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground"><ListChecks className="w-3 h-3" />Câu hỏi</p>
                                                            <p className="text-xl font-black tabular-nums text-foreground">{t.question_count}</p>
                                                        </div>
                                                        <div className="rounded-xl bg-muted/60 px-3 py-2">
                                                            <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground"><Clock className="w-3 h-3" />Phút</p>
                                                            <p className="text-xl font-black tabular-nums text-foreground">{t.time_limit}</p>
                                                        </div>
                                                    </div>
                                                    <p className="mt-3 text-[11px] font-semibold text-muted-foreground">
                                                        {t.target_type === "employee" ? "Đánh giá nhân viên" : "Đánh giá ứng viên"}
                                                    </p>
                                                    <div className="mt-auto pt-4 flex gap-2">
                                                        <Button size="sm" onClick={() => handleUseTemplate(t)} className="flex-1 h-9 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                                                            <Play className="w-3.5 h-3.5 mr-1" /> Dùng mẫu này
                                                        </Button>
                                                        {(t.created_by === userId || isAdmin) && (
                                                            <Button size="sm" variant="ghost" aria-label="Xóa mẫu" onClick={() => handleDelete(t.id)} className="h-9 text-danger hover:text-danger hover:bg-danger/10 cursor-pointer">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="bg-muted border-border/10 text-foreground max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Senior Backend Interview" className="bg-muted border-border/15" /></div>
                        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description..." className="bg-muted border-border/15 h-16" /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label>Job Role *</Label><Input value={form.job_role} onChange={(e) => setForm((f) => ({ ...f, job_role: e.target.value }))} placeholder="e.g. Backend Developer" className="bg-muted border-border/15" /></div>
                            <div>
                                <Label>Level</Label>
                                <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} className="w-full h-9 rounded-md bg-muted border border-border/15 text-foreground text-sm px-3">
                                    {["Junior", "Mid", "Senior"].map((l) => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label>Questions</Label><Input type="number" value={form.question_count} onChange={(e) => setForm((f) => ({ ...f, question_count: Number(e.target.value) }))} className="bg-muted border-border/15" /></div>
                            <div><Label>Time Limit (min)</Label><Input type="number" value={form.time_limit} onChange={(e) => setForm((f) => ({ ...f, time_limit: Number(e.target.value) }))} className="bg-muted border-border/15" /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-muted-foreground cursor-pointer">Cancel</Button>
                        <Button onClick={handleCreate} disabled={creating} className="bg-primary hover:bg-primary cursor-pointer">{creating ? "Creating..." : "Create"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
