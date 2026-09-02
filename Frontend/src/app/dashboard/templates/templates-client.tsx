"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Search, Briefcase, Clock, FileText, Trash2, Play, Globe, User } from "lucide-react";

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
    Junior: "bg-[#36DDAB]/10 text-[#36DDAB] border-[#36DDAB]/20",
    Mid: "bg-[#7C8FFF]/10 text-[#7C8FFF] border-[#7C8FFF]/20",
    Senior: "bg-[#FF6B82]/10 text-[#FF6B82] border-[#FF6B82]/20",
};

export default function TemplatesClient({ templates: initial, isAdmin, userId }: Props) {
    const router = useRouter();
    const [templates, setTemplates] = useState(initial);
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ name: "", description: "", job_role: "", level: "Junior", question_count: 10, time_limit: 30, target_type: "candidate", job_description: "", test_description: "" });

    const filtered = templates.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.job_role.toLowerCase().includes(search.toLowerCase())
    );

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-[#ECF0F7] font-display">Assessment Templates</h1>
                    <p className="text-sm text-[#8B99B0] mt-1">{templates.length} template{templates.length !== 1 ? "s" : ""} available</p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="bg-[#5B6CF0] hover:bg-[#4F5FD9] text-white cursor-pointer">
                    <Plus className="w-4 h-4 mr-2" /> New Template
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6882]" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates..." className="pl-9 bg-[#1B253B] border-[#8B99B0]/15 text-[#ECF0F7]" />
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <Card className="border-[#8B99B0]/10 bg-[#1B253B] p-12 text-center">
                    <FileText className="w-10 h-10 text-[#5A6882] mx-auto mb-3" />
                    <p className="text-[#8B99B0]">{search ? "No templates match your search" : "No templates yet. Create one to get started."}</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((t) => (
                        <Card key={t.id} className="border-[#8B99B0]/10 bg-[#1B253B] hover:bg-[#222C4A] transition-colors group">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="text-sm font-medium text-[#ECF0F7]/90 truncate">{t.name}</CardTitle>
                                    <Badge variant="outline" className="shrink-0 text-[10px] h-5">
                                        {t.is_global ? <><Globe className="w-3 h-3 mr-1" />Global</> : <><User className="w-3 h-3 mr-1" />Own</>}
                                    </Badge>
                                </div>
                                {t.description && <p className="text-xs text-[#8B99B0] line-clamp-2 mt-1">{t.description}</p>}
                            </CardHeader>
                            <CardContent className="pt-0 space-y-3">
                                <div className="flex flex-wrap gap-1.5">
                                    <Badge className={`${levelColors[t.level] || "bg-[#1B253B] text-[#8B99B0]"} px-2 py-0 h-5 text-[11px] border`}>{t.level}</Badge>
                                    <Badge variant="outline" className="h-5 text-[11px] text-[#8B99B0] border-[#8B99B0]/15">
                                        <Briefcase className="w-3 h-3 mr-1" />{t.job_role}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-[#5A6882]">
                                    <span>{t.question_count} questions</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.time_limit}m</span>
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <Button size="sm" onClick={() => handleUseTemplate(t)} className="flex-1 h-7 text-xs bg-[#5B6CF0]/10 hover:bg-[#5B6CF0]/20 text-[#7C8FFF] border border-[#5B6CF0]/20 cursor-pointer">
                                        <Play className="w-3 h-3 mr-1" /> Use
                                    </Button>
                                    {(t.created_by === userId || isAdmin) && (
                                        <Button size="sm" variant="ghost" onClick={() => handleDelete(t.id)} className="h-7 text-xs text-[#FF6B82] hover:text-[#FF6B82] hover:bg-[#FF6B82]/10 cursor-pointer">
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
                <DialogContent className="bg-[#1B253B] border-[#8B99B0]/10 text-[#ECF0F7] max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Senior Backend Interview" className="bg-[#1B253B] border-[#8B99B0]/15" /></div>
                        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description..." className="bg-[#1B253B] border-[#8B99B0]/15 h-16" /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label>Job Role *</Label><Input value={form.job_role} onChange={(e) => setForm((f) => ({ ...f, job_role: e.target.value }))} placeholder="e.g. Backend Developer" className="bg-[#1B253B] border-[#8B99B0]/15" /></div>
                            <div>
                                <Label>Level</Label>
                                <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} className="w-full h-9 rounded-md bg-[#1B253B] border border-[#8B99B0]/15 text-[#ECF0F7] text-sm px-3">
                                    {["Junior", "Mid", "Senior"].map((l) => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label>Questions</Label><Input type="number" value={form.question_count} onChange={(e) => setForm((f) => ({ ...f, question_count: Number(e.target.value) }))} className="bg-[#1B253B] border-[#8B99B0]/15" /></div>
                            <div><Label>Time Limit (min)</Label><Input type="number" value={form.time_limit} onChange={(e) => setForm((f) => ({ ...f, time_limit: Number(e.target.value) }))} className="bg-[#1B253B] border-[#8B99B0]/15" /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-[#8B99B0] cursor-pointer">Cancel</Button>
                        <Button onClick={handleCreate} disabled={creating} className="bg-[#5B6CF0] hover:bg-[#4F5FD9] cursor-pointer">{creating ? "Creating..." : "Create"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
