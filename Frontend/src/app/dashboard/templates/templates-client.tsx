"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Briefcase, Clock, FileText, Trash2, Play, Globe, User, Users, Timer } from "lucide-react";
import { SharedDashboardButton, SharedDashboardPageHeader } from "@/components/shares";
import KpiCardGrid from "@/components/crm/kpi-card-grid";
import FilterBar from "@/components/crm/filter-bar";
import OverviewBand from "@/components/shares/overview-band";
import { DonutStat, HBarList, colorAt } from "@/components/charts";
import type { KpiCardData, FilterOption } from "@/lib/crm/types";

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

const levelColors: Record<string, string> = {
    Junior: "bg-success/10 text-success border-border/20",
    Mid: "bg-primary/10 text-primary border-border/20",
    Senior: "bg-danger/10 text-danger border-border/20",
};

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

    /* KPI + dải tổng quan: suy ra từ `templates` đã fetch, không thêm truy vấn. */
    const kpis: KpiCardData[] = useMemo(() => {
        const avg = templates.length ? Math.round(templates.reduce((s, t) => s + t.time_limit, 0) / templates.length) : 0;
        return [
            { label: "Tổng template", value: templates.length, icon: FileText },
            { label: "Global", value: templates.filter((t) => t.is_global).length, icon: Globe },
            { label: "Của tôi", value: templates.filter((t) => t.created_by === userId).length, icon: User },
            { label: "Cho ứng viên", value: templates.filter((t) => t.target_type === "candidate").length, icon: Users },
            { label: "Cho nhân viên", value: templates.filter((t) => t.target_type === "employee").length, icon: Briefcase },
            { label: "Thời lượng TB", value: `${avg}m`, icon: Timer },
        ];
    }, [templates, userId]);

    const byLevel = useMemo(() => LEVELS.map((l, i) => ({
        label: l, value: templates.filter((t) => t.level === l).length, color: colorAt(i),
    })).filter((s) => s.value > 0), [templates]);

    const byTarget = useMemo(() => [
        { label: "Ứng viên", value: templates.filter((t) => t.target_type === "candidate").length, color: "var(--primary)" },
        { label: "Nhân viên", value: templates.filter((t) => t.target_type === "employee").length, color: "var(--success)" },
    ].filter((s) => s.value > 0), [templates]);

    const byRole = useMemo(() => {
        const counts = new Map<string, number>();
        for (const t of templates) counts.set(t.job_role, (counts.get(t.job_role) ?? 0) + 1);
        return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    }, [templates]);

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
                className="mb-10"
                title="Assessment Templates"
                description="Mẫu đề đánh giá tái sử dụng cho ứng viên và nhân viên"
                actions={(
                    <SharedDashboardButton
                        onClick={() => setShowCreate(true)}
                        className="bg-primary hover:bg-primary text-white h-12 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all font-semibold gap-2 border-0"
                        leadingIcon={<Plus className="h-5 w-5" />}
                    >
                        New Template
                    </SharedDashboardButton>
                )}
            />

            <KpiCardGrid items={kpis} />

            {templates.length > 0 && (
                <OverviewBand className="mt-6">
                    <DonutStat title="Theo cấp độ" slices={byLevel} centerLabel="Mẫu" />
                    <DonutStat title="Theo đối tượng" slices={byTarget} centerLabel="Mẫu" />
                    <HBarList title="Theo vị trí" items={byRole} />
                </OverviewBand>
            )}

            <FilterBar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Tìm theo tên, vị trí..."
                filters={[{ key: "level", label: "Level", options: levelOptions, value: levelFilter, onChange: setLevelFilter }]}
                onClearAll={() => { setSearch(""); setLevelFilter(""); }}
            />

            {/* Grid */}
            {filtered.length === 0 ? (
                <Card className="border-border bg-card p-12 text-center">
                    <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{search ? "No templates match your search" : "No templates yet. Create one to get started."}</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((t) => (
                        <Card key={t.id} className="border-border bg-card hover:bg-accent/50 transition-colors group">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="text-sm font-medium text-foreground/90 truncate">{t.name}</CardTitle>
                                    <Badge variant="outline" className="shrink-0 text-[10px] h-5">
                                        {t.is_global ? <><Globe className="w-3 h-3 mr-1" />Global</> : <><User className="w-3 h-3 mr-1" />Own</>}
                                    </Badge>
                                </div>
                                {t.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.description}</p>}
                            </CardHeader>
                            <CardContent className="pt-0 space-y-3">
                                <div className="flex flex-wrap gap-1.5">
                                    <Badge className={`${levelColors[t.level] || "bg-muted text-muted-foreground"} px-2 py-0 h-5 text-[11px] border`}>{t.level}</Badge>
                                    <Badge variant="outline" className="h-5 text-[11px] text-muted-foreground border-border/15">
                                        <Briefcase className="w-3 h-3 mr-1" />{t.job_role}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span>{t.question_count} questions</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.time_limit}m</span>
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <Button size="sm" onClick={() => handleUseTemplate(t)} className="flex-1 h-7 text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-border/20 cursor-pointer">
                                        <Play className="w-3 h-3 mr-1" /> Use
                                    </Button>
                                    {(t.created_by === userId || isAdmin) && (
                                        <Button size="sm" variant="ghost" onClick={() => handleDelete(t.id)} className="h-7 text-xs text-danger hover:text-danger hover:bg-danger/10 cursor-pointer">
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
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
