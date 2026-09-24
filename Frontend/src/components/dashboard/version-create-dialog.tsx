"use client";

import { useState } from "react";
import { Plus, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Props {
    onCreated: (version: VersionData) => void;
}

export interface VersionData {
    id: string;
    version_number: string;
    title: string;
    description: string | null;
    features: string[];
    status: string;
    category: string | null;
    approved_at: string | null;
    notes: string | null;
    created_at: string;
    ui_changes: string | null;
    ux_changes: string | null;
    bug_fixes: string | null;
    is_critical: boolean;
    scheduled_publish_at: string | null;
}

const CATEGORIES = [
    { value: "platform", label: "Platform" },
    { value: "feature", label: "Feature" },
    { value: "security", label: "Security" },
    { value: "performance", label: "Performance" },
    { value: "fix", label: "Fix" },
] as const;

export default function VersionCreateDialog({ onCreated }: Props) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        version_number: "",
        title: "",
        description: "",
        category: "feature" as string,
        ui_changes: "",
        ux_changes: "",
        bug_fixes: "",
        is_critical: false,
        raw_input: ""
    });

    const [isStandardizing, setIsStandardizing] = useState(false);

    function field(key: keyof typeof form) {
        return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
            setForm(prev => ({ ...prev, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));
    }

    async function handleStandardize() {
        if (!form.raw_input.trim()) {
            toast.error("Please provide raw release details for AI analysis.");
            return;
        }
        setIsStandardizing(true);
        try {
            const res = await fetch("/api/ai/standardize-version", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    raw_content: form.raw_input,
                    title: form.title,
                    version_number: form.version_number
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Intelligence core failed");

            setForm(prev => ({
                ...prev,
                ui_changes: Array.isArray(data.ui_changes) ? data.ui_changes.join("\n") : data.ui_changes || "",
                ux_changes: Array.isArray(data.ux_changes) ? data.ux_changes.join("\n") : data.ux_changes || "",
                bug_fixes: Array.isArray(data.bug_fixes) ? data.bug_fixes.join("\n") : data.bug_fixes || "",
                description: data.summary || prev.description,
                is_critical: !!data.is_critical
            }));
            toast.success("Identity standardized. Please review before confirmation.");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Standardization failed");
        } finally {
            setIsStandardizing(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.version_number.trim() || !form.title.trim()) {
            toast.error("Version number and title are required.");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/versions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    version_number: form.version_number.trim(),
                    title: form.title.trim(),
                    description: form.description.trim() || null,
                    category: form.category,
                    status: "draft",
                    ui_changes: form.ui_changes || null,
                    ux_changes: form.ux_changes || null,
                    bug_fixes: form.bug_fixes || null,
                    is_critical: form.is_critical,
                    features: [] // Legacy field, keeping for compatibility
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "Failed to create");
            onCreated(json.version);
            setOpen(false);
            setForm({ version_number: "", title: "", description: "", category: "feature", ui_changes: "", ux_changes: "", bug_fixes: "", is_critical: false, raw_input: "" });
            toast.success("Version draft created.");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setSaving(false);
        }
    }

    const inputCls = "w-full bg-muted/60 border border-muted-foreground/15 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all";
    const labelCls = "text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5";

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors"
            >
                <Plus className="w-4 h-4" />
                Create Version
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <div className="relative bg-muted border border-muted-foreground/15 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Create Version Draft</h2>
                            <p className="text-xs text-muted-foreground mt-1">New version starts as draft and must be submitted for review.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Version Number</label>
                                    <input className={inputCls} placeholder="e.g. 2.1.0" value={form.version_number} onChange={field("version_number")} />
                                </div>
                                <div>
                                    <label className={labelCls}>Category</label>
                                    <select className={inputCls} value={form.category} onChange={field("category")}>
                                        {CATEGORIES.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Title</label>
                                <input className={inputCls} placeholder="Release title" value={form.title} onChange={field("title")} />
                            </div>

                            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className={`${labelCls} mb-0 flex items-center gap-2 text-indigo-300`}>
                                        <Sparkles className="w-3 h-3" /> Raw Changes (AI Input)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleStandardize}
                                        disabled={isStandardizing || !form.raw_input.trim()}
                                        className="text-[10px] font-bold uppercase tracking-widest bg-indigo-500 hover:bg-indigo-400 text-foreground px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                                    >
                                        {isStandardizing ? "Analyzing..." : "Optimize with AI"}
                                    </button>
                                </div>
                                <textarea rows={4} className={`${inputCls} bg-background border-border resize-none`} placeholder="Paste raw notes here... #123 Fixed header, added avatar UX #456..." value={form.raw_input} onChange={field("raw_input")} />
                            </div>

                            <div className="space-y-4 border-t border-border pt-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reviewed Structured Data</p>

                                <div>
                                    <label className={labelCls}>🎨 UI (User Interface)</label>
                                    <textarea rows={2} className={`${inputCls} bg-emerald-500/[0.02] border-emerald-500/10`} placeholder="Automated categorization..." value={form.ui_changes} onChange={field("ui_changes")} />
                                </div>

                                <div>
                                    <label className={labelCls}>✨ UX (User Experience)</label>
                                    <textarea rows={2} className={`${inputCls} bg-blue-500/[0.02] border-blue-500/10`} placeholder="Automated categorization..." value={form.ux_changes} onChange={field("ux_changes")} />
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className={labelCls}>🐛 Critical Bug Fixes</label>
                                        <textarea rows={2} className={`${inputCls} bg-rose-500/[0.02] border-rose-500/10`} placeholder="Automated categorization..." value={form.bug_fixes} onChange={field("bug_fixes")} />
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 shrink-0">
                                        <input type="checkbox" id="is_critical" checked={form.is_critical} onChange={field("is_critical")} className="w-4 h-4 rounded border-border bg-muted focus:ring-0" />
                                        <label htmlFor="is_critical" className="text-xs font-semibold text-rose-400">Critical</label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 sticky bottom-0 bg-muted py-2">
                                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-foreground text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Confirm & Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
