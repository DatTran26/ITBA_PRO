"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, Clock, Users, Calendar, ArrowRight, LayoutDashboard, ShieldAlert, BadgeInfo, RefreshCw, Sparkles, X, Loader2, Pencil, Trash2, AlertTriangle, Power, UserPlus, Type, CheckCircle2 } from "lucide-react";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnimatePresence, motion } from "framer-motion";
import { PremiumBackground } from "@/components/ui/premium-background";
import { TestResultsTable } from "@/components/dashboard/test-results-table";

interface Question {
    id: string;
    question_text: string;
    options: string[];
    correct_answer: number;
    topic: string;
    difficulty: string;
    explanation: string;
    order_num: number;
    grading_mode?: "auto" | "manual" | null;
    question_type?: string;
}

interface Result {
    id: string;
    candidate_name: string;
    candidate_email: string;
    score: number;
    total_questions: number;
    time_taken: number;
    submitted_at: string;
    status: "pass" | "fail" | null;
    grading_status?: "pending_grading" | "graded" | null;
    ai_analysis: {
        recommendation?: string;
    } | null;
}

interface Test {
    id: string;
    title?: string;
    job_role: string;
    level: string;
    share_token: string;
    status: string;
    created_at: string;
    time_limit_minutes: number;
    max_participants: number | null;
    questions: Question[];
    results: Result[];
    target_type?: string | null;
    position_id?: string | null;
    group_id?: string | null;
}

interface GenerationContext {
    job_description: string | null;
    test_description: string | null;
}

interface RegenerateModalState {
    open: boolean;
    mode: "full" | "single";
    questionId?: string;
    questionTopic?: string;
    questionIndex?: number;
}

