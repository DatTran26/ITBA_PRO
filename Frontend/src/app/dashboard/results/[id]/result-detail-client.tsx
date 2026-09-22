"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { Textarea } from "@/components/ui/textarea";
import {
    Loader2,
    Sparkles,
    Save,
    Pencil,
    X,
    Trash2,
    Shield,
    AlertTriangle,
    Search,
    Layers,
    StickyNote,
    Copy,
    Check,
    Lightbulb,
    FileDown,
    Plus,
    CheckCircle2,
    MoveRight,
    Filter,
    XCircle,
    AlertCircle,
    Award,
    Calendar,
    User,
    MessageSquare,
} from "lucide-react";
import SkillEvaluationPanel from "@/components/evaluation/skill-evaluation-panel";
import type { SkillRequirementRow, SkillEvaluationRow } from "./evaluation-types";

/* ────────────────────── types ────────────────────── */

interface Question {
    id: string;
    question_text: string;
    options: string[];
    correct_answer: number;
    topic: string;
    explanation: string;
    order_num: number;
    grading_mode?: "auto" | "manual";
}

interface Answer {
    question_id: string;
    selected_answer: number;
    is_correct: boolean;
}

interface Analysis {
    overall_assessment: string;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
    detail_note?: string;
}

interface SuggestedQuestion {
    question: string;
    purpose: string;
}

interface FollowUpQuestion {
    question_text: string;
    purpose: string;
    category: "strength_validation" | "weakness_probe" | "hidden_gap" | "depth_check";
    priority: "high" | "medium" | "low";
    related_topics: string[];
    suggested_follow_up_points: string[];
}

interface FollowUpSession {
    id: string;
    result_id: string;
    test_id: string;
    questions: FollowUpQuestion[];
    created_at: string;
    updated_at: string;
}

interface Result {
    id: string;
    candidate_name: string;
    candidate_email: string;
    score: number;
    total_questions: number;
    time_taken: number;
    submitted_at: string;
    answers: Answer[];
    ai_analysis: Analysis | null;
    suggested_questions: SuggestedQuestion[] | null;
    note: string | null;
    status: "pass" | "fail" | null;
    grading_status?: "graded" | "pending_grading";
}

interface Test {
    id: string;
    title?: string;
    job_role: string;
    level: string;
    questions: Question[];
    target_type?: string;
    position_id?: string | null;
}

/* ────────────────────── constants ────────────────────── */

const CATEGORY_CONFIG = {
    strength_validation: {
        label: "Strength Validation",
        icon: Shield,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/20",
        badgeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
        border: "border-l-emerald-500",
    },
    weakness_probe: {
        label: "Weakness Probe",
        icon: AlertTriangle,
        color: "text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/20",
        badgeBg: "bg-amber-500/15 text-amber-400 border-amber-500/25",
        border: "border-l-amber-500",
    },
    hidden_gap: {
        label: "Hidden Gap",
        icon: Search,
        color: "text-rose-400",
        bg: "bg-rose-500/10 border-rose-500/20",
        badgeBg: "bg-rose-500/15 text-rose-400 border-rose-500/25",
        border: "border-l-rose-500",
    },
    depth_check: {
        label: "Depth Check",
        icon: Layers,
        color: "text-violet-400",
        bg: "bg-violet-500/10 border-violet-500/20",
        badgeBg: "bg-violet-500/15 text-violet-400 border-violet-500/25",
        border: "border-l-violet-500",
    },
};

const PRIORITY_CONFIG = {
    high: "bg-rose-500/15 text-rose-400 border-rose-500/25",
    medium: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    low: "bg-slate-500/15 text-slate-400 border-slate-500/25",
};

