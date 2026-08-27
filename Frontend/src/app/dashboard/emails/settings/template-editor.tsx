"use client";

import { useState, useRef, useMemo } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import CodeEditor, { type CodeEditorRef } from "./_components/code-editor";
import { variablesFor, findUnknownVariables, extractUsedVariables } from "@/lib/email/template-variables";
import type { TemplateType } from "@/lib/email/template-variables";
import { SharedDashboardButton } from "@/components/shares";

interface Template {
    id: string;
    type: string;
    locale: string;
    subject: string;
    body_html: string;
}

interface TemplateEditorProps {
    template: Template;
    canEdit: boolean;
    onSaved: () => void;
}

export default function TemplateEditor({ template, canEdit, onSaved }: TemplateEditorProps) {
    const [subject, setSubject]     = useState(template.subject);
    const [body, setBody]           = useState(template.body_html);
    const [tab, setTab]             = useState<"edit" | "preview">("edit");
    const [saving, setSaving]       = useState(false);
    const [newVar, setNewVar]       = useState("");
    const [extraVars, setExtraVars] = useState<string[]>([]);
    const editorRef = useRef<CodeEditorRef>(null);
    const inputRef  = useRef<HTMLInputElement>(null);

    const predefinedVars = variablesFor(template.type as TemplateType);
    // Vars currently present in the editor body (for chip highlight)
    const usedVars = useMemo(() => new Set(extractUsedVariables(body)), [body]);

    // Yellow chips = vars found in body not in predefined list + manually added
    const bodyCustomVars = useMemo(
        () => findUnknownVariables(template.type as TemplateType, body),
        [template.type, body],
    );
    const customVars = useMemo(
        () => Array.from(new Set([...bodyCustomVars, ...extraVars])),
        [bodyCustomVars, extraVars],
    );

    function insertVariable(v: string) {
        editorRef.current?.insert(`{{${v}}}`);
    }

    function handleAddVar() {
        const v = newVar.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
        if (!v) { inputRef.current?.focus(); return; }
        if (!customVars.includes(v) && !predefinedVars.includes(v)) {
            setExtraVars((prev) => [...prev, v]);
        }
        insertVariable(v);
        setNewVar("");
    }

    function removeExtraVar(v: string) {
        setExtraVars((prev) => prev.filter((x) => x !== v));
    }

    async function handleSave() {
        setSaving(true);
        try {
            const res = await fetch(`/api/emails/templates/${template.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject, body_html: body }),
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error ?? "Save failed"); return; }
            if (data.warnings?.length) toast.warning(data.warnings[0]);
            else toast.success("Template saved");
            onSaved();
        } catch {
            toast.error("Network error while saving");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-4">
            {/* Subject */}
            <div>
                <label className="text-sm text-[#8B99B0] mb-1 block">Subject</label>
                <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={!canEdit}
                    className="w-full bg-[#0D1424] border border-[#8B99B0]/20 rounded-lg px-3 py-2 text-[#ECF0F7] text-sm focus:outline-none focus:border-[#5B6CF0]/60 disabled:opacity-50"
                />
            </div>

            {/* Edit / Preview tabs */}
            <div className="flex gap-2 border-b border-[#8B99B0]/20">
                {(["edit", "preview"] as const).map((t) => (
                    <SharedDashboardButton
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 text-sm capitalize border-b-2 -mb-px transition-colors ${
                            tab === t
                                ? "border-[#5B6CF0] text-[#ECF0F7]"
                                : "border-transparent text-[#8B99B0] hover:text-[#ECF0F7]"
                        }`}
                    >
                        {t}
                    </SharedDashboardButton>
                ))}
            </div>

            {tab === "edit" ? (
                <CodeEditor ref={editorRef} value={body} onChange={setBody} height="320px" />
            ) : (
                <iframe
                    srcDoc={body}
                    sandbox="allow-same-origin"
                    className="w-full h-80 bg-white rounded-lg border border-[#8B99B0]/20"
                    title="Template preview"
                />
            )}

            {/* All variable chips - blue (predefined) + yellow (custom) + add button at end */}
            <div className="flex flex-wrap gap-2 items-center">
                {predefinedVars.map((v) => {
                    const active = usedVars.has(v);
                    return (
                        <SharedDashboardButton
                            key={v}
                            onClick={() => insertVariable(v)}
                            disabled={!canEdit}
                            className={`px-2 py-1 text-xs rounded transition-colors disabled:opacity-40 font-mono ${
                                active
                                    ? "bg-[#5B6CF0]/40 border border-[#5B6CF0]/90 text-[#C4CFFF] shadow-sm shadow-[#5B6CF0]/30"
                                    : "bg-[#5B6CF0]/10 border border-[#5B6CF0]/30 text-[#7C8FFF] hover:bg-[#5B6CF0]/20"
                            }`}
                        >
                            {`{{${v}}}`}
                        </SharedDashboardButton>
                    );
                })}

                {customVars.map((v) => (
                    <span key={v} className="inline-flex items-center gap-0.5">
                        <SharedDashboardButton
                            onClick={() => insertVariable(v)}
                            disabled={!canEdit}
                            className="px-2 py-1 text-xs bg-[#F59E0B]/15 border border-[#F59E0B]/35 text-[#F59E0B] rounded hover:bg-[#F59E0B]/25 transition-colors disabled:opacity-40 font-mono"
                        >
                            {`{{${v}}}`}
                        </SharedDashboardButton>
                        {extraVars.includes(v) && canEdit && (
                            <SharedDashboardButton
                                onClick={() => removeExtraVar(v)}
                                className="text-[#5A6882] hover:text-[#F59E0B] transition-colors"
                                title="Remove"
                            >
                                <X className="w-3 h-3" />
                            </SharedDashboardButton>
                        )}
                    </span>
                ))}

                {/* Add custom var - input hidden, revealed on focus/hover */}
                {canEdit && (
                    <span className="inline-flex items-center gap-1">
                        <input
                            ref={inputRef}
                            value={newVar}
                            onChange={(e) => setNewVar(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddVar()}
                            placeholder="var_name"
                            className="w-0 opacity-0 focus:w-28 focus:opacity-100 bg-[#0D1424] border-0 focus:border border-[#F59E0B]/40 rounded px-0 focus:px-2 py-1 text-xs text-[#ECF0F7] font-mono focus:outline-none transition-all duration-200 placeholder:text-[#5A6882]"
                        />
                        <SharedDashboardButton
                            onClick={handleAddVar}
                            title="Add custom variable"
                            className="w-6 h-6 flex items-center justify-center rounded bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B] hover:bg-[#F59E0B]/30 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </SharedDashboardButton>
                    </span>
                )}
            </div>

            {/* Save - right-aligned green */}
            {canEdit && (
                <div className="flex justify-end pt-1">
                    <SharedDashboardButton
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save"}
                    </SharedDashboardButton>
                </div>
            )}
        </div>
    );
}
