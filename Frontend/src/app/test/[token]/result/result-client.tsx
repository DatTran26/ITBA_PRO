"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";
import { Brain, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, Trophy, Clock, Check, X, Sparkles, User, Zap, Loader2 } from "lucide-react";

interface Question {
    id: string;
    question_text: string;
    options: string[];
    topic: string;
    order_num: number;
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
}

interface Test {
    id: string;
    title?: string;
    job_role: string;
    level: string;
    questions: Question[];
    share_token?: string;
}

export default function ResultClient({
    result,
    test,
}: {
    result: Result;
    test: Test;
}) {
    const [aiAnalysis, setAiAnalysis] = useState<Analysis | null>(result.ai_analysis);
    const [isAnalyzing, setIsAnalyzing] = useState(!result.ai_analysis);

    useEffect(() => {
        if (!result.ai_analysis && isAnalyzing) {
            fetch("/api/ai/analyze-result", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ result_id: result.id })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.ai_analysis) {
                        setAiAnalysis(data.ai_analysis);
                    }
                })
                .catch(err => console.error("Error analyzing result:", err))
                .finally(() => setIsAnalyzing(false));
        }
    }, [result.id, result.ai_analysis, isAnalyzing]);

    const percentage = Math.round((result.score / result.total_questions) * 100);

    const getScoreColor = () => {
        if (percentage >= 80) return "text-emerald-400";
        if (percentage >= 50) return "text-amber-400";
        return "text-rose-400";
    };

    const getRecommendationBadge = (rec: string) => {
        switch (rec) {
            case "Recommend":
                return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "Consider":
                return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            default:
                return "bg-rose-500/10 text-rose-400 border-rose-500/20";
        }
    };

    return (
        <PageTransition className="min-h-screen bg-[#030305] text-white font-body selection:bg-indigo-500/30 overflow-hidden relative">

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
                <div className="mb-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
                    <FadeIn delay={0}>
                        <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 font-medium">{test.title || test.job_role}</Badge>
                            <Badge className="bg-white/5 text-white/60 border-white/10 px-3 py-1 font-normal">{test.level} Level</Badge>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-light font-display text-white mb-2">Evaluation Report</h1>
                        <p className="text-white/40 flex items-center justify-center md:justify-start gap-2">
                            <User className="w-4 h-4" /> {result.candidate_name} <span className="opacity-50">({result.candidate_email})</span>
                        </p>
                    </FadeIn>

                    <FadeIn delay={0.1} className="flex gap-4">
                        {/* Summary Stats */}
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center min-w-[120px]">
                            <Clock className="w-5 h-5 text-indigo-400 mb-2" />
                            <span className="text-xl font-display text-white">{result.time_taken ? Math.floor(result.time_taken / 60) : 0}m</span>
                            <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mt-1">Duration</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center min-w-[120px] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Trophy className="w-5 h-5 text-purple-400 mb-2" />
                            <span className="text-xl font-display text-white">{result.score}/{result.total_questions}</span>
                            <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mt-1">Score</span>
                        </div>
                    </FadeIn>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left: Telemetry & AI */}
                    <StaggerContainer className="lg:col-span-1 space-y-6">

                        {/* Score Gauge */}
                        <StaggerItem>
                            <Card className="border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl relative overflow-hidden shadow-2xl">
                                <CardContent className="pt-8 pb-8 text-center flex flex-col items-center">
                                    <div className="relative w-40 h-40 mb-6">
                                        <svg className="w-40 h-40 -rotate-90" viewBox="0 0 128 128">
                                            <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                                            <circle
                                                cx="64" cy="64" r="56" fill="none"
                                                stroke="url(#rg)" strokeWidth="6"
                                                strokeLinecap="round"
                                                strokeDasharray={`${(percentage / 100) * 352} 352`}
                                            />
                                            <defs>
                                                <linearGradient id="rg">
                                                    <stop offset="0%" stopColor={percentage >= 80 ? "#10b981" : percentage >= 50 ? "#f59e0b" : "#ef4444"} />
                                                    <stop offset="100%" stopColor={percentage >= 80 ? "#059669" : percentage >= 50 ? "#d97706" : "#dc2626"} />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                                            <span className={`text-4xl font-light font-display ${getScoreColor()}`}>{percentage}<span className="text-xl opacity-50">%</span></span>
                                            <span className="text-[10px] uppercase tracking-widest text-white/40 mt-1 font-semibold">Accuracy</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-white/50 px-4">Performance telemetry indicates a {percentage}% match with baseline parameters.</p>
                                </CardContent>
                            </Card>
                        </StaggerItem>

                        {/* AI Analysis (If completed) */}
                        {(aiAnalysis || isAnalyzing) && (
                            <StaggerItem>
                                <Card className="border-indigo-500/20 bg-indigo-500/5 backdrop-blur-xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-base font-medium font-display text-indigo-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Brain className="w-4 h-4 text-indigo-400" /> Neural Assessment
                                            </div>
                                            {isAnalyzing && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {isAnalyzing ? (
                                            <div className="flex flex-col items-center justify-center py-6 gap-3">
                                                <div className="text-sm text-indigo-200/50">Running advanced AI analysis on your results...</div>
                                            </div>
                                        ) : aiAnalysis ? (
                                            <>
                                                <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-sm text-indigo-100/70 leading-relaxed relative">
                                                    <Sparkles className="absolute top-3 right-3 w-4 h-4 text-indigo-500/30" />
                                                    {aiAnalysis.overall_assessment}
                                                </div>

                                                {aiAnalysis.strengths?.length > 0 && (
                                                    <div>
                                                        <p className="text-[11px] uppercase tracking-widest text-white/40 font-semibold mb-3">Identified Strengths</p>
                                                        <ul className="space-y-2">
                                                            {aiAnalysis.strengths.map((s, i) => (
                                                                <li key={i} className="text-sm text-emerald-400/80 flex items-start gap-3">
                                                                    <div className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                                                    {s}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {aiAnalysis.weaknesses?.length > 0 && (
                                                    <div>
                                                        <p className="text-[11px] uppercase tracking-widest text-white/40 font-semibold mb-3 mt-4">Areas for Optimization</p>
                                                        <ul className="space-y-2">
                                                            {aiAnalysis.weaknesses.map((w, i) => (
                                                                <li key={i} className="text-sm text-amber-400/80 flex items-start gap-3">
                                                                    <div className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                                                                    {w}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </>
                                        ) : null}
                                    </CardContent>
                                </Card>
                            </StaggerItem>
                        )}

                        {!aiAnalysis && !isAnalyzing && (
                            <StaggerItem>
                                <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl">
                                    <CardContent className="py-8 text-center flex flex-col items-center">
                                        <Zap className="w-8 h-8 text-indigo-400/50 mb-4" />
                                        <p className="text-sm text-white/50">Neural assessment is currently being processed. Results may appear shortly.</p>
                                    </CardContent>
                                </Card>
                            </StaggerItem>
                        )}
                    </StaggerContainer>

                    {/* Right: Detailed Questions */}
                    <div className="lg:col-span-2">
                        <FadeIn delay={0.2}>
                            <h2 className="text-xl font-medium font-display text-white mb-6 flex items-center gap-3">
                                <Zap className="w-5 h-5 text-indigo-400" /> Log Analysis
                            </h2>
                        </FadeIn>

                        <div className="space-y-4">
                            {test.questions?.map((q, idx) => {
                                const answer = result.answers?.find((a) => a.question_id === q.id) || result.answers?.[idx];
                                const isCorrect = answer?.is_correct;
                                const selectedAnswer = answer?.selected_answer ?? -1;

                                return (
                                    <FadeIn key={q.id} delay={0.3 + (idx * 0.05)}>
                                        <Card className={`relative overflow-hidden border-0 bg-transparent`}>
                                            {/* Edge indicator line */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCorrect ? "bg-emerald-500" : "bg-rose-500"}`} />

                                            <div className={`p-6 pl-8 rounded-xl border border-white/5 bg-[#0a0a0c]/60 backdrop-blur-md transition-all`}>
                                                <div className="flex items-start justify-between mb-4 gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isCorrect ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                                                            }`}>
                                                            {isCorrect ? <Check className="w-4 h-4 font-bold" /> : <X className="w-4 h-4 font-bold" />}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs uppercase tracking-widest text-white/40 font-semibold mb-1">Node {idx + 1}</div>
                                                            <Badge variant="outline" className="border-white/10 text-white/60 bg-white/5 text-[10px]">{q.topic}</Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                <h3 className="text-base text-white/90 leading-relaxed mb-6 font-medium">{q.question_text}</h3>

                                                <div className="space-y-2">
                                                    {q.options.map((opt, oIdx) => {
                                                        const isSelectedOpt = oIdx === selectedAnswer;

                                                        let optClass = "border-white/5 bg-white/[0.01] text-white/40";
                                                        if (isSelectedOpt && isCorrect) {
                                                            optClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/20";
                                                        } else if (isSelectedOpt && !isCorrect) {
                                                            optClass = "bg-rose-500/5 border-rose-500/20 text-rose-300";
                                                        }

                                                        return (
                                                            <div key={oIdx} className={`p-4 rounded-xl border flex items-start gap-4 transition-all duration-300 ${optClass}`}>
                                                                <div className={`shrink-0 w-6 h-6 rounded-full text-xs font-mono font-medium flex items-center justify-center border mt-0.5 ${isSelectedOpt && isCorrect ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" :
                                                                    isSelectedOpt && !isCorrect ? "bg-rose-500/20 border-rose-500/50 text-rose-400" :
                                                                        "bg-white/5 border-white/10 text-white/30"
                                                                    }`}>
                                                                    {String.fromCharCode(65 + oIdx)}
                                                                </div>

                                                                <div className="flex-1 flex flex-col justify-center min-h-[1.5rem]">
                                                                    <span className="text-[14px] leading-snug">{opt}</span>
                                                                </div>

                                                                {/* Status icons on right */}
                                                                {isSelectedOpt && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                                                                {isSelectedOpt && !isCorrect && <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </Card>
                                    </FadeIn>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