export default function ResultDetailClient({
    result,
    test,
    followUpSession: initialSession,
    skillRequirements = [],
    existingEvaluations = [],
    initialAnswerGrades = [],
}: {
    result: Result;
    test: Test;
    followUpSession: FollowUpSession | null;
    skillRequirements?: SkillRequirementRow[];
    existingEvaluations?: SkillEvaluationRow[];
    initialAnswerGrades?: any[];
}) {
    const [score, setScore] = useState(result.score);
    const [gradingStatus, setGradingStatus] = useState(result.grading_status || 'graded');
    const [answerGrades, setAnswerGrades] = useState<any[]>(initialAnswerGrades);
    const [savingGrades, setSavingGrades] = useState<Record<string, boolean>>({});
    const [gradeNotes, setGradeNotes] = useState<Record<string, string>>(() => {
        const notes: Record<string, string> = {};
        initialAnswerGrades.forEach(g => {
            notes[g.question_id] = g.note || "";
        });
        return notes;
    });
    const [gradeValues, setGradeValues] = useState<Record<string, boolean | null>>(() => {
        const vals: Record<string, boolean | null> = {};
        initialAnswerGrades.forEach(g => {
            vals[g.question_id] = g.is_correct;
        });
        return vals;
    });

    const hasManualQuestions = test.questions?.some(q => q.grading_mode === 'manual');
    const percentage = result.total_questions > 0 ? Math.round((score / result.total_questions) * 100) : 0;

    const handleSaveGrade = useCallback(async (questionId: string) => {
        setSavingGrades(prev => ({ ...prev, [questionId]: true }));
        try {
            const currentGrade = gradeValues[questionId];
            const currentNote = gradeNotes[questionId] || "";

            if (currentGrade === null) {
                toast.error("Vui lòng chọn kết quả Đạt hoặc Không đạt.");
                return;
            }

            const res = await fetch(`/api/results/${result.id}/grade`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question_id: questionId,
                    is_correct: currentGrade,
                    note: currentNote
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save grade");

            // Update react states
            setScore(data.score);
            setGradingStatus(data.grading_status);
            setAnswerGrades(prev => {
                const found = prev.some(g => g.question_id === questionId);
                if (found) {
                    return prev.map(g => {
                        if (g.question_id === questionId) {
                            return {
                                ...g,
                                is_correct: currentGrade,
                                note: currentNote,
                                graded_at: new Date().toISOString()
                            };
                        }
                        return g;
                    });
                } else {
                    return [...prev, {
                        question_id: questionId,
                        is_correct: currentGrade,
                        note: currentNote,
                        graded_at: new Date().toISOString()
                    }];
                }
            });

            toast.success("Đã lưu kết quả chấm điểm và cập nhật điểm số.");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Chấm điểm thất bại.");
        } finally {
            setSavingGrades(prev => ({ ...prev, [questionId]: false }));
        }
    }, [result.id, gradeValues, gradeNotes]);

    const scoreColor =
        percentage >= 80 ? "text-emerald-400" : percentage >= 50 ? "text-amber-400" : "text-rose-400";
    const scoreRingColor =
        percentage >= 80 ? "var(--success)" : percentage >= 50 ? "var(--warning)" : "var(--danger)";
    const scoreGradient =
        percentage >= 80
            ? ["var(--success)", "var(--success)"]
            : percentage >= 50
              ? ["var(--warning)", "var(--warning)"]
              : ["var(--danger)", "var(--danger)"];

    const passFail =
        percentage >= 80
            ? { label: "Strong Pass", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" }
            : percentage >= 50
              ? { label: "Pass", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" }
              : { label: "Did Not Pass", cls: "bg-rose-500/15 text-rose-400 border-rose-500/30" };

    const recBadge = (rec: string) => {
        if (["Recommend", "Đề nghị", "Khuyến nghị", "TIỀM NĂNG", "Khuyên dùng", "ĐỀ XUẤT", "KHUYÊN DÙNG"].includes(rec) || (rec.toUpperCase().includes("KHUYẾN NGHỊ") && !rec.toUpperCase().includes("KHÔNG"))) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
        if (["Consider", "Cân nhắc", "CÂN NHẮC"].includes(rec) || rec.toUpperCase().includes("CÂN NHẮC")) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
        return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    };

    const recDot = (rec: string) => {
        if (["Recommend", "Đề nghị", "Khuyến nghị", "TIỀM NĂNG", "Khuyên dùng", "ĐỀ XUẤT", "KHUYÊN DÙNG"].includes(rec) || (rec.toUpperCase().includes("KHUYẾN NGHỊ") && !rec.toUpperCase().includes("KHÔNG"))) return "bg-emerald-400";
        if (["Consider", "Cân nhắc", "CÂN NHẮC"].includes(rec) || rec.toUpperCase().includes("CÂN NHẮC")) return "bg-amber-400";
        return "bg-rose-400";
    };

    const levelBadge =
        test.level === "Junior"
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : test.level === "Mid"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : "bg-rose-500/10 text-rose-400 border-rose-500/20";

    /* ── AI analysis state ── */
    const [aiAnalysis, setAiAnalysis] = useState<Analysis | null>(result.ai_analysis);
    const [isAnalyzing, setIsAnalyzing] = useState(!result.ai_analysis);
    const [isEditingAnalysis, setIsEditingAnalysis] = useState(false);
    const [editedAnalysis, setEditedAnalysis] = useState<Analysis | null>(null);
    const [isSavingAnalysis, setIsSavingAnalysis] = useState(false);

    /* ── Follow-up state ── */
    const [followUpSession, setFollowUpSession] = useState<FollowUpSession | null>(initialSession);
    const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
    const [editingQuestions, setEditingQuestions] = useState<FollowUpQuestion[] | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showFollowUp, setShowFollowUp] = useState(!!initialSession);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [copiedHintIdx, setCopiedHintIdx] = useState<number | null>(null);

    /* ── Note state ── */
    /* ── Note state: bullet-point format ── */
    const parseBullets = (text: string): string[] => {
        const lines = text.split("\n").map((l) => l.replace(/^[\s•\-]+/, "").trim()).filter(Boolean);
        return lines.length > 0 ? lines : [""];
    };
    const serializeBullets = (bullets: string[]): string =>
        bullets.filter((b) => b.trim()).map((b) => `• ${b}`).join("\n");

    const [noteBullets, setNoteBullets] = useState<string[]>(() => parseBullets(result.note || ""));
    const [lastSavedNote, setLastSavedNote] = useState(result.note || "");
    const [isSavingNote, setIsSavingNote] = useState(false);

    /* ── Candidate status state ── */
    const [candidateStatus, setCandidateStatus] = useState<"pass" | "fail" | null>(result.status);
    const [isSavingStatus, setIsSavingStatus] = useState(false);
    const noteText = serializeBullets(noteBullets);
    const noteHasChanges = noteText !== lastSavedNote;

    const handleBulletChange = useCallback((idx: number, value: string) => {
        setNoteBullets((prev) => prev.map((b, i) => (i === idx ? value : b)));
    }, []);

    const handleBulletKeyDown = useCallback((idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            setNoteBullets((prev) => [...prev.slice(0, idx + 1), "", ...prev.slice(idx + 1)]);
            setTimeout(() => {
                const next = document.querySelector<HTMLInputElement>(`[data-bullet="${idx + 1}"]`);
                next?.focus();
            }, 0);
        } else if (e.key === "Backspace" && noteBullets[idx] === "" && noteBullets.length > 1) {
            e.preventDefault();
            setNoteBullets((prev) => prev.filter((_, i) => i !== idx));
            setTimeout(() => {
                const prev = document.querySelector<HTMLInputElement>(`[data-bullet="${Math.max(0, idx - 1)}"]`);
                prev?.focus();
            }, 0);
        }
    }, [noteBullets]);

    const handleSaveNote = useCallback(async () => {
        setIsSavingNote(true);
        try {
            const res = await fetch(`/api/results/${result.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ note: noteText }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setLastSavedNote(noteText);
            toast.success("Note saved");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save note");
        } finally {
            setIsSavingNote(false);
        }
    }, [result.id, noteText]);

    const handleSetStatus = useCallback(async (newStatus: "pass" | "fail") => {
        setIsSavingStatus(true);
        try {
            const res = await fetch(`/api/results/${result.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setCandidateStatus(newStatus);
            toast.success(`Candidate marked as ${newStatus === "pass" ? "Pass" : "Fail"}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update status");
        } finally {
            setIsSavingStatus(false);
        }
    }, [result.id]);

    /* ── PDF export (dynamic import to avoid chunk loading issues) ── */
    const [isExporting, setIsExporting] = useState(false);
    const handleExportPdf = useCallback(async () => {
        setIsExporting(true);
        try {
            const { generateResultPdf } = await import("@/lib/generate-result-pdf");
            await generateResultPdf(
                { ...result, ai_analysis: aiAnalysis, status: candidateStatus, note: serializeBullets(noteBullets) },
                test
            );
            toast.success("PDF downloaded");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "PDF export failed");
        } finally {
            setIsExporting(false);
        }
    }, [result, aiAnalysis, candidateStatus, noteBullets, test]);

    /* ── AI analysis edit handlers ── */
    const handleStartEditAnalysis = useCallback(() => {
        if (aiAnalysis) {
            setEditedAnalysis(JSON.parse(JSON.stringify(aiAnalysis)));
            setIsEditingAnalysis(true);
        }
    }, [aiAnalysis]);

    const handleCancelEditAnalysis = useCallback(() => {
        setIsEditingAnalysis(false);
        setEditedAnalysis(null);
    }, []);

    const handleSaveAnalysis = useCallback(async () => {
        if (!editedAnalysis) return;
        setIsSavingAnalysis(true);
        try {
            const res = await fetch(`/api/results/${result.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ai_analysis: editedAnalysis }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setAiAnalysis(editedAnalysis);
            setIsEditingAnalysis(false);
            setEditedAnalysis(null);
            toast.success("AI summary updated");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setIsSavingAnalysis(false);
        }
    }, [result.id, editedAnalysis]);

    const handleEditAnalysisField = useCallback((field: keyof Analysis, value: string | string[]) => {
        setEditedAnalysis((prev) => prev ? { ...prev, [field]: value } : prev);
    }, []);

    const handleEditListItem = useCallback((field: "strengths" | "weaknesses", idx: number, value: string) => {
        setEditedAnalysis((prev) => {
            if (!prev) return prev;
            const list = [...prev[field]];
            list[idx] = value;
            return { ...prev, [field]: list };
        });
    }, []);

    const handleAddListItem = useCallback((field: "strengths" | "weaknesses") => {
        setEditedAnalysis((prev) => {
            if (!prev) return prev;
            return { ...prev, [field]: [...prev[field], ""] };
        });
    }, []);

    const handleRemoveListItem = useCallback((field: "strengths" | "weaknesses", idx: number) => {
        setEditedAnalysis((prev) => {
            if (!prev) return prev;
            return { ...prev, [field]: prev[field].filter((_, i) => i !== idx) };
        });
    }, []);

    /* ── Follow-up filter ── */
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    /* ── Tab state ── */
    const [activeTab, setActiveTab] = useState<"breakdown" | "followup">(
        initialSession ? "followup" : "breakdown"
    );

    useEffect(() => {
        if (!result.ai_analysis && isAnalyzing) {
            fetch("/api/ai/analyze-result", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ result_id: result.id }),
            })
                .then((r) => r.json())
                .then((data) => data.ai_analysis && setAiAnalysis(data.ai_analysis))
                .catch((err) => console.error("Analysis error:", err))
                .finally(() => setIsAnalyzing(false));
        }
    }, [result.id, result.ai_analysis, isAnalyzing]);

    /* ── Follow-up handlers ── */

    const handleGenerateFollowUp = useCallback(async () => {
        setIsGeneratingFollowUp(true);
        try {
            const res = await fetch("/api/ai/generate-followup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ result_id: result.id, ai_analysis: aiAnalysis }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setFollowUpSession(data.session);
            setShowFollowUp(true);
            setActiveTab("followup");
            toast.success("Follow-up questions generated");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Generation failed");
        } finally {
            setIsGeneratingFollowUp(false);
        }
    }, [result.id, aiAnalysis]);

    const handleStartEdit = useCallback(() => {
        if (followUpSession) setEditingQuestions(JSON.parse(JSON.stringify(followUpSession.questions)));
    }, [followUpSession]);

    const handleCancelEdit = useCallback(() => setEditingQuestions(null), []);

    const handleSaveEdit = useCallback(async () => {
        if (!followUpSession || !editingQuestions) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/followup-sessions/${followUpSession.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questions: editingQuestions }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setFollowUpSession(data.session);
            setEditingQuestions(null);
            toast.success("Saved");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Save failed");
        } finally {
            setIsSaving(false);
        }
    }, [followUpSession, editingQuestions]);

    const handleDeleteQuestion = useCallback(
        (idx: number) => {
            if (!editingQuestions) return;
            setEditingQuestions(editingQuestions.filter((_, i) => i !== idx));
        },
        [editingQuestions]
    );

    const handleEditField = useCallback(
        (idx: number, field: keyof FollowUpQuestion, value: string) => {
            if (!editingQuestions) return;
            const updated = [...editingQuestions];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (updated[idx] as any)[field] = value;
            setEditingQuestions(updated);
        },
        [editingQuestions]
    );

    const handleDeleteSession = useCallback(async () => {
        if (!followUpSession) return;
        try {
            await fetch(`/api/followup-sessions/${followUpSession.id}`, { method: "DELETE" });
            setFollowUpSession(null);
            setEditingQuestions(null);
            setShowFollowUp(false);
            setActiveTab("breakdown");
            toast.success("Session deleted");
        } catch {
            toast.error("Delete failed");
        }
    }, [followUpSession]);

    const handleCopyQuestion = useCallback((text: string, idx: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIdx(idx);
            setTimeout(() => setCopiedIdx(null), 2000);
        });
    }, []);

    const handleCopyHint = useCallback((text: string, idx: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedHintIdx(idx);
            setTimeout(() => setCopiedHintIdx(null), 2000);
        });
    }, []);

    const displayQuestions = editingQuestions || followUpSession?.questions || [];

    /* ────────────────────── render ────────────────────── */

    return (
        <div className="min-h-screen bg-background text-foreground">
            <AppNavbar />

            <PageContainer>
                <PageBreadcrumb breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: test.title || test.job_role, href: `/dashboard/tests/${test.id}` },
                    { label: result.candidate_name },
                ]} />
                {/* ═══════ SECTION 1: Candidate Header + Score ═══════ */}
                <div className="mb-8">
                    <Card className="border-border/20 bg-muted/40 backdrop-blur-xl overflow-hidden rounded-3xl shadow-2xl relative">
                        {/* Background Mesh Decor */}
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />

                        <CardContent className="p-0">
                            <div className="flex flex-col sm:flex-row items-stretch">
                                {/* Score block */}
                                <div className="flex flex-col items-center justify-center gap-4 px-10 py-8 border-b sm:border-b-0 sm:border-r border-border shrink-0 bg-white/[0.02] relative z-10">
                                    <div className="relative w-28 h-28">
                                        <svg className="w-28 h-28 -rotate-90 drop-shadow-[0_0_15px_color-mix(in_srgb,var(--primary)_10%,transparent)]" viewBox="0 0 96 96">
                                            <circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-foreground/[0.03]" />
                                            <circle
                                                cx="48" cy="48" r="42" fill="none"
                                                stroke="url(#scoreGradTop)" strokeWidth="7"
                                                strokeDasharray={`${(percentage / 100) * 263.8} 263.8`}
                                                strokeLinecap="round"
                                                className="transition-all duration-1000 ease-out"
                                            />
                                            <defs>
                                                <linearGradient id="scoreGradTop" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor={scoreGradient[0]} />
                                                    <stop offset="100%" stopColor={scoreGradient[1]} />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={`text-4xl font-extralight tracking-tighter leading-none ${scoreColor}`}>{percentage}%</span>
                                            <span className="text-[10px] text-muted-foreground mt-1 font-mono">{score}/{result.total_questions}</span>
                                        </div>
                                    </div>
                                    <Badge className={`border text-[10px] uppercase tracking-widest px-4 py-1 rounded-full font-semibold shadow-sm ${passFail.cls}`}>
                                        {passFail.label}
                                    </Badge>
                                </div>

                                {/* Candidate info + recommendation */}
                                <div className="flex-1 px-8 py-8 flex flex-col justify-between gap-6 relative z-10">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                                        {/* Name + meta */}
                                        <div className="space-y-1">
                                            <h1 className="text-3xl font-extralight font-display text-foreground tracking-tight leading-tight">{result.candidate_name}</h1>
                                            <p className="text-muted-foreground font-light text-base">{result.candidate_email}</p>
                                            <div className="flex flex-wrap items-center gap-3 mt-4">
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border text-[11px] text-muted-foreground font-light">
                                                    {new Date(result.submitted_at).toLocaleString("vi-VN")}
                                                </div>
                                                {result.time_taken ? (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border text-[11px] text-muted-foreground font-light">
                                                        · {Math.round(result.time_taken / 60)} min
                                                    </div>
                                                ) : null}
                                                <Badge className={`border border-border bg-muted text-foreground text-[11px] font-medium px-3 py-1 rounded-lg ${levelBadge}`}>
                                                    {test.title ? `${test.title} · ${test.level}` : `${test.job_role} · ${test.level}`}
                                                </Badge>
                                                {hasManualQuestions && (
                                                    <Badge className={`border text-[11px] font-medium px-3 py-1 rounded-lg ${
                                                        gradingStatus === 'pending_grading'
                                                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                                                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                    }`}>
                                                        {gradingStatus === 'pending_grading' ? "Cần chấm điểm" : "Đã chấm điểm"}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Export PDF + Interviewer Decision */}
                                        <div className="flex items-center gap-3 shrink-0">
                                            <button
                                                onClick={handleExportPdf}
                                                disabled={isExporting}
                                                title="Export PDF Report"
                                                className="w-11 h-11 flex items-center justify-center rounded-xl border bg-muted border-border text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-border/40 transition-all cursor-pointer shadow-lg"
                                            >
                                                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                                            </button>
                                            <div className="flex items-center bg-background/60 p-1 rounded-2xl border border-border shadow-inner backdrop-blur-sm">
                                                <button
                                                    onClick={() => handleSetStatus("pass")}
                                                    disabled={isSavingStatus}
                                                    className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${candidateStatus === "pass" ? "bg-emerald-500 text-foreground shadow-[0_0_20px_color-mix(in_srgb,var(--success)_40%,transparent)]" : "text-muted-foreground hover:text-emerald-400"}`}
                                                >
                                                    {isSavingStatus && candidateStatus !== "pass" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pass"}
                                                </button>
                                                <button
                                                    onClick={() => handleSetStatus("fail")}
                                                    disabled={isSavingStatus}
                                                    className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${candidateStatus === "fail" ? "bg-rose-500 text-foreground shadow-[0_0_20px_color-mix(in_srgb,var(--danger)_40%,transparent)]" : "text-muted-foreground hover:text-rose-400"}`}
                                                >
                                                    {isSavingStatus && candidateStatus !== "fail" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fail"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* AI Recommendation — BIG */}
                                        {isAnalyzing ? (
                                            <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-muted border border-border shrink-0 backdrop-blur-md">
                                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">Status</p>
                                                    <p className="text-sm font-medium text-muted-foreground">Synthesizing Insight…</p>
                                                </div>
                                            </div>
                                        ) : aiAnalysis?.recommendation ? (
                                            <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border shrink-0 backdrop-blur-xl shadow-lg relative overflow-hidden group ${recBadge(aiAnalysis.recommendation)}`}>
                                                <div className={`absolute top-0 left-0 w-1 h-full ${recDot(aiAnalysis.recommendation)} opacity-60`} />
                                                <div className={`w-3 h-3 rounded-full flex-shrink-0 animate-pulse ${recDot(aiAnalysis.recommendation)}`} />
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1 font-semibold">AI Prediction</p>
                                                    <p className="text-xl font-bold tracking-tight">{aiAnalysis.recommendation}</p>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ═══════ SECTION 2: AI Assessment Panel ═══════ */}
                {(isAnalyzing || aiAnalysis) && (
                    <div className="mb-10">
                        <Card className="border-border/10 bg-muted/40 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">
                            <CardHeader className="pb-4 pt-6 px-8 border-b border-border">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_15px_color-mix(in_srgb,var(--primary)_10%,transparent)]">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-medium text-foreground tracking-wide">
                                            Intelligent Assessment
                                        </CardTitle>
                                        <p className="text-[11px] text-muted-foreground font-light">Deep analysis of candidate cognitive performance</p>
                                    </div>
                                    {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin text-primary ml-auto" />}
                                    {!isAnalyzing && aiAnalysis && !isEditingAnalysis && (
                                        <button onClick={handleStartEditAnalysis} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-primary bg-primary/5 border border-border/10 hover:bg-primary/10 transition-all">
                                            <Pencil className="w-3.5 h-3.5" /> Edit Analysis
                                        </button>
                                    )}
                                    {isEditingAnalysis && (
                                        <div className="ml-auto flex items-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={handleCancelEditAnalysis} className="text-muted-foreground hover:text-foreground h-9 px-4 rounded-xl">
                                                <X className="w-4 h-4 mr-2" /> Cancel
                                            </Button>
                                            <Button size="sm" onClick={handleSaveAnalysis} disabled={isSavingAnalysis} className="bg-gradient-to-r from-indigo-500 to-primary hover:from-indigo-600 hover:to-primary text-white h-9 px-5 rounded-xl shadow-lg shadow-indigo-500/20">
                                                {isSavingAnalysis ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Insights
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="px-8 py-8 space-y-8">
                                {isAnalyzing ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <div className="w-12 h-12 rounded-full border-2 border-border/20 border-t-border animate-spin" />
                                        <p className="text-sm text-muted-foreground animate-pulse">Decompressing test vectors and generating cognitive summary…</p>
                                    </div>
                                ) : isEditingAnalysis && editedAnalysis ? (
                                    <div className="space-y-8">
                                        {/* Editable overall assessment */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-2">
                                                <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                                Synthesis Report
                                            </label>
                                            <Textarea
                                                value={editedAnalysis.overall_assessment || ""}
                                                onChange={(e) => handleEditAnalysisField("overall_assessment", e.target.value)}
                                                className="bg-background/60 border-border text-base text-foreground min-h-[140px] focus:border-border/40 rounded-2xl resize-none leading-relaxed transition-all p-5 shadow-inner"
                                            />
                                        </div>

                                        {/* Editable strengths + weaknesses */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            {/* Strengths editor */}
                                            <div className="rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10 p-5">
                                                <p className="text-[11px] text-emerald-400/80 uppercase tracking-widest font-semibold mb-4 flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    Strengths
                                                </p>
                                                <div className="space-y-2">
                                                    {editedAnalysis.strengths.map((s, i) => (
                                                        <div key={i} className="flex items-center gap-2 group">
                                                            <input
                                                                value={s}
                                                                onChange={(e) => handleEditListItem("strengths", i, e.target.value)}
                                                                className="flex-1 bg-background/40 border border-border rounded-xl px-3 py-2 text-sm text-emerald-300/80 focus:outline-none focus:border-emerald-500/40 transition-all"
                                                            />
                                                            <button onClick={() => handleRemoveListItem("strengths", i)} className="text-muted-foreground hover:text-rose-400 p-1 transition-colors">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => handleAddListItem("strengths")} className="text-[11px] text-emerald-500/60 hover:text-emerald-400 flex items-center gap-1 mt-2 ml-1 transition-colors">+ Add Strength</button>
                                                </div>
                                            </div>

                                            {/* Weaknesses editor */}
                                            <div className="rounded-2xl bg-rose-500/[0.03] border border-rose-500/10 p-5">
                                                <p className="text-[11px] text-rose-400/80 uppercase tracking-widest font-semibold mb-4 flex items-center gap-1.5">
                                                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                                                    Areas for Improvement
                                                </p>
                                                <div className="space-y-2">
                                                    {editedAnalysis.weaknesses.map((w, i) => (
                                                        <div key={i} className="flex items-center gap-2 group">
                                                            <input
                                                                value={w}
                                                                onChange={(e) => handleEditListItem("weaknesses", i, e.target.value)}
                                                                className="flex-1 bg-background/40 border border-border rounded-xl px-3 py-2 text-sm text-rose-300/80 focus:outline-none focus:border-rose-500/40 transition-all"
                                                            />
                                                            <button onClick={() => handleRemoveListItem("weaknesses", i)} className="text-muted-foreground hover:text-rose-400 p-1 transition-colors">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => handleAddListItem("weaknesses")} className="text-[11px] text-rose-500/60 hover:text-rose-400 flex items-center gap-1 mt-2 ml-1 transition-colors">+ Add Area</button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Editable recommendation */}
                                        <div className="pt-4 border-t border-border">
                                            <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-4 block">Candidate Verdict</label>
                                            <div className="flex flex-wrap gap-3">
                                                {(["Recommend", "Consider", "Not Recommend"] as const).map((rec) => (
                                                    <button
                                                        key={rec}
                                                        onClick={() => handleEditAnalysisField("recommendation", rec)}
                                                        className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${editedAnalysis.recommendation === rec
                                                            ? rec === "Recommend" ? "bg-emerald-500 text-foreground shadow-lg shadow-emerald-500/20" : rec === "Consider" ? "bg-amber-500 text-foreground shadow-lg shadow-amber-500/20" : "bg-rose-500 text-foreground shadow-lg shadow-rose-500/20"
                                                            : "bg-muted text-muted-foreground hover:bg-muted border border-border"
                                                        }`}
                                                    >
                                                        {rec}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : aiAnalysis ? (
                                    <div className="space-y-10">
                                        {/* Overall assessment */}
                                        {aiAnalysis.overall_assessment && (
                                            <div className="relative pl-8">
                                                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/30 rounded-full" />
                                                <p className="text-lg text-foreground leading-relaxed font-light">
                                                    {aiAnalysis.overall_assessment}
                                                </p>
                                            </div>
                                        )}

                                        {/* Strengths + Weaknesses side by side */}
                                        {(aiAnalysis.strengths?.length > 0 || aiAnalysis.weaknesses?.length > 0) && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                                {aiAnalysis.strengths?.length > 0 && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </div>
                                                            <h4 className="text-[10px] text-emerald-400/80 uppercase tracking-widest font-bold">Key Strengths</h4>
                                                        </div>
                                                        <ul className="space-y-3">
                                                            {aiAnalysis.strengths.map((s, i) => (
                                                                <li key={i} className="text-muted-foreground text-sm flex items-start gap-3 group">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 mt-1.5 shrink-0 group-hover:scale-125 transition-transform" />
                                                                    {s}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {aiAnalysis.weaknesses?.length > 0 && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                                                                <AlertTriangle className="w-4 h-4" />
                                                            </div>
                                                            <h4 className="text-[10px] text-rose-400/80 uppercase tracking-widest font-bold">Improvement Areas</h4>
                                                        </div>
                                                        <ul className="space-y-3">
                                                            {aiAnalysis.weaknesses.map((w, i) => (
                                                                <li key={i} className="text-muted-foreground text-sm flex items-start gap-3 group">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500/40 mt-1.5 shrink-0 group-hover:scale-125 transition-transform" />
                                                                    {w}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ═══════ Generate Follow-up ═══════ */}
                {aiAnalysis && !isAnalyzing && (
                    <div className="flex justify-center mb-16 -translate-y-6">
                        <Button
                            onClick={
                                followUpSession && !showFollowUp
                                    ? () => { setShowFollowUp(true); setActiveTab("followup"); }
                                    : handleGenerateFollowUp
                            }
                            disabled={isGeneratingFollowUp}
                            className="bg-white text-black hover:bg-foreground rounded-full h-16 px-12 text-base font-bold shadow-[0_15px_45px_-10px_rgba(255,255,255,0.25)] hover:shadow-[0_20px_55px_-5px_rgba(255,255,255,0.4)] transition-all duration-500 gap-3 group border-0"
                        >
                            {isGeneratingFollowUp ? (
                                <><Loader2 className="w-6 h-6 animate-spin" /> Synthesizing Question Vectors…</>
                            ) : followUpSession ? (
                                <><Sparkles className="w-6 h-6 text-amber-500 group-hover:rotate-12 transition-transform" /> {showFollowUp ? "Regenerate Analysis Questions" : "Explore Follow-up Insight"}</>
                            ) : (
                                <><Sparkles className="w-6 h-6 text-amber-500 group-hover:rotate-12 transition-transform" /> Generate Follow-up Questions</>
                            )}
                        </Button>
                    </div>
                )}

                {/* ═══════ SECTION 3: Quick Interview Hints ═══════ */}
                {result.suggested_questions && result.suggested_questions.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-6 pl-2">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Lightbulb className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-base font-medium text-white tracking-wide">Cognitive Interview Hints</h3>
                                <p className="text-[11px] text-muted-foreground font-light">Suggested questions to explore depth of knowledge</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {result.suggested_questions.map((sq, i) => (
                                <div key={i} className="group relative rounded-2xl border border-border bg-muted/20 hover:bg-muted/40 hover:border-border/20 backdrop-blur-md transition-all duration-300 overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex items-start gap-4 mb-4">
                                            <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 border border-border/10">{i + 1}</span>
                                            <p className="text-base font-light text-foreground leading-relaxed italic">&ldquo;{sq.question}&rdquo;</p>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 pl-10">
                                            <p className="text-xs text-muted-foreground leading-relaxed flex-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] uppercase tracking-widest text-primary/60 font-semibold block mb-1">Target Dimension</span>
                                                {sq.purpose}
                                            </p>
                                            <button
                                                onClick={() => handleCopyHint(sq.question, i)}
                                                className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-white hover:bg-primary/20 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                            >
                                                {copiedHintIdx === i ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══════ SECTION 4: Interviewer Note ═══════ */}
                <div className="mb-12">
                    <Card className="border-border bg-muted/20 backdrop-blur-xl rounded-3xl overflow-hidden group">
                        <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <StickyNote className="w-5 h-5 text-amber-400" />
                                <span className="text-sm font-semibold text-foreground tracking-widest uppercase">Executive Summary Notes</span>
                            </div>
                            <Badge className={`text-[10px] px-3 py-1 rounded-lg ${noteHasChanges ? "bg-amber-500/20 text-amber-400 border-amber-500/20" : lastSavedNote ? "bg-emerald-500/10 text-emerald-400/60 border-emerald-500/10" : "bg-muted text-muted-foreground border-border"}`}>
                                {!noteHasChanges && lastSavedNote ? "All Changes Synchronized" : noteHasChanges ? "Local Changes Unsaved" : "Internal Workspace Only"}
                            </Badge>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-4 rounded-2xl p-6 bg-background/60 border border-border focus-within:border-border/30 transition-all shadow-inner">
                                {noteBullets.map((bullet, idx) => (
                                    <div key={idx} className="flex items-center gap-4 group/item">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0 mt-0.5 group-focus-within/item:bg-primary" />
                                        <input
                                            data-bullet={idx}
                                            type="text"
                                            value={bullet}
                                            onChange={(e) => handleBulletChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleBulletKeyDown(idx, e)}
                                            placeholder={idx === 0 ? "Synthesize your observations here…" : "Add more insight…"}
                                            className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none border-none py-1 transition-all font-light"
                                        />
                                    </div>
                                ))}
                                <button
                                    onClick={() => setNoteBullets((prev) => [...prev, ""])}
                                    className="text-xs text-primary/50 hover:text-primary transition-all ml-5.5 flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-border/5 hover:border-border/20"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Append Observation
                                </button>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSaveNote}
                                    disabled={isSavingNote || !noteHasChanges}
                                    className="bg-primary hover:bg-primary text-white h-11 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all font-semibold gap-2"
                                >
                                    {isSavingNote ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Persisting…</>
                                    ) : (
                                        <><Save className="w-4 h-4" /> Finalize Notes</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ═══════ SECTION 5: Tabbed content ═══════ */}
                <div className="mb-12">
                    {/* Tab bar — Slate Pro Max Pill Style */}
                    <div className="flex items-center justify-center p-1.5 bg-muted/60 border border-border rounded-2xl w-fit mx-auto mb-10 backdrop-blur-md shadow-inner">
                        <button
                            onClick={() => setActiveTab("breakdown")}
                            className={`px-8 py-3 text-sm font-medium transition-all duration-300 rounded-xl relative ${
                                activeTab === "breakdown" ? "bg-white text-black shadow-lg" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Question Breakdown
                            <span className={`ml-2 text-xs font-mono tabular-nums ${activeTab === "breakdown" ? "text-black/50" : "text-muted-foreground"}`}>
                                {test.questions?.length || 0}
                            </span>
                        </button>
                        {showFollowUp && followUpSession && (
                            <button
                                onClick={() => setActiveTab("followup")}
                                className={`px-8 py-3 text-sm font-medium transition-all duration-300 rounded-xl relative flex items-center gap-2 ${
                                    activeTab === "followup" ? "bg-amber-500 text-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <Sparkles className={`w-4 h-4 ${activeTab === "followup" ? "text-foreground" : "text-amber-500"}`} />
                                Follow-up Insight
                                <span className={`ml-1 text-xs font-mono tabular-nums ${activeTab === "followup" ? "text-muted-foreground" : "text-muted-foreground"}`}>
                                    {displayQuestions.length}
                                </span>
                            </button>
                        )}
                    </div>

                    {/* ──── TAB: Question Breakdown ──── */}
                    {activeTab === "breakdown" && (
                        <div className="space-y-2.5">
                            {test.questions?.map((q, idx) => {
                                const answer = result.answers?.find((a) => a.question_id === q.id) || result.answers?.[idx];
                                const isManual = q.grading_mode === "manual";
                                const grade = answerGrades.find((g) => g.question_id === q.id);
                                const isCorrect = isManual ? (grade?.is_correct ?? null) : (answer?.is_correct ?? false);
                                const selectedAnswer = answer?.selected_answer ?? -1;

                                const cardBorderClass = isCorrect === true
                                    ? "border-l-emerald-500"
                                    : isCorrect === false
                                      ? "border-l-rose-500"
                                      : "border-l-amber-500/60";

                                const iconClass = isCorrect === true
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                                    : isCorrect === false
                                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/20"
                                      : "bg-amber-500/20 text-amber-400 border border-amber-500/20 animate-pulse";

                                const IconComponent = isCorrect === true
                                    ? Check
                                    : isCorrect === false
                                      ? X
                                      : AlertCircle;

                                const responseText = grade?.response_text || "";
                                const currentGrade = gradeValues[q.id] !== undefined ? gradeValues[q.id] : null;
                                const currentNote = gradeNotes[q.id] || "";
                                const isSavingThis = !!savingGrades[q.id];
                                const MAX_NOTE_LENGTH = 1000;

                                return (
                                    <Card
                                        key={q.id}
                                        className={`border-l-4 ${cardBorderClass} border-border bg-muted/30 backdrop-blur-sm rounded-2xl overflow-hidden transition-all hover:bg-muted/50`}
                                    >
                                        <CardHeader className="pb-3 px-6 pt-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${iconClass}`}>
                                                        <IconComponent className="w-4 h-4" />
                                                    </div>
                                                    <Badge variant="outline" className="bg-background border-border text-muted-foreground px-3 py-1 font-mono text-[10px] tracking-wider uppercase">{q.topic}</Badge>
                                                    {isManual && (
                                                        <Badge className="bg-primary/10 text-primary border border-border/20 text-[10px] uppercase font-semibold">Tự luận / Subjective</Badge>
                                                    )}
                                                </div>
                                                <span className="text-[11px] font-mono text-muted-foreground">Vector Q{idx + 1}</span>
                                            </div>
                                            <div className="text-base text-muted-foreground leading-relaxed font-light [&>p]:mb-3 [&>pre]:bg-background [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:border [&>pre]:border-border [&>pre]:overflow-x-auto [&_code]:text-primary [&_code]:bg-primary/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.question_text}</ReactMarkdown>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="px-6 pb-6">
                                            {isManual ? (
                                                <div className="space-y-6 mt-4">
                                                    {/* Candidate Response block */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs uppercase tracking-widest text-primary/80 font-semibold flex items-center gap-2">
                                                                <StickyNote className="w-4 h-4 text-primary" />
                                                                Candidate Response
                                                            </span>
                                                            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded-md border border-border">
                                                                {responseText.length} characters
                                                            </span>
                                                        </div>

                                                        <div className="bg-background/80 border border-border/15 rounded-2xl p-6 shadow-inner relative overflow-hidden group/resp">
                                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/30 rounded-full" />
                                                            <div className="font-mono text-sm leading-relaxed text-foreground whitespace-pre-wrap selection:bg-primary/30">
                                                                {responseText || <span className="text-muted-foreground italic">No response submitted.</span>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Evaluation Panel */}
                                                    <div className="bg-white/[0.02] border border-border rounded-2xl p-6 space-y-6 relative overflow-hidden">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                            <div className="space-y-1">
                                                                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                                    <Award className="w-4 h-4 text-amber-400" />
                                                                    Manual Evaluation & Score Override
                                                                </h4>
                                                                <p className="text-xs text-muted-foreground font-light">Subjective grading must be evaluated by an interviewer</p>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                {currentGrade === true ? (
                                                                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-3.5 py-1.5 rounded-xl font-medium tracking-wide flex items-center gap-1.5 shadow-[0_0_15px_color-mix(in_srgb,var(--success)_10%,transparent)]">
                                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                                        ĐẠT (PASS)
                                                                    </Badge>
                                                                ) : currentGrade === false ? (
                                                                    <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/25 px-3.5 py-1.5 rounded-xl font-medium tracking-wide flex items-center gap-1.5 shadow-[0_0_15px_color-mix(in_srgb,var(--danger)_10%,transparent)]">
                                                                        <XCircle className="w-3.5 h-3.5" />
                                                                        KHÔNG ĐẠT (FAIL)
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/25 px-3.5 py-1.5 rounded-xl font-medium tracking-wide flex items-center gap-1.5 animate-pulse">
                                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                                        CHƯA CHẤM (PENDING)
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-4 border-t border-border">
                                                            {/* Select Grade buttons */}
                                                            <div className="md:col-span-4 space-y-3">
                                                                <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold block">Select Grade</label>
                                                                <div className="flex flex-col gap-2.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setGradeValues(prev => ({ ...prev, [q.id]: true }))}
                                                                        className={`flex items-center justify-between px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 border cursor-pointer ${
                                                                            currentGrade === true
                                                                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_20px_color-mix(in_srgb,var(--success)_15%,transparent)]"
                                                                                : "bg-white/[0.01] text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                                                                        }`}
                                                                    >
                                                                        <span className="flex items-center gap-2">
                                                                            <CheckCircle2 className={`w-4 h-4 ${currentGrade === true ? "text-emerald-400" : "text-muted-foreground"}`} />
                                                                            Đạt (Pass)
                                                                        </span>
                                                                        <span className="text-[10px] font-mono opacity-50">+1 Điểm</span>
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setGradeValues(prev => ({ ...prev, [q.id]: false }))}
                                                                        className={`flex items-center justify-between px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 border cursor-pointer ${
                                                                            currentGrade === false
                                                                                ? "bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-[0_0_20px_color-mix(in_srgb,var(--danger)_15%,transparent)]"
                                                                                : "bg-white/[0.01] text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                                                                        }`}
                                                                    >
                                                                        <span className="flex items-center gap-2">
                                                                            <XCircle className={`w-4 h-4 ${currentGrade === false ? "text-rose-400" : "text-muted-foreground"}`} />
                                                                            Không đạt (Fail)
                                                                        </span>
                                                                        <span className="text-[10px] font-mono opacity-50">+0 Điểm</span>
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Feedback input */}
                                                            <div className="md:col-span-8 space-y-4">
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
                                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                                            Evaluator Feedback / Rubric Notes
                                                                        </label>
                                                                        <span className="text-[10px] font-mono text-muted-foreground">
                                                                            {currentNote.length}/{MAX_NOTE_LENGTH}
                                                                        </span>
                                                                    </div>
                                                                    <Textarea
                                                                        value={currentNote}
                                                                        onChange={(e) => setGradeNotes(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                                        placeholder="Provide details on code structure, algorithmic correctness, efficiency, design pattern compliance, or reasoning explanation..."
                                                                        className="w-full bg-background/60 border-border rounded-xl p-4 text-sm text-foreground font-light focus:border-border/30 transition-all min-h-[96px] resize-none leading-relaxed shadow-inner"
                                                                    />
                                                                </div>

                                                                <div className="flex items-center justify-between gap-4 pt-2">
                                                                    <div className="text-[11px] text-muted-foreground font-light flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                                                        {grade?.graded_at ? (
                                                                            <>
                                                                                <span className="flex items-center gap-1">
                                                                                    <Calendar className="w-3 h-3" />
                                                                                    Chấm ngày: {new Date(grade.graded_at).toLocaleString("vi-VN")}
                                                                                </span>
                                                                            </>
                                                                        ) : (
                                                                            <span className="flex items-center gap-1 text-amber-500/60 font-medium">
                                                                                <AlertCircle className="w-3 h-3" />
                                                                                Chờ đánh giá chính thức
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <Button
                                                                        onClick={() => handleSaveGrade(q.id)}
                                                                        disabled={isSavingThis || currentGrade === null || (currentGrade === grade?.is_correct && currentNote === (grade?.note || ""))}
                                                                        className="bg-primary hover:bg-primary text-white h-10 px-6 rounded-xl shadow-md shadow-primary/10 transition-all font-semibold gap-2 border-none shrink-0"
                                                                    >
                                                                        {isSavingThis ? (
                                                                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Lưu điểm...</>
                                                                        ) : (
                                                                            <><Save className="w-3.5 h-3.5" /> Xác nhận điểm</>
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {q.options?.map((opt, oIdx) => (
                                                            <div
                                                                key={oIdx}
                                                                className={`text-sm px-4 py-3 rounded-xl flex items-start gap-4 transition-all duration-300 ${
                                                                    oIdx === q.correct_answer
                                                                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_color-mix(in_srgb,var(--success)_10%,transparent)]"
                                                                        : oIdx === selectedAnswer && !isCorrect
                                                                          ? "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                                                                          : "text-muted-foreground bg-background/40 border border-border"
                                                                }`}
                                                            >
                                                                <span className={`text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-minus-0.5 ${oIdx === q.correct_answer ? "bg-emerald-500 text-foreground" : oIdx === selectedAnswer ? "bg-rose-500 text-foreground" : "bg-muted"}`}>
                                                                    {String.fromCharCode(65 + oIdx)}
                                                                </span>
                                                                <span className="leading-relaxed flex-1">{opt}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {q.explanation && (
                                                        <div className="mt-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex gap-3">
                                                            <div className="shrink-0 w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                                <Search className="w-3.5 h-3.5" />
                                                            </div>
                                                            <p className="text-[12px] text-muted-foreground italic leading-relaxed">{q.explanation}</p>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* ──── TAB: Follow-up Questions ──── */}
                    {activeTab === "followup" && showFollowUp && followUpSession && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Premium Header/Toolbar */}
                            <div className="p-8 rounded-3xl bg-muted/60 border border-border backdrop-blur-xl relative overflow-hidden group shadow-2xl">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover:bg-primary/10 transition-colors duration-1000" />
                                <div className="relative z-10">
                                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-[0_0_20px_color-mix(in_srgb,var(--warning)_15%,transparent)]">
                                                    <Sparkles className="w-5 h-5" />
                                                </div>
                                                <h2 className="text-2xl font-extralight tracking-tight text-foreground font-display">Deep Vector Analysis</h2>
                                            </div>
                                            <p className="text-muted-foreground text-sm font-light max-w-2xl leading-relaxed">
                                                Our AI engine synthesized {displayQuestions.length} precision-targeted cognitive vectors based on candidates patterns.
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4">
                                            {/* Advanced Category Filter */}
                                            <div className="flex items-center gap-2 p-1.5 bg-background/80 rounded-2xl border border-border shadow-inner backdrop-blur-md">
                                                <button
                                                    onClick={() => setCategoryFilter("all")}
                                                    className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${categoryFilter === "all" ? "bg-white text-black shadow-xl" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                                                >
                                                    Full Spectrum
                                                </button>
                                                {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map((cat) => {
                                                    const count = displayQuestions.filter((q) => q.category === cat).length;
                                                    if (count === 0) return null;
                                                    const cfg = CATEGORY_CONFIG[cat];
                                                    const Icon = cfg.icon;
                                                    return (
                                                        <button
                                                            key={cat}
                                                            onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}
                                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${categoryFilter === cat ? `${cfg.bg} ${cfg.color} border border-white/10 shadow-lg` : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                                                        >
                                                            <Icon className="w-3.5 h-3.5" />
                                                            <span className="hidden sm:inline">{cfg.label.split(" ")[0]}</span>
                                                            <span className="ml-1 opacity-50 font-mono text-[10px]">{count}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-3">
                                                {editingQuestions ? (
                                                    <>
                                                        <Button variant="ghost" onClick={handleCancelEdit} className="text-muted-foreground hover:text-foreground h-11 px-5 rounded-xl border border-border hover:bg-muted">
                                                            <X className="w-4 h-4 mr-2" /> Discard
                                                        </Button>
                                                        <Button onClick={handleSaveEdit} disabled={isSaving} className="bg-emerald-500 hover:bg-emerald-600 text-foreground h-11 px-6 rounded-xl shadow-lg shadow-emerald-500/20 font-semibold border-0">
                                                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Persist Changes
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button variant="ghost" onClick={handleStartEdit} className="text-primary hover:text-primary hover:bg-primary/10 h-11 px-5 rounded-xl border border-border/20 backdrop-blur-sm">
                                                            <Pencil className="w-4 h-4 mr-2" /> Modify Vectors
                                                        </Button>
                                                        <Button variant="ghost" onClick={handleDeleteSession} className="text-rose-400 hover:text-rose-400 hover:bg-rose-500/10 h-11 w-11 px-0 rounded-xl border border-rose-500/20 backdrop-blur-sm">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Question Cards Grid */}
                            <div className="grid grid-cols-1 gap-6">
                                {displayQuestions.filter((fq) => categoryFilter === "all" || fq.category === categoryFilter).map((fq, idx) => {
                                    const originalIdx = displayQuestions.indexOf(fq);
                                    const catCfg = CATEGORY_CONFIG[fq.category] || CATEGORY_CONFIG.depth_check;
                                    const CatIcon = catCfg.icon;

                                    return (
                                        <div
                                            key={idx}
                                            className={`group relative bg-muted/20 hover:bg-muted/40 border-l-4 ${catCfg.border} border-y border-r border-border rounded-3xl transition-all duration-500 overflow-hidden backdrop-blur-sm shadow-xl`}
                                        >
                                            <div className="p-8">
                                                <div className="flex flex-col lg:flex-row gap-8">
                                                    {/* LEFT: Question Text */}
                                                    <div className="flex-1 space-y-6">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border ${catCfg.bg} ${catCfg.color}`}>
                                                                    <CatIcon className="w-5 h-5" />
                                                                </div>
                                                                <div className="space-y-0.5">
                                                                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 text-foreground">ID Vector_{idx + 1}</p>
                                                                    <p className={`text-xs font-bold uppercase tracking-wider ${catCfg.color}`}>{catCfg.label}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {editingQuestions && (
                                                                    <button onClick={() => handleDeleteQuestion(originalIdx)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                {!editingQuestions && (
                                                                    <button
                                                                        onClick={() => handleCopyQuestion(fq.question_text, originalIdx)}
                                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
                                                                    >
                                                                        {copiedIdx === originalIdx ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {editingQuestions ? (
                                                            <Textarea
                                                                value={fq.question_text}
                                                                onChange={(e) => handleEditField(originalIdx, "question_text", e.target.value)}
                                                                className="w-full bg-background/60 border-border rounded-2xl p-6 text-lg text-foreground font-light focus:border-border/40 transition-all min-h-[120px] shadow-inner"
                                                                placeholder="Refine this probe question…"
                                                            />
                                                        ) : (
                                                            <h3 className="text-2xl font-extralight text-foreground leading-relaxed italic pr-6 group-hover:text-foreground transition-colors duration-300">
                                                                &ldquo;{fq.question_text}&rdquo;
                                                            </h3>
                                                        )}

                                                        <div className="flex items-center gap-3">
                                                            <Badge className={`text-[10px] uppercase tracking-widest px-3 py-1 font-bold border ${PRIORITY_CONFIG[fq.priority] || PRIORITY_CONFIG.medium}`}>
                                                                {fq.priority} Focus
                                                            </Badge>
                                                            <div className="flex items-center gap-1.5">
                                                                {fq.related_topics?.map((tag, tIdx) => (
                                                                    <span key={tIdx} className="px-2.5 py-0.5 rounded-lg bg-background/60 border border-border text-[9px] text-muted-foreground font-mono uppercase tracking-tighter">#{tag}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* RIGHT: Objective & Protocols */}
                                                    <div className="lg:w-[400px] space-y-8 p-8 rounded-2xl bg-white/[0.02] border border-border shadow-inner">
                                                        <div className="space-y-4">
                                                            <h4 className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Strategic Objective
                                                            </h4>
                                                            {editingQuestions ? (
                                                                <Textarea
                                                                    value={fq.purpose}
                                                                    onChange={(e) => handleEditField(originalIdx, "purpose", e.target.value)}
                                                                    className="w-full bg-background/40 border-border rounded-xl px-4 py-3 text-sm text-muted-foreground focus:border-border/40 transition-all min-h-[80px]"
                                                                />
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground font-light leading-relaxed italic">&ldquo;{fq.purpose}&rdquo;</p>
                                                            )}
                                                        </div>

                                                        <div className="space-y-4 pt-6 border-t border-border">
                                                            <h4 className="text-[10px] uppercase tracking-widest text-amber-400 font-bold flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 opacity-60" /> Cognitive Probes
                                                            </h4>
                                                            <div className="space-y-3">
                                                                {fq.suggested_follow_up_points?.map((point, pi) => (
                                                                    <div key={pi} className="flex gap-3 items-start group/point">
                                                                        <MoveRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0 opacity-40 group-hover/point:opacity-100 group-hover/point:translate-x-1 transition-all" />
                                                                        <p className="text-xs text-muted-foreground font-light leading-relaxed group-hover/point:text-foreground transition-colors">{point}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ═══════ SECTION: Skill Evaluation (Employee Mode) ═══════ */}
                {test.target_type === "employee" && test.position_id && skillRequirements.length > 0 && (
                    <SkillEvaluationPanel
                        resultId={result.id}
                        positionName={test.title || test.job_role}
                        positionId={test.position_id}
                        personId={(result as any).person_id ?? null}
                        skillRequirements={skillRequirements}
                        existingEvaluations={existingEvaluations}
                    />
                )}

            </PageContainer>
        </div>
    );
}
