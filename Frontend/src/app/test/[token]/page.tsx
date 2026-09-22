"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PremiumBackground } from "@/components/ui/premium-background";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Flag, Code2, Sparkles, CheckCircle2, ChevronRight, User, Mail, Zap, XCircle, Clock, AlertTriangle, Play, FileText, BarChart, ArrowLeft, Compass, Layers, ShieldAlert } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Question {
    id: string;
    question_text: string;
    options: string[];
    topic: string;
    difficulty: string;
    order_num: number;
    question_type?: string;
    grading_mode?: "auto" | "manual";
    answer_payload?: Record<string, unknown>;
}

interface Test {
    id: string;
    title?: string;
    job_role: string;
    level: string;
    time_limit_minutes: number;
    status: string;
    start_time: string | null;
    expires_at: string | null;
    max_participants: number | null;
    share_token?: string;
    questions: Question[];
}

export default function CandidateTestPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [test, setTest] = useState<Test | null>(null);
    const [loading, setLoading] = useState(true);
    const [phase, setPhase] = useState<"landing" | "testing" | "submitted" | "expired" | "not_started" | "full">("landing");
    const [candidateName, setCandidateName] = useState("");
    const [candidateEmail, setCandidateEmail] = useState("");
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [responses, setResponses] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resultId, setResultId] = useState<string | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isTimeout, setIsTimeout] = useState(false);
    const [submittedScore, setSubmittedScore] = useState<number | null>(null);
    const [submittedTotal, setSubmittedTotal] = useState<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const endTimeRef = useRef<number>(0);
    const hasSubmittedRef = useRef(false);

    // Load test via BFF — never fetch correct_answer or candidate PII through PostgREST.
    useEffect(() => {
        async function loadTest() {
            setLoading(true);
            const res = await fetch(`/api/tests/public/${encodeURIComponent(token)}`);
            if (!res.ok) {
                setLoading(false);
                return;
            }
            const payload = await res.json() as {
                test: Test;
                availability: "ok" | "completed" | "not_started" | "expired" | "full";
            };
            const t = payload.test;
            t.questions?.sort((a: Question, b: Question) => a.order_num - b.order_num);

            const savedStateStr = localStorage.getItem(`test_state_${token}`);
            let savedState: Record<string, unknown> | null = null;
            if (savedStateStr) {
                try {
                    savedState = JSON.parse(savedStateStr);
                } catch { /* ignore parse error */ }
            }

            if (payload.availability === "completed") {
                if (savedState && savedState.phase === "submitted") {
                    setPhase("submitted");
                    if (typeof savedState.candidateName === "string") setCandidateName(savedState.candidateName);
                    if (typeof savedState.candidateEmail === "string") setCandidateEmail(savedState.candidateEmail);
                    if (typeof savedState.score === "number") setSubmittedScore(savedState.score);
                    if (typeof savedState.total === "number") setSubmittedTotal(savedState.total);
                    if (savedState.isTimeout) setIsTimeout(true);
                } else {
                    setPhase("expired");
                }
            } else if (payload.availability === "not_started") {
                setPhase("not_started");
            } else if (payload.availability === "expired") {
                setPhase("expired");
            } else if (payload.availability === "full") {
                setPhase("full");
            } else if (savedState && (savedState.phase === "full" || savedState.phase === "expired")) {
                setPhase("landing");
                setTimeLeft((t.time_limit_minutes || 15) * 60);
            } else if (savedState && typeof savedState.phase === "string") {
                setPhase(savedState.phase as typeof phase);
                if (typeof savedState.candidateName === "string") setCandidateName(savedState.candidateName);
                if (typeof savedState.candidateEmail === "string") setCandidateEmail(savedState.candidateEmail);
                if (savedState.answers && typeof savedState.answers === "object") setAnswers(savedState.answers as Record<string, number>);
                if (savedState.responses && typeof savedState.responses === "object") setResponses(savedState.responses as Record<string, string>);
                if (typeof savedState.startTime === "number") startTimeRef.current = savedState.startTime;
                if (savedState.isTimeout) setIsTimeout(true);
                if (typeof savedState.score === "number") setSubmittedScore(savedState.score);
                if (typeof savedState.total === "number") setSubmittedTotal(savedState.total);

                if (typeof savedState.endTime === "number" && savedState.phase === "testing") {
                    endTimeRef.current = savedState.endTime;
                    const remaining = Math.max(0, Math.floor((savedState.endTime - Date.now()) / 1000));
                    setTimeLeft(remaining);
                } else {
                    setTimeLeft((t.time_limit_minutes || 15) * 60);
                }
            } else {
                setPhase("landing");
                setTimeLeft((t.time_limit_minutes || 15) * 60);
            }

            setTest(t);
            setLoading(false);
        }
        loadTest();
    }, [token, router]);

    // Save state continuously
    useEffect(() => {
        if (!test || phase === "expired" || test.status === "completed") return;
        localStorage.setItem(`test_state_${token}`, JSON.stringify({
            phase,
            candidateName,
            candidateEmail,
            answers,
            responses,
            startTime: startTimeRef.current,
            endTime: endTimeRef.current,
            resultId,
            isTimeout
        }));
    }, [phase, candidateName, candidateEmail, answers, responses, resultId, isTimeout, token, test]);

    // Submit function
    const submitTest = useCallback(async (timeoutFlag = false) => {
        if (hasSubmittedRef.current || !test) return;
        hasSubmittedRef.current = true;
        setIsSubmitting(true);
        if (timeoutFlag === true) setIsTimeout(true);

        const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
        const answerArray = test.questions.map((q) => {
            if (q.grading_mode === "manual") {
                return {
                    question_id: q.id,
                    response_text: responses[q.id] ?? "",
                };
            }
            return {
                question_id: q.id,
                selected_answer: answers[q.id] ?? -1,
            };
        });

        try {
            const res = await fetch("/api/results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    share_token: token,
                    test_id: test.id,
                    candidate_name: candidateName,
                    candidate_email: candidateEmail,
                    answers: answerArray,
                    time_taken: timeTaken,
                }),
            });

            if (!res.ok) throw new Error("Submit failed");
            const data = await res.json();
            setResultId(data.result.id);
            setSubmittedScore(data.result.score ?? null);
            setSubmittedTotal(data.result.total_questions ?? test.questions.length);
            setPhase("submitted");
            toast.success("Nộp bài thành công!");

            localStorage.setItem(`test_state_${token}`, JSON.stringify({
                phase: "submitted",
                resultId: data.result.id,
                score: data.result.score,
                total: data.result.total_questions,
                candidateName,
                candidateEmail,
                isTimeout: timeoutFlag === true
            }));

        } catch {
            toast.error("Có lỗi khi nộp bài. Vui lòng thử lại.");
            hasSubmittedRef.current = false;
        } finally {
            setIsSubmitting(false);
        }
    }, [test, answers, responses, candidateName, candidateEmail, token]);

    // Timer
    useEffect(() => {
        if (phase !== "testing") return;

        // Initial check in case they loaded with 0 time left
        const initialRemaining = Math.floor((endTimeRef.current - Date.now()) / 1000);
        if (initialRemaining <= 0) {
            setTimeLeft(0);
            submitTest(true);
            return;
        }

        setTimeLeft(initialRemaining);

        const interval = setInterval(() => {
            const remaining = Math.floor((endTimeRef.current - Date.now()) / 1000);
            if (remaining <= 0) {
                setTimeLeft(0);
                submitTest(true);
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [phase, submitTest]);

    function startTest() {
        if (!candidateName || !candidateEmail) {
            toast.error("Vui lòng nhập đầy đủ thông tin");
            return;
        }
        startTimeRef.current = Date.now();
        endTimeRef.current = Date.now() + (test?.time_limit_minutes || 15) * 60 * 1000;
        setPhase("testing");
    }

    function selectAnswer(questionId: string, answerIdx: number) {
        setAnswers((prev) => ({ ...prev, [questionId]: answerIdx }));
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
                <PremiumBackground />
                <div className="flex flex-col items-center gap-6 relative z-10">
                    <div className="relative">
                        <div className="w-16 h-16 border-2 border-border/10 border-t-border rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-warning animate-pulse" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-foreground font-bold tracking-widest uppercase text-sm mb-1">Synchronizing Node</p>
                        <p className="text-muted-foreground font-mono text-xs">Establishing secure protocol link...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (phase === "not_started" || phase === "full") {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <PremiumBackground />
                <FadeIn className="w-full max-w-md relative z-10">
                    <Card className="bg-card/90 border-border/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 border border-white/5 rounded-[2.5rem] pointer-events-none" />
                        <CardHeader className="text-center p-10 pb-6">
                            <div className="w-20 h-20 bg-warning/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-border/20 shadow-[0_10px_30px_color-mix(in_srgb,var(--warning)_15%,transparent)]">
                                {phase === "not_started" ? <Compass className="w-10 h-10 text-warning" /> : <Layers className="w-10 h-10 text-warning" />}
                            </div>
                            <CardTitle className="text-3xl font-bold font-display text-foreground mb-3">
                                {phase === "not_started" ? "Protocol Pending" : "Capacity Reached"}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground text-base leading-relaxed">
                                {phase === "not_started"
                                    ? `This evaluation is scheduled to activate at ${new Date(test!.start_time!).toLocaleString()}. Please return during the assigned window.`
                                    : "All available slots for this evaluation have been occupied. Please contact your administrator for further instructions."}
                            </CardDescription>
                        </CardHeader>
                        <div className="p-10 pt-0">
                            <Button
                                onClick={() => router.back()}
                                className="w-full h-12 rounded-2xl bg-muted hover:bg-accent text-muted-foreground border border-border/10 font-bold transition-all"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Return to Base
                            </Button>
                        </div>
                    </Card>
                </FadeIn>
            </div>
        );
    }

    if (!test || phase === "expired") {
        return (
            <PageTransition className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
                <PremiumBackground />
                <FadeIn className="w-full max-w-md relative z-10">
                    <Card className="border-rose-500/30 bg-card/90 rounded-[2.5rem] text-center shadow-2xl">
                        <div className="absolute inset-0 border border-white/5 rounded-[2.5rem] pointer-events-none" />
                        <CardContent className="py-20">
                            <div className="w-20 h-20 rounded-3xl bg-rose-500/10 flex items-center justify-center mx-auto mb-8 border border-rose-500/20 shadow-[0_10px_30px_color-mix(in_srgb,var(--danger)_10%,transparent)]">
                                <XCircle className="w-10 h-10 text-rose-400" />
                            </div>
                            <h2 className="text-3xl font-bold font-display text-foreground mb-4">Protocol Expired</h2>
                            <p className="text-muted-foreground text-base leading-relaxed px-6">
                                {phase === "expired"
                                    ? "This technical bridge session has been terminated. The evaluation window is no longer active."
                                    : "The security token for this protocol is invalid or has been revoked."}
                            </p>
                            <Button
                                onClick={() => router.replace('/dashboard')}
                                className="mt-10 h-12 px-8 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all"
                            >
                                Contact Support
                            </Button>
                        </CardContent>
                    </Card>
                </FadeIn>
            </PageTransition>
        );
    }

    // LANDING PHASE
    if (phase === "landing") {
        return (
            <PageTransition className="min-h-screen bg-background text-foreground font-body selection:bg-warning/30 overflow-hidden relative flex items-center justify-center p-6">
                <PremiumBackground />

                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-20 items-center relative z-10 py-8 md:py-12">
                    {/* Left: Info */}
                    <FadeIn className="text-center lg:text-left space-y-6 md:space-y-10">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "backOut" }}
                            className="inline-flex items-center justify-center px-4 py-1.5 md:px-5 md:py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em] relative shadow-[0_0_30px_color-mix(in_srgb,var(--primary)_20%,transparent)] group overflow-hidden"
                        >
                            <motion.div
                                animate={{ opacity: [0.4, 0.8, 0.4] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent"
                            />
                            <Brain className="w-3 md:w-3.5 h-3 md:h-3.5 mr-2 md:mr-2.5 text-purple-400 drop-shadow-[0_0_8px_color-mix(in_srgb,var(--ai)_50%,transparent)]" />
                            <span className="relative z-10">Security Tier: <span className="text-white">Elite Protocol</span></span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, ease: "backOut" }}
                            className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black font-display text-transparent bg-clip-text bg-gradient-to-br from-foreground via-foreground to-muted-foreground leading-[1] drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                        >
                            Technical <br/>Evaluation
                        </motion.h1>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 md:gap-5">
                            <motion.div
                                whileHover={{ scale: 1.05, y: -2 }}
                                className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/40 px-5 py-2 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] shadow-[0_0_20px_color-mix(in_srgb,var(--warning)_10%,transparent)] flex items-center gap-2.5 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <div className="relative flex items-center gap-2.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_color-mix(in_srgb,var(--warning)_80%,transparent)]" />
                                    {test.title || test.job_role}
                                </div>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05, y: -2 }}
                                className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/40 px-5 py-2 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_10%,transparent)] flex items-center gap-2.5 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <span className="relative flex items-center gap-2.5 italic">
                                    <Sparkles className="w-3 h-3 text-cyan-400" />
                                    {test.level} Core
                                </span>
                            </motion.div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                            <div className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-muted/20 border border-white/5 transition-all duration-500 hover:border-border/30 hover:bg-muted/40 group relative overflow-hidden shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="p-2.5 md:p-3 w-fit rounded-xl md:rounded-2xl bg-gradient-to-br from-warning to-warning mb-4 md:mb-6 shadow-[0_8px_25px_color-mix(in_srgb,var(--warning)_30%,transparent)] group-hover:scale-110 transition-transform duration-500">
                                    <FileText className="w-4 md:w-5 h-4 md:h-5 text-black" />
                                </div>
                                <div className="text-3xl md:text-4xl font-black font-display text-foreground mb-0.5 md:mb-1 group-hover:translate-x-1 transition-transform duration-500">{test.questions?.length || 10}</div>
                                <div className="text-muted-foreground text-[9px] md:text-[10px] uppercase tracking-[0.25em] font-black">Questions</div>
                            </div>
                            <div className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-muted/20 border border-white/5 transition-all duration-500 hover:border-border/30 hover:bg-muted/40 group relative overflow-hidden shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="p-2.5 md:p-3 w-fit rounded-xl md:rounded-2xl bg-gradient-to-br from-warning to-warning mb-4 md:mb-6 shadow-[0_8px_25px_color-mix(in_srgb,var(--warning)_30%,transparent)] group-hover:scale-110 transition-transform duration-500">
                                    <Clock className="w-4 md:w-5 h-4 md:h-5 text-black" />
                                </div>
                                <div className="text-3xl md:text-4xl font-black font-display text-foreground mb-0.5 md:mb-1 group-hover:translate-x-1 transition-transform duration-500">{test.time_limit_minutes || 15}</div>
                                <div className="text-muted-foreground text-[9px] md:text-[10px] uppercase tracking-[0.25em] font-black">Minute Limit</div>
                            </div>
                        </div>
                    </FadeIn>

                    {/* Right: Connect Form */}
                    <FadeIn delay={0.2} className="w-full">
                        <Card className="border-border/20 bg-card/90 overflow-hidden relative shadow-[0_30px_100px_rgba(0,0,0,0.6)] rounded-[2.5rem] md:rounded-[3rem]">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-warning/40 to-transparent" />
                            <div className="absolute inset-px rounded-[2.5rem] md:rounded-[3rem] border border-white/5 pointer-events-none" />

                            <CardHeader className="p-6 md:p-10 pb-4 md:pb-6 relative z-10">
                                <CardTitle className="text-xl md:text-2xl font-bold text-foreground font-display">Candidate Initialization</CardTitle>
                                <p className="text-muted-foreground text-sm md:text-base mt-2 leading-relaxed">Provide your identity credentials to authenticate the evaluation session.</p>
                            </CardHeader>
                            <CardContent className="p-6 md:p-10 pt-0 space-y-6 md:space-y-8 relative z-10">
                                <div className="space-y-5 md:space-y-8">
                                    <div className="space-y-2 md:space-y-2.5">
                                        <Label className="text-muted-foreground text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black ml-1">Identity Name</Label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <User className="w-3.5 md:w-4 h-3.5 md:h-4 text-muted-foreground group-focus-within:text-warning transition-colors" />
                                            </div>
                                            <Input
                                                placeholder="Enter full name"
                                                value={candidateName}
                                                onChange={(e) => setCandidateName(e.target.value)}
                                                className="w-full bg-background/60 border-border/10 text-foreground placeholder:text-muted-foreground/40 pl-11 h-12 md:h-14 rounded-xl md:rounded-2xl focus:border-border/40 focus:ring-1 focus:ring-warning/10 transition-all font-medium text-sm md:text-base"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:space-y-2.5">
                                        <Label className="text-muted-foreground text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black ml-1">Communication Channel</Label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail className="w-3.5 md:w-4 h-3.5 md:h-4 text-muted-foreground group-focus-within:text-warning transition-colors" />
                                            </div>
                                            <Input
                                                type="email"
                                                placeholder="email@protocol.com"
                                                value={candidateEmail}
                                                onChange={(e) => setCandidateEmail(e.target.value)}
                                                className="w-full bg-background/60 border-border/10 text-foreground placeholder:text-muted-foreground/40 pl-11 h-12 md:h-14 rounded-xl md:rounded-2xl focus:border-border/40 focus:ring-1 focus:ring-warning/10 transition-all font-medium text-sm md:text-base"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 md:space-y-6">
                                    <div className="flex items-start gap-3 md:gap-4 p-4 md:p-5 rounded-xl md:rounded-2xl bg-rose-500/5 border border-rose-500/15 ring-1 ring-rose-500/5">
                                        <AlertTriangle className="w-4 md:w-5 h-4 md:h-5 text-rose-500 shrink-0 mt-0.5" />
                                        <p className="text-rose-200/60 text-[10px] md:text-xs leading-relaxed font-medium">
                                            <span className="font-black text-rose-500 block mb-1">STRICT PROTOCOL ENFORCEMENT</span>
                                            The system auto-terminates and submits upon timeout. Secure backtracking is disabled. Ensure stable uplink.
                                        </p>
                                    </div>

                                    <Button
                                        onClick={startTest}
                                        className="w-full bg-gradient-to-br from-warning to-warning text-background hover:scale-[1.02] active:scale-[0.98] rounded-xl md:rounded-2xl h-12 md:h-16 text-xs md:text-sm font-black shadow-[0_15px_40px_color-mix(in_srgb,var(--warning)_25%,transparent)] transition-all gap-2 md:gap-3 group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        <Play className="w-3.5 md:w-4 h-3.5 md:h-4 fill-current" />
                                        <span>ACTIVATE PROTOCOL</span>
                                        <ChevronRight className="w-3.5 md:w-4 h-3.5 md:h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </FadeIn>
                </div>
            </PageTransition>
        );
    }

    // SUBMITTED PHASE
    if (phase === "submitted") {
        const hasManual = test.questions.some((q) => q.grading_mode === "manual");
        const score = submittedScore ?? 0;
        const total = submittedTotal ?? test.questions.length;
        const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

        return (
            <PageTransition className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
                <PremiumBackground />

                <FadeIn className="w-full max-w-lg relative z-10">
                    <Card className="border-border/20 bg-card/90 rounded-[3rem] text-center shadow-[0_30px_100px_rgba(0,0,0,0.6)] relative overflow-hidden">
                        <div className="absolute inset-px rounded-[3rem] border border-white/[0.03] pointer-events-none" />
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-warning/40 to-transparent" />

                        <CardContent className="p-8 md:p-16 space-y-8 md:space-y-10">
                            <div className="w-24 h-24 mx-auto rounded-[2rem] bg-warning/10 border border-border/20 flex items-center justify-center relative shadow-[0_10px_40px_color-mix(in_srgb,var(--warning)_15%,transparent)] group hover:scale-110 transition-transform duration-500">
                                {percentage >= 80 ? (
                                    <Sparkles className="w-12 h-12 text-warning drop-shadow-[0_0_10px_color-mix(in_srgb,var(--warning)_50%,transparent)]" />
                                ) : percentage >= 50 ? (
                                    <CheckCircle2 className="w-12 h-12 text-warning" />
                                ) : (
                                    <BarChart className="w-12 h-12 text-warning" />
                                )}
                            </div>

                             <div className="space-y-3">
                                <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground">Nộp Bài Thành Công</h2>
                                <p className="text-muted-foreground text-sm md:text-base font-medium">Kết quả và dữ liệu của ứng viên <span className="text-foreground font-black">{candidateName}</span> đã được lưu lại an toàn trên hệ thống.</p>
                                {hasManual && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mx-auto mt-2">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        <span>Có câu hỏi tự luận đang chờ chấm điểm</span>
                                    </div>
                                )}
                            </div>

                            <div className="relative w-48 h-48 mx-auto group">
                                <div className="absolute inset-0 bg-warning/10 blur-[40px] rounded-full group-hover:bg-warning/20 transition-colors duration-500" />
                                <svg className="w-48 h-48 -rotate-90 drop-shadow-[0_0_30px_color-mix(in_srgb,var(--warning)_30%,transparent)] relative z-10" viewBox="0 0 128 128">
                                    <circle cx="64" cy="64" r="58" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                                    <motion.circle
                                        cx="64" cy="64" r="58" fill="none"
                                        stroke="url(#scoreGradient)" strokeWidth="8"
                                        strokeLinecap="round"
                                        initial={{ strokeDasharray: "0 364" }}
                                        animate={{ strokeDasharray: `${(percentage / 100) * 364} 364` }}
                                        transition={{ duration: 1.5, ease: "circOut", delay: 0.5 }}
                                    />
                                    <defs>
                                        <linearGradient id="scoreGradient" gradientTransform="rotate(90)">
                                            <stop offset="0%" stopColor="var(--warning)" />
                                            <stop offset="100%" stopColor="var(--warning)" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col z-20">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.8, delay: 1, ease: "backOut" }}
                                        className="text-5xl font-black font-display text-foreground"
                                    >
                                        {percentage}<span className="text-2xl text-warning ml-0.5">%</span>
                                    </motion.div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-[0.25em] font-black mt-2">
                                        {hasManual ? "Độ chính xác (Trắc nghiệm)" : "Độ Chính Xác"}
                                    </div>
                                </div>
                            </div>

                            {isTimeout && (
                                <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold animate-pulse text-center">
                                    Đã hết thời gian làm bài! Hệ thống đã tự động nộp bài của bạn.
                                </div>
                            )}

                            <div className="p-6 rounded-[2rem] bg-muted/60 border border-white/5 text-sm text-muted-foreground mx-2 leading-relaxed text-left">
                                {percentage >= 80 && (
                                    <span className="flex flex-col gap-2">
                                        <span className="text-warning font-black uppercase tracking-widest text-[10px]">Xuất sắc</span>
                                        Chúc mừng bạn đã hoàn thành bài kiểm tra với thành tích tuyệt vời! Trình độ của bạn rất tốt.
                                    </span>
                                )}
                                {percentage >= 50 && percentage < 80 && (
                                    <span className="flex flex-col gap-2">
                                        <span className="text-warning/70 font-black uppercase tracking-widest text-[10px]">Đạt mức tiêu chuẩn</span>
                                        Bạn đã hoàn thành tốt bài kiểm tra. Hãy tiếp tục cố gắng để đạt kết quả cao hơn nữa nhé!
                                    </span>
                                )}
                                {percentage < 50 && (
                                    <span className="flex flex-col gap-2">
                                        <span className="text-rose-400 font-black uppercase tracking-widest text-[10px]">Cần cố gắng thêm</span>
                                        Bạn đã hoàn thành bài kiểm tra. Tuy kết quả chưa cao nhưng đừng nản chí, hãy ôn tập và thử lại nhé!
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </FadeIn>
            </PageTransition>
        );
    }
    const question = test?.questions?.[currentQuestion];
    const totalQuestions = test?.questions?.length || 0;
    const answeredCount = test?.questions?.reduce((acc, q) => {
        if (q.grading_mode === "manual") {
            return acc + (responses[q.id]?.trim() ? 1 : 0);
        }
        return acc + (answers[q.id] !== undefined ? 1 : 0);
    }, 0) || 0;
    const isUrgent = timeLeft <= 60; // Urgent in last minute

    if (!question || !test) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <PremiumBackground />
                <div className="text-center space-y-4 relative z-10">
                    <div className="w-12 h-12 border-4 border-border/20 border-t-border rounded-full animate-spin mx-auto" />
                    <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">Synchronizing Protocol Node...</p>
                </div>
            </div>
        );
    }

    return (
        <PageTransition className="min-h-screen bg-background text-foreground font-body overflow-hidden flex flex-col relative">
            <PremiumBackground />

            {/* Header / HUD */}
            <header className="relative z-50 border-b border-white/5 bg-card/95 shadow-[0_4px_30px_rgba(0,0,0,0.3)] shrink-0">
                <div className="max-w-[90rem] mx-auto px-4 sm:px-8 h-[64px] md:h-[80px] flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-5">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-background border border-white/10 flex items-center justify-center text-warning font-black text-xs shadow-inner">
                            <Zap className="w-4 md:w-5 h-4 md:h-5 fill-current" />
                        </div>
                        <div className="flex flex-col">
                            <div className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black mb-0.5 whitespace-nowrap">Protocol Active</div>
                            <div className="text-sm md:text-base text-foreground font-bold flex items-center gap-2 truncate max-w-[120px] sm:max-w-none">
                                {test.title || test.job_role}
                                <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-warning/50 animate-pulse" />
                                <span className="hidden lg:block text-muted-foreground font-medium text-sm">Tier: {test.level}</span>
                            </div>
                        </div>
                    </div>

                    {/* Time Module - Pro VIP */}
                    <div className={`flex items-center gap-3 md:gap-4 px-3 md:px-6 py-1.5 md:py-2.5 rounded-xl md:rounded-2xl border transition-all duration-500 ${isUrgent
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_20px_color-mix(in_srgb,var(--danger)_15%,transparent)]"
                        : "bg-muted/50 text-warning border-border/20 shadow-[0_0_20px_color-mix(in_srgb,var(--warning)_5%,transparent)]"
                        }`}>
                        <div className="flex items-center gap-2">
                             <Clock className={`w-3.5 md:w-4 h-3.5 md:h-4 ${isUrgent ? "animate-spin-slow" : ""}`} />
                             <span className="text-[8px] md:text-[10px] uppercase font-black tracking-widest hidden sm:inline">{isUrgent ? "Time" : "Remain"}</span>
                        </div>
                        <span className="font-mono text-lg md:text-2xl font-black tracking-[0.1em]">{formatTime(timeLeft)}</span>
                    </div>
                </div>

                {/* Optimized Progress Indicator */}
                <div className="w-full h-[3px] bg-white/[0.03] relative overflow-hidden">
                    <motion.div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-warning via-warning to-warning"
                        initial={{ width: 0 }}
                        animate={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                    />
                </div>
            </header>

            <main className="flex-1 max-w-[90rem] mx-auto w-full px-4 sm:px-8 py-6 md:py-10 relative z-10 flex flex-col md:flex-row gap-8 md:gap-12 overflow-hidden">

                {/* Left Navigation: Node Matrix (Desktop Only) */}
                <aside className="md:w-72 shrink-0 flex flex-col gap-8 hidden md:flex">
                    <div className="p-6 rounded-[2.5rem] bg-card/90 border border-white/5 shadow-xl relative">
                        <div className="absolute inset-px rounded-[2.5rem] border border-white/[0.02] pointer-events-none" />

                        <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-6 px-1 flex items-center gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-warning shadow-[0_0_10px_var(--warning)]" />
                            Protocol Matrix
                        </h3>

                        <div className="grid grid-cols-5 gap-2.5">
                            {test.questions.map((q, idx) => {
                                const isCurrent = currentQuestion === idx;
                                const isAnswered = q.grading_mode === "manual"
                                    ? !!responses[q.id]?.trim()
                                    : answers[q.id] !== undefined;

                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentQuestion(idx)}
                                        className={`relative w-full aspect-square rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center overflow-hidden group
                                            ${isCurrent
                                                ? "bg-warning text-background shadow-[0_10px_20px_color-mix(in_srgb,var(--warning)_20%,transparent)] scale-110 z-10"
                                                : isAnswered
                                                    ? "bg-warning/10 text-warning border border-border/20 hover:bg-warning/20"
                                                    : "bg-white/[0.03] text-muted-foreground border border-white/5 hover:border-white/10 hover:bg-white/[0.05]"
                                            }`}
                                    >
                                        {idx + 1}
                                        {isAnswered && !isCurrent && (
                                            <motion.div
                                                layoutId="answered-dot-desktop"
                                                className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-warning"
                                            />
                                        )}
                                        {isCurrent && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/[0.03]">
                            <div className="flex justify-between items-end mb-2.5 px-1">
                                <span className="text-[9px] uppercase tracking-widest font-black text-muted-foreground">Synchronization</span>
                                <span className="text-sm font-black text-warning">{Math.round((answeredCount / totalQuestions) * 100)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-warning"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-warning/5 border border-border/10 flex items-center gap-4 group hover:bg-warning/10 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-background border border-border/20 flex items-center justify-center text-warning group-hover:scale-110 transition-transform">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-[9px] font-black uppercase text-warning/60 tracking-widest mb-0.5">Encryption</div>
                            <div className="text-[11px] font-bold text-muted-foreground">Secure Point-to-Point</div>
                        </div>
                    </div>
                </aside>

                {/* Mobile Question Nav: VIP Horizontal Matrix */}
                <div className="md:hidden flex flex-col gap-4 relative z-40">
                    <div className="flex items-center justify-between px-2">
                        <div className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-warning animate-pulse" />
                            Protocol Matrix
                        </div>
                        <div className="text-[9px] font-black text-warning uppercase tracking-widest">
                            {answeredCount} / {totalQuestions} Sync
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
                        {test.questions.map((q, idx) => {
                            const isCurrent = currentQuestion === idx;
                            const isAnswered = q.grading_mode === "manual"
                                ? !!responses[q.id]?.trim()
                                : answers[q.id] !== undefined;

                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentQuestion(idx)}
                                    className={`shrink-0 w-10 h-10 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center border
                                        ${isCurrent
                                            ? "bg-warning border-border text-background shadow-[0_8px_20px_color-mix(in_srgb,var(--warning)_30%,transparent)] scale-105"
                                            : isAnswered
                                                ? "bg-warning/10 border-border/30 text-warning"
                                                : "bg-card/40 border-white/5 text-muted-foreground"
                                        }`}
                                >
                                    {idx + 1}
                                    {isAnswered && !isCurrent && (
                                        <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-warning" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Question Display - Pro VIP Card */}
                <div className="flex-1 flex flex-col max-w-4xl min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentQuestion}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4, ease: "circOut" }}
                            className="p-5 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] bg-card/90 border border-white/5 shadow-2xl relative min-h-[400px] md:min-h-[500px] flex flex-col"
                        >
                            <div className="absolute inset-px rounded-[2.5rem] md:rounded-[3.5rem] border border-white/[0.02] pointer-events-none" />

                            <div className="mb-10 flex flex-col gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="px-3 py-1 rounded-lg bg-warning/10 border border-border/20 text-warning text-[10px] font-black uppercase tracking-[0.2em]">
                                        Question {currentQuestion + 1}
                                    </div>
                                    <div className="px-3 py-1 rounded-lg bg-muted/60 border border-white/5 text-muted-foreground text-[10px] font-bold uppercase tracking-[0.1em]">
                                        {question.topic}
                                    </div>
                                </div>

                                <div className="text-2xl md:text-3xl font-bold font-display text-foreground leading-relaxed [&>p]:mb-6 [&>pre]:bg-background [&>pre]:p-6 [&>pre]:rounded-2xl [&>pre]:border [&>pre]:border-white/5 [&>pre]:overflow-x-auto [&>blockquote]:border-l-4 [&>blockquote]:border-border/50 [&>blockquote]:bg-warning/5 [&>blockquote]:p-5 [&>blockquote]:my-6 [&>blockquote]:rounded-r-2xl [&>ul]:list-disc [&>ul]:pl-8 [&>ul]:my-6 [&>ol]:list-decimal [&>ol]:pl-8 [&>ol]:my-6 [&_code]:text-warning [&_code]:bg-warning/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-[90%]">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {question.question_text}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            <CardContent className="p-0 space-y-4 mt-auto">
                                {question.grading_mode === "manual" ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <Label className="text-warning text-[10px] font-black uppercase tracking-[0.2em]">
                                                Your Response
                                            </Label>
                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                {(responses[question.id] ?? "").length} chars
                                            </span>
                                        </div>
                                        <div className="relative group">
                                            <Textarea
                                                value={responses[question.id] ?? ""}
                                                onChange={(e) => setResponses((prev) => ({ ...prev, [question.id]: e.target.value }))}
                                                placeholder={
                                                    question.question_type === "sql_logic_code"
                                                        ? "-- Write your SQL or code answer here..."
                                                        : "Type your answer here..."
                                                }
                                                className={`w-full min-h-[240px] bg-background/80 border-border/10 text-foreground placeholder:text-muted-foreground/40 p-6 rounded-2xl focus:border-border/40 focus:ring-1 focus:ring-warning/10 transition-all text-sm md:text-base leading-relaxed ${
                                                    question.question_type === "sql_logic_code" ? "font-mono" : "font-body"
                                                }`}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    question.options.map((option, idx) => {
                                        const isSelected = answers[question.id] === idx;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => selectAnswer(question.id, idx)}
                                                className={`w-full p-4 md:p-6 rounded-xl md:rounded-2xl border text-left transition-all duration-400 flex items-center gap-4 md:gap-5 group relative overflow-hidden ${isSelected
                                                    ? "border-border/50 bg-warning/10 shadow-[0_10px_30px_color-mix(in_srgb,var(--warning)_10%,transparent)]"
                                                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                                                    }`}
                                            >
                                                <div className={`shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black flex items-center justify-center border transition-all duration-400 ${isSelected
                                                    ? "bg-warning border-border text-background shadow-[0_0_15px_color-mix(in_srgb,var(--warning)_40%,transparent)] scale-110"
                                                    : "bg-background border-white/10 text-muted-foreground group-hover:border-border/30 group-hover:text-warning"
                                                    }`}>
                                                    {String.fromCharCode(65 + idx)}
                                                </div>
                                                <div className={`text-sm md:text-base font-medium transition-colors pr-4 ${isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                                                    {option}
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </CardContent>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Commands - Modern Float */}
                    <div className="mt-10 flex items-center justify-between gap-6 px-1">
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                            disabled={currentQuestion === 0}
                            className="text-muted-foreground hover:text-foreground hover:bg-white/5 gap-3 h-14 px-8 rounded-2xl font-bold transition-all disabled:opacity-20 border border-transparent hover:border-white/10"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Prev Question</span>
                        </Button>

                        {currentQuestion < totalQuestions - 1 ? (
                            <Button
                                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                                className="bg-muted hover:bg-primary text-foreground border border-white/5 h-14 px-10 rounded-2xl font-black gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl"
                            >
                                <span className="hidden sm:inline">Next Question</span> <ChevronRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black h-14 px-10 rounded-2xl shadow-[0_15px_40px_color-mix(in_srgb,var(--success)_25%,transparent)] transition-all hover:scale-105 active:scale-95 border-0">
                                        FINALIZE PROTOCOL
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[480px] bg-background/98 border border-white/10 text-foreground shadow-[0_30px_100px_rgba(0,0,0,0.8)] rounded-[3rem] p-10">
                                    <DialogHeader className="flex flex-col items-center">
                                        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20 mb-6 shadow-[0_10px_30px_color-mix(in_srgb,var(--success)_10%,transparent)]">
                                            <ShieldAlert className="w-10 h-10 text-emerald-400" />
                                        </div>
                                        <DialogTitle className="text-3xl font-bold font-display text-center">Terminate Session?</DialogTitle>
                                        <DialogDescription className="text-muted-foreground text-center text-sm pt-4 leading-relaxed font-medium">
                                            {answeredCount < totalQuestions
                                                ? `CRITICAL WARNING: Only ${answeredCount}/${totalQuestions} nodes are synchronized. Terminating now will lock all incomplete data. Proceed with transmission?`
                                                : "All protocol nodes are synchronized. Ready to transmit evaluation telemetry and close the session?"}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="mt-10 flex flex-col sm:flex-row gap-4">
                                        <Button variant="ghost" onClick={() => setIsConfirmOpen(false)} className="flex-1 h-14 rounded-2xl text-muted-foreground hover:text-foreground font-bold hover:bg-white/5">
                                            Return
                                        </Button>
                                        <Button
                                            disabled={isSubmitting}
                                            onClick={() => submitTest(false)}
                                            className="flex-1 h-14 bg-foreground text-background hover:bg-white rounded-2xl font-black shadow-xl"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin mr-2" />
                                                    Transmitting...
                                                </>
                                            ) : "Confirm Transmit"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>
            </main>
        </PageTransition>
    );
}