export default function TestDetailClient({
    test,
    generationContext,
    embedded = false,
}: {
    test: Test;
    generationContext?: GenerationContext;
    embedded?: boolean;
}) {
    const [mounted, setMounted] = useState(false);
    const [questions, setQuestions] = useState<Question[]>(test.questions || []);
    const [results, setResults] = useState<Result[]>(test.results || []);
    const [activeTab, setActiveTab] = useState<"criteria" | "results">("criteria");
    const hasManualQuestions = questions.some((q) => q.grading_mode === "manual");

    const [regenerateModal, setRegenerateModal] = useState<RegenerateModalState>({
        open: false,
        mode: "full",
    });
    const [customPrompt, setCustomPrompt] = useState("");
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [regeneratingQuestionId, setRegeneratingQuestionId] = useState<string | null>(null);

    // Inline edit state (title + time limit + max participants)
    const [displayTitle, setDisplayTitle] = useState(test.title || test.job_role);
    const [displayTime, setDisplayTime] = useState(test.time_limit_minutes);
    const [displayMaxP, setDisplayMaxP] = useState<number | null>(test.max_participants ?? null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(test.title || test.job_role);
    const [editTime, setEditTime] = useState<string>(test.time_limit_minutes.toString());
    const [editMaxP, setEditMaxP] = useState<string>(test.max_participants?.toString() ?? "");
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [displayStatus, setDisplayStatus] = useState(test.status);
    const [isSavingStatus, setIsSavingStatus] = useState(false);
    const router = useRouter();

    // Resolve position/group names for display
    const [positionName, setPositionName] = useState<string | null>(null);
    const [groupName, setGroupName] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    /* ── Realtime: listen for new candidate results ── */
    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel(`results:test_id=${test.id}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "results", filter: `test_id=eq.${test.id}` },
                (payload) => {
                    const newResult = payload.new as Result;
                    setResults((prev) => {
                        if (prev.some((r) => r.id === newResult.id)) return prev;
                        return [...prev, newResult];
                    });
                    toast.info(`New submission: ${newResult.candidate_name || "Candidate"}`);
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "results", filter: `test_id=eq.${test.id}` },
                (payload) => {
                    const updatedResult = payload.new as Result;
                    setResults((prev) => prev.map((r) => r.id === updatedResult.id ? { ...r, ...updatedResult } : r));
                }
            )
            .subscribe((status, err) => {
                if (status === "CHANNEL_ERROR") {
                    console.warn("Realtime subscription error:", err);
                }
            });

        return () => { supabase.removeChannel(channel); };
    }, [test.id]);

    useEffect(() => {
        if (test.position_id) {
            fetch(`/api/positions/${test.position_id}`)
                .then((r) => r.json())
                .then((d) => { if (d.position?.title) setPositionName(d.position.title); })
                .catch(() => {});
        }
        if (test.group_id) {
            fetch(`/api/groups/${test.group_id}`)
                .then((r) => r.json())
                .then((d) => { if (d.group?.name) setGroupName(d.group.name); })
                .catch(() => {});
        }
    }, [test.position_id, test.group_id]);

    const levelColors: Record<string, { bg: string; text: string; border: string }> = {
        Junior: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
        Mid: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
        Senior: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
    };

    const lvlConfig = levelColors[test.level] || levelColors.Mid;

    function copyLink(token: string) {
        const link = `${window.location.origin}/test/${token}`;
        navigator.clipboard.writeText(link);
        toast.custom(() => (
            <div className="flex items-center gap-3 bg-[#1B253B] border border-[#8B99B0]/15 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-[#ECF0F7] font-body">Link Copied</span>
                    <span className="text-xs text-[#5A6882] font-body">Ready to share</span>
                </div>
            </div>
        ));
    }

    function openRegenerateModal(mode: "full" | "single", question?: Question, index?: number) {
        setCustomPrompt("");
        setRegenerateModal({
            open: true,
            mode,
            questionId: question?.id,
            questionTopic: question?.topic,
            questionIndex: index,
        });
    }

    function closeRegenerateModal() {
        if (isRegenerating) return;
        setRegenerateModal({ open: false, mode: "full" });
        setCustomPrompt("");
    }

    const handleRegenerate = useCallback(async () => {
        setIsRegenerating(true);
        const { mode, questionId } = regenerateModal;

        if (mode === "single" && questionId) {
            setRegeneratingQuestionId(questionId);
        }

        try {
            const payload: Record<string, string> = { test_id: test.id };
            if (questionId) payload.question_id = questionId;
            if (customPrompt.trim()) payload.custom_prompt = customPrompt.trim();

            const res = await fetch("/api/ai/regenerate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Regeneration failed");
            }

            if (data.mode === "full" && data.test?.questions) {
                const sorted = [...data.test.questions].sort(
                    (a: Question, b: Question) => a.order_num - b.order_num
                );
                setQuestions(sorted);
                toast.custom(() => (
                    <div className="flex items-center gap-3 bg-[#1B253B] border border-[#8B99B0]/15 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl">
                        <div className="w-8 h-8 rounded-full bg-[#7C8FFF]/20 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-[#7C8FFF]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-[#ECF0F7] font-body">Test Regenerated</span>
                            <span className="text-xs text-[#5A6882] font-body">{sorted.length} new questions generated</span>
                        </div>
                    </div>
                ));
            } else if (data.mode === "single" && data.question) {
                setQuestions((prev) =>
                    prev.map((q) => (q.id === questionId ? { ...data.question, order_num: q.order_num } : q))
                );
                toast.custom(() => (
                    <div className="flex items-center gap-3 bg-[#1B253B] border border-[#8B99B0]/15 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl">
                        <div className="w-8 h-8 rounded-full bg-[#7C8FFF]/20 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-[#7C8FFF]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-[#ECF0F7] font-body">Question Replaced</span>
                            <span className="text-xs text-[#5A6882] font-body">New question generated successfully</span>
                        </div>
                    </div>
                ));
            }

            closeRegenerateModal();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Something went wrong";
            toast.custom(() => (
                <div className="flex items-center gap-3 bg-[#1B253B] border border-rose-500/20 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl">
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                        <X className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#ECF0F7] font-body">Regeneration Failed</span>
                        <span className="text-xs text-[#5A6882] font-body">{message}</span>
                    </div>
                </div>
            ));
        } finally {
            setIsRegenerating(false);
            setRegeneratingQuestionId(null);
        }
    }, [regenerateModal, customPrompt, test.id]);

    async function handleSave() {
        const trimmedTitle = editTitle.trim();
        const newTime = parseInt(editTime, 10);
        const newMaxP = editMaxP.trim() === "" ? null : parseInt(editMaxP, 10);

        // Validate
        const validTitle = trimmedTitle || displayTitle;
        const validTime = !isNaN(newTime) && newTime > 0 ? newTime : displayTime;
        const validMaxP = (newMaxP === null || (!isNaN(newMaxP) && newMaxP > 0)) ? newMaxP : displayMaxP;

        setIsSaving(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("tests")
                .update({ title: validTitle, time_limit_minutes: validTime, max_participants: validMaxP })
                .eq("id", test.id);
            if (error) throw error;
            setDisplayTitle(validTitle);
            setDisplayTime(validTime);
            setDisplayMaxP(validMaxP);
            setIsEditing(false);
            toast.custom(() => (
                <div className="flex items-center gap-3 bg-[#1B253B] border border-[#8B99B0]/15 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#ECF0F7] font-body">Đã lưu thay đổi</span>
                        <span className="text-xs text-[#5A6882] font-body">Các thông tin đã được cập nhật</span>
                    </div>
                </div>
            ));
        } catch {
            toast.custom(() => (
                <div className="flex items-center gap-3 bg-[#1B253B] border border-rose-500/20 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl">
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                        <X className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#ECF0F7] font-body">Lưu thất bại</span>
                        <span className="text-xs text-[#5A6882] font-body">Vui lòng thử lại</span>
                    </div>
                </div>
            ));
            setIsEditing(false);
        } finally {
            setIsSaving(false);
        }
    }

    function handleCancelEdit() {
        setIsEditing(false);
        setEditTitle(displayTitle);
        setEditTime(displayTime.toString());
        setEditMaxP(displayMaxP?.toString() ?? "");
    }

    async function handleToggleStatus() {
        const newStatus = displayStatus === "Deactivate" ? "Live" : "Deactivate";
        setIsSavingStatus(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("tests")
                .update({ status: newStatus })
                .eq("id", test.id);
            if (error) throw error;
            setDisplayStatus(newStatus);
            toast.custom(() => (
                <div className={`flex items-center gap-3 bg-[#1B253B] border ${newStatus === "Live" ? "border-emerald-500/20" : "border-rose-500/20"} px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl`}>
                    <div className={`w-8 h-8 rounded-full ${newStatus === "Live" ? "bg-emerald-500/20" : "bg-rose-500/20"} flex items-center justify-center`}>
                        {newStatus === "Live" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Power className="w-4 h-4 text-rose-400" />}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#ECF0F7] font-body">
                            {newStatus === "Live" ? "Assessment Activated" : "Assessment Deactivated"}
                        </span>
                        <span className="text-xs text-[#5A6882] font-body">Status updated successfully</span>
                    </div>
                </div>
            ));
        } catch {
            toast.error("Status update failed");
        } finally {
            setIsSavingStatus(false);
        }
    }

    async function handleDelete() {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/tests/${test.id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Assessment deleted successfully");
            router.push("/dashboard");
        } catch (err) {
            toast.error("Deletion failed");
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    }

    if (!mounted) return null;


    const content = (
        <>
            {!embedded && <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: displayTitle }]} />}
                {/* Hero Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border flex items-center gap-1.5 ${lvlConfig.bg} ${lvlConfig.text} ${lvlConfig.border}`}
                            >
                                <ShieldAlert className="w-3 h-3" />
                                {test.level}
                            </div>
                            <span className="text-xs font-medium text-[#5A6882] uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(test.created_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                            </span>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-[0.1em] uppercase border flex items-center gap-2 transition-all duration-300 ${
                                (displayStatus?.toLowerCase() === "live" || displayStatus?.toLowerCase() === "active") ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_-5px_rgba(16,185,129,0.4)]" :
                                displayStatus?.toLowerCase() === "deactivate" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                "bg-white/5 text-[#8B99B0] border-white/10"
                            }`}>
                                <div className="relative flex items-center justify-center">
                                    {(displayStatus?.toLowerCase() === "live" || displayStatus?.toLowerCase() === "active") && (
                                        <div className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-40" />
                                    )}
                                    <div className={`w-1.5 h-1.5 rounded-full relative z-10 ${
                                        (displayStatus?.toLowerCase() === "live" || displayStatus?.toLowerCase() === "active") ? "bg-emerald-400" :
                                        displayStatus?.toLowerCase() === "deactivate" ? "bg-rose-400" :
                                        "bg-[#5A6882]"
                                    }`} />
                                </div>
                                {(displayStatus?.toLowerCase() === "live" || displayStatus?.toLowerCase() === "active") ? "ACTIVE" : displayStatus}
                            </div>
                            {test.target_type && test.target_type !== "candidate" && (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border-amber-500/20">
                                    <BadgeInfo className="w-3 h-3" />
                                    {test.target_type === "employee" ? "Employee Eval" : test.target_type}
                                </span>
                            )}
                             {positionName && (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1.5 bg-white/5 backdrop-blur-md text-[#8B99B0] border-[#8B99B0]/15 truncate max-w-[160px]">
                                    {positionName}
                                </span>
                            )}
                            {groupName && (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1.5 bg-white/5 backdrop-blur-md text-[#8B99B0] border-[#8B99B0]/15 truncate max-w-[160px]">
                                    <Users className="w-3 h-3 shrink-0" />
                                    {groupName}
                                </span>
                            )}
                        </div>
                        {isEditing ? (
                            /* ── Edit Mode Redesign: Pro VIP Control Panel ── */
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col gap-8 w-full max-w-xl bg-[#111827]/60 backdrop-blur-2xl border border-[#FFB86C]/20 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Pencil className="w-24 h-24 text-[#FFB86C]" />
                                </div>

                                <div className="space-y-6 relative z-10">
                                    {/* Title Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Type className="w-3.5 h-3.5 text-[#FFB86C]" />
                                            <label className="text-[10px] uppercase tracking-widest font-black text-[#5A6882]">Assessment Title</label>
                                        </div>
                                        <input
                                            autoFocus
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Escape") handleCancelEdit(); }}
                                            disabled={isSaving}
                                            className="w-full text-2xl lg:text-3xl font-light tracking-tight text-[#ECF0F7] bg-white/[0.03] border-b border-[#FFB86C]/30 focus:border-[#FFB86C] focus:bg-white/[0.06] outline-none px-4 py-3 rounded-t-xl transition-all font-display"
                                        />
                                    </div>

                                    {/* Duration and Capacity Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-[#FFB86C]" />
                                                <label className="text-[10px] uppercase tracking-widest font-black text-[#5A6882]">Duration</label>
                                            </div>
                                            <div className="relative group">
                                                <input
                                                    type="number"
                                                    value={editTime}
                                                    onChange={(e) => setEditTime(e.target.value)}
                                                    disabled={isSaving}
                                                    className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-2xl px-4 text-center text-lg font-medium text-[#ECF0F7] focus:border-[#FFB86C]/50 focus:bg-white/[0.06] outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#5A6882] pointer-events-none uppercase">Min</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <UserPlus className="w-3.5 h-3.5 text-[#FFB86C]" />
                                                <label className="text-[10px] uppercase tracking-widest font-black text-[#5A6882]">Capacity</label>
                                            </div>
                                            <div className="relative group">
                                                <input
                                                    type="number"
                                                    value={editMaxP}
                                                    onChange={(e) => setEditMaxP(e.target.value)}
                                                    disabled={isSaving}
                                                    placeholder="∞"
                                                    className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-2xl px-4 text-center text-lg font-medium text-[#ECF0F7] placeholder:text-[#5A6882] focus:border-[#FFB86C]/50 focus:bg-white/[0.06] outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#5A6882] pointer-events-none uppercase">Users</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/[0.05] relative z-10">
                                    <div className="flex items-center gap-1 text-[10px] text-[#5A6882] font-medium uppercase tracking-tight">
                                        <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">ESC</kbd>
                                        <span className="ml-1">to discard changes</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleCancelEdit}
                                            disabled={isSaving}
                                            className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#8B99B0] hover:text-[#ECF0F7] hover:bg-white/5 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FFB86C] text-[#0F172A] text-xs font-black uppercase tracking-widest hover:bg-[#FFC68C] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_-5px_rgba(255,184,108,0.3)] disabled:opacity-50"
                                        >
                                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                            Save Settings
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            /* ── View Mode ── */
                            <>
                                <div className="mb-6 flex items-start gap-3">
                                    <h1 className="text-5xl lg:text-7xl font-light tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-[#ECF0F7] via-[#ECF0F7]/90 to-[#ECF0F7]/20 drop-shadow-sm font-display leading-tight">
                                        {displayTitle}
                                    </h1>
                                    <button
                                        onClick={() => {
                                            setEditTitle(displayTitle);
                                            setEditTime(displayTime.toString());
                                            setEditMaxP(displayMaxP?.toString() ?? "");
                                            setIsEditing(true);
                                        }}
                                        title="Chỉnh sửa title và thời gian"
                                        className="mt-3 lg:mt-5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 transition-all duration-200"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <p className="text-lg text-[#5A6882] font-light leading-relaxed max-w-xl">
                                    Comprehensive assessment configured for{" "}
                                    <strong className="text-[#8B99B0] font-medium">{questions.length || 0}</strong> evaluation
                                    points over a{" "}
                                    <strong className="text-[#8B99B0] font-medium">{displayTime}</strong>-minute
                                    timeframe.
                                </p>
                            </>
                        )}
                    </div>

                    {/* Stats & Share */}
                    <div className="flex flex-col gap-4 min-w-[320px]">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#111827]/40 border border-[#8B99B0]/10 rounded-2xl p-4 backdrop-blur-xl flex flex-col justify-between">
                                <Users className="w-4 h-4 text-[#5A6882] mb-4" />
                                <div>
                                    <div className="flex items-baseline gap-1 mb-0.5">
                                        <span className="text-2xl font-light text-[#ECF0F7] font-display">
                                            {results?.length || 0}
                                        </span>
                                        {displayMaxP && (
                                            <span className="text-sm text-[#5A6882] font-display">/ {displayMaxP}</span>
                                        )}
                                    </div>
                                    <span className="text-xs text-[#5A6882] font-medium uppercase tracking-wider">
                                        Candidates
                                    </span>
                                </div>
                            </div>
                            <div className="bg-[#111827]/40 border border-[#8B99B0]/10 rounded-2xl p-4 backdrop-blur-xl flex flex-col justify-between">
                                <Clock className="w-4 h-4 text-[#5A6882] mb-4" />
                                <div>
                                    <span className="block text-2xl font-light text-[#ECF0F7] mb-0.5 font-display">
                                        {displayTime}
                                    </span>
                                    <span className="text-xs text-[#5A6882] font-medium uppercase tracking-wider">
                                        Minutes
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => copyLink(test.share_token)}
                                className="group relative w-full flex items-center justify-between px-5 py-3.5 bg-[#111827]/40 border border-[#FFB86C]/30 backdrop-blur-xl rounded-2xl text-[#FFB86C] overflow-hidden transition-all active:scale-[0.98] hover:bg-[#FFB86C]/10 hover:border-[#FFB86C]/50 shadow-lg shadow-black/20"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-[#FFB86C]/0 via-[#FFB86C]/10 to-[#FFB86C]/0 -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                                <span className="relative font-bold text-[11px] uppercase tracking-widest">Copy Share Link</span>
                                <Copy className="relative w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                            </button>

                            {displayStatus === "Deactivate" ? (
                                <button
                                    onClick={handleToggleStatus}
                                    disabled={isSavingStatus}
                                    className="w-full h-12 flex items-center justify-between px-5 py-3.5 bg-emerald-500/15 border border-emerald-500/30 backdrop-blur-xl rounded-2xl text-emerald-400 text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-500/25 transition-all shadow-lg shadow-black/20"
                                >
                                    <span>Activate Assessment</span>
                                    {isSavingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                                </button>
                            ) : (
                                <button
                                    onClick={handleToggleStatus}
                                    disabled={isSavingStatus}
                                    className="w-full h-12 flex items-center justify-between px-5 py-3.5 bg-rose-500/15 border border-rose-500/30 backdrop-blur-xl rounded-2xl text-rose-400 text-[11px] font-bold uppercase tracking-widest hover:bg-rose-500/25 transition-all shadow-lg shadow-black/20"
                                >
                                    <span>Deactivate Assessment</span>
                                    {isSavingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                                </button>
                            )}

                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full h-12 flex items-center justify-center gap-2 px-5 py-3 bg-white/[0.03] border border-white/[0.05] rounded-2xl text-[#5A6882] text-[11px] font-bold uppercase tracking-widest hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5 opacity-50" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs switcher */}
                <div className="flex border-b border-[#8B99B0]/10 mb-8 z-10 relative">
                    <button
                        onClick={() => setActiveTab("criteria")}
                        className={`pb-4 px-6 text-sm font-semibold tracking-wider uppercase border-b-2 transition-all ${
                            activeTab === "criteria"
                                ? "border-[#7C8FFF] text-[#7C8FFF]"
                                : "border-transparent text-[#5A6882] hover:text-[#ECF0F7]"
                        }`}
                    >
                        Assessment Criteria ({questions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("results")}
                        className={`pb-4 px-6 text-sm font-semibold tracking-wider uppercase border-b-2 transition-all ${
                            activeTab === "results"
                                ? "border-[#7C8FFF] text-[#7C8FFF]"
                                : "border-transparent text-[#5A6882] hover:text-[#ECF0F7]"
                        }`}
                    >
                        Candidate Results ({results.length})
                    </button>
                </div>

                {activeTab === "criteria" ? (
                    /* Content Grid */
                    <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-start">
                    {/* Left Col: Questions */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8">
                        <div className="flex items-center justify-between pb-4 border-b border-[#8B99B0]/10">
                            <h2 className="text-xl font-medium text-[#ECF0F7] flex items-center gap-3 font-display">
                                Assessment Criteria
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[#222C4A] text-[#8B99B0] font-medium font-body">
                                    {questions.length}
                                </span>
                            </h2>

                            {/* Regenerate Full Test Button — amber/yellow */}
                            <button
                                onClick={() => openRegenerateModal("full")}
                                disabled={isRegenerating}
                                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wide hover:bg-amber-500/25 hover:border-amber-400/50 hover:text-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_-5px_rgba(245,158,11,0.3)]"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating && !regeneratingQuestionId ? "animate-spin" : ""}`} />
                                Regenerate All
                            </button>
                        </div>

                        <div className="space-y-5">
                            {questions.map((q, idx) => {
                                const isThisRegenerating = regeneratingQuestionId === q.id;
                                return (
                                    <div
                                        key={q.id}
                                        className={`relative bg-[#111827]/40 backdrop-blur-md border rounded-2xl overflow-hidden transition-all duration-300 ${isThisRegenerating ? "border-amber-500/30" : "border-[#8B99B0]/10 hover:border-[#8B99B0]/20 hover:bg-[#111827]/60"}`}
                                    >
                                        {/* Regenerating Overlay */}
                                        {isThisRegenerating && (
                                            <div className="absolute inset-0 z-20 bg-[#1B253B]/90 flex flex-col items-center justify-center gap-3">
                                                <div className="w-10 h-10 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
                                                <span className="text-sm text-amber-300 font-medium">Regenerating...</span>
                                            </div>
                                        )}

                                        {/* Top action bar */}
                                        <div className="flex items-center justify-between px-5 py-3 border-b border-[#8B99B0]/8 bg-[#1B253B]/50">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-mono font-bold text-[#5A6882]/60 w-6">
                                                    {(idx + 1).toString().padStart(2, "0")}
                                                </span>
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#222C4A]/60 border border-[#8B99B0]/10">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#7C8FFF]" />
                                                    <span className="text-[11px] text-[#8B99B0] font-semibold tracking-wider uppercase">
                                                        {q.topic}
                                                    </span>
                                                </div>
                                                {(q.correct_answer < 0 || q.correct_answer >= q.options.length) && (
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20">
                                                        <ShieldAlert className="w-3 h-3 text-rose-400" />
                                                        <span className="text-[10px] text-rose-400 font-bold uppercase tracking-tight">Incomplete Data</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Regenerate Single */}
                                            <button
                                                onClick={() => openRegenerateModal("single", q, idx)}
                                                disabled={isRegenerating}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold hover:bg-amber-500/20 hover:border-amber-400/40 hover:text-amber-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <RefreshCw className="w-3 h-3" />
                                                Regenerate
                                            </button>
                                        </div>

                                        <div className="p-6 md:p-7">
                                            <div className="text-[17px] md:text-lg font-normal text-[#ECF0F7]/90 leading-relaxed mb-6 [&>p]:mb-4 [&>pre]:bg-[#222C4A] [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>blockquote]:border-l-2 [&>blockquote]:border-[#7C8FFF]/50 [&>blockquote]:bg-[#7C8FFF]/5 [&>blockquote]:p-3 [&>blockquote]:my-4 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:my-4 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:my-4 [&_code]:text-[#9BABFF] [&_code]:bg-[#7C8FFF]/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {q.question_text}
                                                </ReactMarkdown>
                                            </div>

                                            {/* Answers: correct first, then the rest */}
                                            <div className="grid gap-2.5">
                                                {[
                                                    ...(q.correct_answer >= 0 && q.correct_answer < q.options.length
                                                        ? [{ opt: q.options[q.correct_answer], origIdx: q.correct_answer }]
                                                        : []),
                                                    ...q.options
                                                        .map((opt, i) => ({ opt, origIdx: i }))
                                                        .filter((x) => x.origIdx !== q.correct_answer),
                                                ].map(({ opt, origIdx }, displayIdx) => {
                                                    const isCorrect = origIdx === q.correct_answer;
                                                    const isValidIdx = origIdx >= 0 && origIdx < q.options.length;

                                                    return (
                                                        <div
                                                            key={origIdx}
                                                            className={`relative flex items-center p-3.5 rounded-xl text-sm transition-colors ${
                                                                isCorrect
                                                                    ? "bg-emerald-500/[0.08] text-emerald-100 border border-emerald-500/20"
                                                                    : "bg-white/[0.03] text-[#8B99B0] border border-transparent hover:bg-white/[0.06]"
                                                            }`}
                                                        >
                                                            <div
                                                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mr-4 shrink-0 font-medium border ${
                                                                    isCorrect
                                                                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                                                        : "bg-[#1B253B] text-[#5A6882] border-[#8B99B0]/15"
                                                                }`}
                                                            >
                                                                {isValidIdx ? String.fromCharCode(65 + origIdx) : "!"}
                                                            </div>
                                                            <span className="leading-relaxed pr-8">{opt}</span>
                                                            {isCorrect && (
                                                                <div className="absolute right-4 flex items-center gap-1.5 text-emerald-400">
                                                                    <Check className="w-4 h-4" />
                                                                    <span className="text-[11px] font-semibold uppercase tracking-wider">Correct</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {q.explanation && (
                                                <div className="mt-6 pt-5 border-t border-[#8B99B0]/8">
                                                    <div className="flex items-start gap-3 bg-[#7C8FFF]/[0.04] rounded-xl p-4 border border-[#7C8FFF]/[0.08]">
                                                        <BadgeInfo className="w-4 h-4 shrink-0 mt-0.5 text-[#7C8FFF]/80" />
                                                        <p className="text-[13px] md:text-sm font-light leading-relaxed text-[#9BABFF]/70">
                                                            {q.explanation}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Col: Leaderboard */}
                    <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 sticky top-24">
                        <div className="flex items-center justify-between pb-4 border-b border-[#8B99B0]/10">
                            <h2 className="text-xl font-medium text-[#ECF0F7] flex items-center gap-2 font-display">
                                Candidates
                            </h2>
                        </div>

                        {!results || results.length === 0 ? (
                            <div className="bg-transparent border border-dashed border-[#8B99B0]/15 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 rounded-full bg-[#1B253B]/60 border border-[#8B99B0]/10 flex items-center justify-center mb-6">
                                    <Users className="w-6 h-6 text-[#5A6882]" />
                                </div>
                                <h3 className="text-[#ECF0F7]/80 font-medium mb-2 font-display">Awaiting Candidates</h3>
                                <p className="text-sm text-[#5A6882] max-w-[200px] leading-relaxed">
                                    Share the test link to start receiving applications.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {results.map((r) => {
                                    const pct = r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0;

                                    const tierColors =
                                        pct >= 80
                                            ? "from-emerald-500/30 to-emerald-500/0 border-emerald-500/20 text-emerald-400"
                                            : pct >= 50
                                              ? "from-amber-500/30 to-amber-500/0 border-amber-500/20 text-amber-400"
                                              : "from-rose-500/30 to-rose-500/0 border-rose-500/20 text-rose-400";

                                    return (
                                        <Link key={r.id} href={`/dashboard/results/${r.id}`}>
                                            <div className="group relative bg-[#111827]/40 backdrop-blur-md border border-[#8B99B0]/10 rounded-2xl p-5 hover:border-[#8B99B0]/20 hover:bg-[#111827]/60 transition-all overflow-hidden shadow-xl">
                                                <div
                                                    className={`absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b ${tierColors}`}
                                                />

                                                <div className="flex items-center justify-between relative z-10 w-full pl-3">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-[#222C4A] border border-[#8B99B0]/15 flex items-center justify-center text-sm font-semibold text-[#8B99B0] font-display">
                                                                {r.candidate_name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[15px] font-medium text-[#ECF0F7] group-hover:text-[#7C8FFF] transition-colors font-display tracking-wide">
                                                                    {r.candidate_name}
                                                                </span>
                                                                <span className="text-[11px] text-[#5A6882]">
                                                                    {r.candidate_email}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className="flex items-baseline gap-0.5">
                                                            <span className="text-2xl font-light tracking-tight text-[#ECF0F7] font-display leading-none">
                                                                {pct}
                                                            </span>
                                                            <span className="text-xs font-semibold text-[#5A6882]">%</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {r.status && (
                                                                <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                                                    r.status === 'pass'
                                                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                                                                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                                                                }`}>
                                                                    {r.status}
                                                                </div>
                                                            )}
                                                            {r.ai_analysis?.recommendation && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <div
                                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                                            ["Recommend", "Đề nghị", "Khuyến nghị", "TIỀM NĂNG", "Khuyên dùng", "ĐỀ XUẤT", "KHUYÊN DÙNG"].includes(r.ai_analysis.recommendation) || r.ai_analysis.recommendation.toUpperCase().includes("KHUYẾN NGHỊ") && !r.ai_analysis.recommendation.toUpperCase().includes("KHÔNG")
                                                                                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                                                                                : ["Consider", "Cân nhắc", "CÂN NHẮC"].includes(r.ai_analysis.recommendation) || r.ai_analysis.recommendation.toUpperCase().includes("CÂN NHẮC")
                                                                                  ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                                                                                  : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                                                                        }`}
                                                                    />
                                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#8B99B0]">
                                                                        {r.ai_analysis.recommendation}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
                ) : (
                    <div className="w-full relative z-10">
                        <TestResultsTable results={results} hasManualQuestions={hasManualQuestions} />
                    </div>
                )}
        </>
    );

    return (
        <div className={`${embedded ? "h-full" : "min-h-screen"} bg-[#05070A] text-[#ECF0F7] selection:bg-[#FFB86C]/30 overflow-hidden font-body relative`}>
            {!embedded && <PremiumBackground />}

            {!embedded && <AppNavbar />}

            {embedded ? (
                <div className="relative z-10 h-full overflow-y-auto px-4 py-6">{content}</div>
            ) : (
                <PageContainer className="relative z-10">{content}</PageContainer>
            )}

            {/* Regeneration Modal */}
            {regenerateModal.open && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/60"
                            onClick={closeRegenerateModal}
                        />

                        {/* Modal */}
                        <div className="relative w-full max-w-lg bg-[#1B253B] border border-[#8B99B0]/15 rounded-3xl shadow-2xl overflow-hidden">
                            {/* Modal Header */}
                            <div className="relative px-6 pt-6 pb-4 border-b border-[#8B99B0]/10">
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                            {regenerateModal.mode === "full" ? (
                                                <RefreshCw className="w-5 h-5 text-amber-400" />
                                            ) : (
                                                <Sparkles className="w-5 h-5 text-amber-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-[#ECF0F7] font-display">
                                                {regenerateModal.mode === "full"
                                                    ? "Regenerate Full Test"
                                                    : "Regenerate Question"}
                                            </h3>
                                            <p className="text-xs text-[#5A6882] mt-0.5">
                                                {regenerateModal.mode === "full"
                                                    ? `Replace all ${questions.length} questions with new ones`
                                                    : `Replace question #${(regenerateModal.questionIndex ?? 0) + 1} — ${regenerateModal.questionTopic}`}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeRegenerateModal}
                                        disabled={isRegenerating}
                                        className="w-8 h-8 rounded-lg bg-[#222C4A]/60 border border-[#8B99B0]/15 flex items-center justify-center text-[#5A6882] hover:text-[#ECF0F7] hover:bg-[#222C4A] transition-all disabled:opacity-50"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="px-6 py-5 space-y-5">
                                {/* Context Info */}
                                <div className="bg-[#1B253B]/60 border border-[#8B99B0]/10 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-[#8B99B0] uppercase tracking-wider">
                                        <BadgeInfo className="w-3.5 h-3.5" />
                                        Existing Context
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-[#5A6882]">Role:</span>
                                            <span className="text-[#ECF0F7]/80 font-medium">{test.title || test.job_role}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-[#5A6882]">Level:</span>
                                            <span className={`font-medium ${lvlConfig.text}`}>{test.level}</span>
                                        </div>
                                    </div>
                                    {generationContext?.job_description && (
                                        <div className="text-xs text-[#5A6882]/70 pt-1 border-t border-[#8B99B0]/8">
                                            Job description will be used for context
                                        </div>
                                    )}
                                    {generationContext?.test_description && (
                                        <div className="text-xs text-[#5A6882]/70">
                                            Test format constraints will be preserved
                                        </div>
                                    )}
                                </div>

                                {/* Custom Prompt */}
                                <div className="space-y-2">
                                    <label className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-[#8B99B0]">
                                            Custom Prompt
                                            <span className="text-[#5A6882] font-normal ml-1.5">(optional)</span>
                                        </span>
                                    </label>
                                    <textarea
                                        value={customPrompt}
                                        onChange={(e) => setCustomPrompt(e.target.value)}
                                        disabled={isRegenerating}
                                        placeholder={
                                            regenerateModal.mode === "full"
                                                ? "e.g., Focus more on system design and scalability patterns..."
                                                : "e.g., Make this question about error handling in async operations..."
                                        }
                                        rows={3}
                                        className="w-full bg-[#1B253B]/60 border border-[#8B99B0]/15 rounded-xl px-4 py-3 text-sm text-[#ECF0F7] placeholder-[#5A6882]/50 resize-none focus:outline-none focus:border-[#7C8FFF]/40 focus:ring-1 focus:ring-[#7C8FFF]/20 transition-all disabled:opacity-50"
                                    />
                                    <p className="text-[11px] text-[#5A6882]/60 leading-relaxed">
                                        {customPrompt.trim()
                                            ? "Your custom prompt will be combined with the existing test context."
                                            : "Leave empty to regenerate using the original test context only."}
                                    </p>
                                </div>

                                {/* Warning for full test */}
                                {regenerateModal.mode === "full" && (
                                    <div className="flex items-start gap-3 bg-amber-500/[0.05] border border-amber-500/10 rounded-xl p-3.5">
                                        <ShieldAlert className="w-4 h-4 text-amber-400/80 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-200/60 leading-relaxed">
                                            This will replace <strong className="text-amber-200/80">all {questions.length} questions</strong> with
                                            newly generated ones. This action cannot be undone.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-[#8B99B0]/10 flex items-center justify-end gap-3">
                                <button
                                    onClick={closeRegenerateModal}
                                    disabled={isRegenerating}
                                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#8B99B0] hover:text-[#ECF0F7] hover:bg-[#222C4A]/50 transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRegenerate}
                                    disabled={isRegenerating}
                                    className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-black hover:bg-amber-400 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)]"
                                >
                                    {isRegenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            <span>
                                                {regenerateModal.mode === "full"
                                                    ? "Regenerate All"
                                                    : "Regenerate Question"}
                                            </span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => !isDeleting && setShowDeleteConfirm(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-[#1B253B] border border-rose-500/30 rounded-3xl shadow-2xl overflow-hidden p-8 flex flex-col items-center text-center"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
                                <AlertTriangle className="w-8 h-8 text-rose-400" />
                            </div>
                            <h3 className="text-xl font-medium text-[#ECF0F7] mb-2 font-display">Delete Assessment?</h3>
                            <p className="text-[#8B99B0] text-sm leading-relaxed mb-8">
                                This action cannot be undone. All questions, results, and candidate data associated with <span className="text-rose-400 font-medium">&quot;{displayTitle}&quot;</span> will be permanently removed.
                            </p>
                            <div className="flex flex-col w-full gap-2">
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    Confirm Delete
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                    className="w-full h-12 bg-transparent text-[#8B99B0] hover:text-[#ECF0F7] hover:bg-[#222C4A] font-medium rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
