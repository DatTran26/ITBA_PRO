"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PageTransition, FadeIn, AnimatePresence } from "@/components/ui/motion-wrapper";

import { Sparkles, Bot, ChevronRight, Zap, Brain, Settings, Bell, Database } from "lucide-react";
import LevelConfigStep from "@/components/question-bank/level-config-step";
import QuestionPullPreview from "@/components/question-bank/question-pull-preview";
import type { BankQuestion, LevelConfig, QuestionType, ShortageProposal } from "@/components/question-bank/question-bank-types";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import TargetTypeSelector from "@/components/management/target-type-selector";
import PositionSelector from "@/components/management/position-selector";
import GroupSelector from "@/components/management/group-selector";
import { PremiumBackground } from "@/components/ui/premium-background";
import { MATRIX_TYPE_MAP, getRoleSpecificMatrix, getBalancedMatrix, getPracticalMatrix } from "./create-test-matrix";
import CreateTestJdInput from "./create-test-jd-input";
import CreateTestRoleGrid, { JOB_ROLE_NAMES } from "./create-test-role-grid";
import CreateTestLevelGrid, { LEVEL_NAMES } from "./create-test-level-grid";
import CreateTestFromSkills from "./create-test-from-skills";

export function CreateTestWorkbench({ embedded = false, onCreated }: { embedded?: boolean; onCreated?: (test: { id: string }) => void | Promise<void> } = {}) {
    const [selectedRole, setSelectedRole] = useState("");
    const [customRole, setCustomRole] = useState("");
    const [slideRoles, setSlideRoles] = useState<string[]>([]);
    const [customSlideRoles, setCustomSlideRoles] = useState<string[]>([]);
    const [selectedLevel, setSelectedLevel] = useState("");
    const [customLevel, setCustomLevel] = useState("");

    const [jobDescription, setJobDescription] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Target type / position / group
    const [targetType, setTargetType] = useState<string>("candidate");
    const [positionId, setPositionId] = useState<string | null>(null);
    const [groupId, setGroupId] = useState<string | null>(null);

    // Advanced Settings
    const [testTitle, setTestTitle] = useState<string>("");
    const [questionCount, setQuestionCount] = useState<number>(10);
    const [questionCountInput, setQuestionCountInput] = useState<string>("10");
    const [timeLimit, setTimeLimit] = useState<number>(15);
    const [timeLimitInput, setTimeLimitInput] = useState<string>("15");
    const [maxParticipants, setMaxParticipants] = useState<string>("1");
    const [testDescription, setTestDescription] = useState<string>("");
    const [startTime, setStartTime] = useState<string>("");
    const [expiresAt, setExpiresAt] = useState<string>("");
    const [isEnhancingInstruction, setIsEnhancingInstruction] = useState(false);
    const [notifyOnCreated, setNotifyOnCreated] = useState(true);
    // Pre-select Question Bank flow when arriving via /create?source=bank from QB page.
    const searchParams = useSearchParams();
    const initialSource: 'ai' | 'bank' = searchParams.get("source") === "bank" ? "bank" : "ai";
    const [isConstraintsOpen, setIsConstraintsOpen] = useState(initialSource === "bank");
    const [questionSource, setQuestionSource] = useState<'ai' | 'bank' | 'skills'>(initialSource);
    const [bankStep, setBankStep] = useState<'config' | 'preview'>('config');
    const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null);
    const [pulledQuestions, setPulledQuestions] = useState<BankQuestion[]>([]);
    const [isPulling, setIsPulling] = useState(false);
    const [shortageProposal, setShortageProposal] = useState<ShortageProposal | null>(null);

    const [userRole, setUserRole] = useState<string>("");

    useEffect(() => {
        const fetchRole = async () => {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from("users")
                .select("role")
                .eq("auth_id", user.id)
                .single();
            if (data?.role) setUserRole(data.role);
        };
        fetchRole();
    }, []);

    const allowedTargetTypes: string[] = (() => {
        if (questionSource === "bank") return ["employee"];
        if (userRole === "interviewer") return ["candidate"];
        if (userRole === "recruiter") return ["employee"];
        return ["candidate", "employee"]; // admin, super_admin, loading state
    })();

    useEffect(() => {
        if (allowedTargetTypes.length === 1) {
            setTargetType(allowedTargetTypes[0]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole, questionSource]);

    const isReady = !!(
        ((selectedRole && selectedRole !== "Other") || (selectedRole === "Other" && customRole)) &&
        ((selectedLevel && selectedLevel !== "Other") || (selectedLevel === "Other" && customLevel))
    );

    const displayRole = selectedRole === "Other" ? (customRole || "Custom Role") : selectedRole;

    const displayLevel = selectedLevel === "Other" ? (customLevel || "Custom Level") : selectedLevel;

    // Matrix settings
    const [activePreset, setActivePreset] = useState<string>("balanced");
    const [matrix, setMatrix] = useState<Record<string, number>>(getBalancedMatrix(10));

    const presetsList = [
        {
            id: "balanced",
            name: "Balanced",
            description: "Standard mix of theoretical questions and practical scenarios. Good default.",
            getMatrix: (v: number) => getBalancedMatrix(v),
        },
        {
            id: "optimized",
            name: "Role Optimized",
            description: `Tailored for ${displayLevel} ${displayRole}. Focuses on core traits for this position.`,
            getMatrix: (v: number) => getRoleSpecificMatrix(displayRole, displayLevel, v),
        },
        {
            id: "practical",
            name: "Practical",
            description: "No simple choices. Purely deep case studies, logical patterns, and complex technical usage.",
            getMatrix: (v: number) => getPracticalMatrix(v),
        }
    ];

    const handleApplyPreset = (presetId: string, v: number = questionCount) => {
        const p = presetsList.find(x => x.id === presetId);
        if (p) {
            setMatrix(p.getMatrix(v));
            setActivePreset(presetId);
        }
    };

    const handleQuestionCountChange = (val: number) => {
        let v = val;
        if (v < 1) v = 1;
        if (v > 50) v = 50;
        setQuestionCount(v);

        if (activePreset !== "custom") {
            handleApplyPreset(activePreset, v);
        } else {
            // Keep existing matrix, don't auto-distribute to let user fix it
            // User will be forced to manually adjust to match `v`
        }
    };

    const currentSum = Object.values(matrix).reduce((a, b) => a + b, 0);
    const isSumValid = currentSum === questionCount;
    const syncedBankTypeCounts = useMemo(() => Object.entries(matrix).reduce<Partial<Record<QuestionType, number>>>((acc, [label, count]) => {
        const questionType = MATRIX_TYPE_MAP[label];
        if (questionType && count > 0) acc[questionType] = count;
        return acc;
    }, {}), [matrix]);
    const isModalReady = !!(
        targetType &&
        questionCount > 0 &&
        timeLimit > 0 &&
        isSumValid &&
        parseInt(maxParticipants || "0", 10) > 0
    );

    const router = useRouter();
    const isEmbed = embedded;

    async function handleAnalyzeJD() {
        if (!jobDescription.trim()) {
            toast.error("Invalid Input", { description: "Please enter a Job Description to analyze." });
            return;
        }

        setIsAnalyzing(true);
        try {
            const res = await fetch("/api/ai/analyze-jd", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ job_description: jobDescription }),
            });

            if (!res.ok) throw new Error("Analysis failed");

            const data = await res.json();

            if (data.is_custom_role) {
                setSelectedRole("Other");
                setCustomRole(data.job_role || "");
            } else if (data.job_role) {
                if (JOB_ROLE_NAMES.includes(data.job_role)) {
                    setSelectedRole(data.job_role);
                    setCustomRole("");
                } else {
                    setSelectedRole("Other");
                    setCustomRole(data.job_role);
                }
            }

            if (data.is_custom_level) {
                setSelectedLevel("Other");
                setCustomLevel(data.level || "");
            } else if (data.level) {
                if (LEVEL_NAMES.includes(data.level)) {
                    setSelectedLevel(data.level);
                    setCustomLevel("");
                } else {
                    setSelectedLevel("Other");
                    setCustomLevel(data.level);
                }
            }

            setSlideRoles(data.slide_roles || []);
            setCustomSlideRoles(data.custom_slide_roles || []);

            toast.success("Analysis Complete", { description: "Parameters successfully detected and applied." });
        } catch (error: unknown) {
            toast.error("Analysis Failed", { description: error instanceof Error ? error.message : "Could not auto-detect parameters. Please select manually." });
        } finally {
            setIsAnalyzing(false);
        }
    }

    async function handleEnhanceInstruction(e: React.MouseEvent) {
        e.preventDefault();
        if (!testDescription.trim()) return;

        setIsEnhancingInstruction(true);
        try {
            const res = await fetch("/api/ai/enhance-instruction", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ instruction: testDescription }),
            });

            if (!res.ok) throw new Error("Failed to enhance");

            const data = await res.json();
            if (data.enhanced) {
                setTestDescription(data.enhanced);
                if (data.preset) {
                    handleApplyPreset(data.preset, questionCount);
                }
                toast.success("Instruction Enhanced", { description: "AI has refined your instructions and selected a matching matrix preset." });
            }
        } catch (error: unknown) {
            toast.error("Enhancement Failed", { description: error instanceof Error ? error.message : "Could not enhance the instruction via AI." });
        } finally {
            setIsEnhancingInstruction(false);
        }
    }

    async function handleCreate() {
        const finalRole = selectedRole === "Other" ? customRole : selectedRole;
        const finalLevel = selectedLevel === "Other" ? customLevel : selectedLevel;

        if (!finalRole || !finalLevel) {
            toast.error("Protocol Incomplete", {
                description: "Please designate a Role and Level to initialize.",
            });
            return;
        }
        if (!isSumValid) {
            toast.error("Constraint Error", {
                description: `The sum of question types (${currentSum}) must exactly equal the set Question Count (${questionCount}). Please adjust in settings.`,
            });
            return;
        }
        setIsCreating(true);

        const matrixText = Object.entries(matrix)
            .filter(([_, count]) => count > 0)
            .map(([format, count]) => `- ${format}: ${count} questions`)
            .join("\n");

        const advancedInstructions = `\n\nQuestion Format Constraints (Total ${questionCount} questions):\n${matrixText}\nThe total sum of these MUST be exactly ${questionCount} questions.`;
        const finalDescription = (testDescription ? testDescription + "\n" : "") + advancedInstructions;

        try {
            const res = await fetch("/api/tests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: testTitle || undefined,
                    job_role: finalRole,
                    level: finalLevel,
                    job_description: jobDescription || undefined,
                    test_description: finalDescription,
                    question_count: questionCount,
                    time_limit_minutes: timeLimit,
                    max_participants: maxParticipants ? parseInt(maxParticipants) : undefined,
                    start_time: startTime ? new Date(startTime).toISOString() : undefined,
                    expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
                    target_type: targetType,
                    position_id: positionId,
                    group_id: groupId,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "System encountered an anomaly");
            }

            const data = await res.json();
            toast.success("Protocol Initialized", {
                description: "AI generation complete. Telemetry node ready.",
            });
            if (notifyOnCreated) {
                const audio = new Audio("/sound/ting.mp3");
                audio.play().catch(console.error);
            }
            if (onCreated) {
                await onCreated(data.test);
            } else {
                router.push(`/dashboard/tests/${data.test.id}`);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "System Error";
            toast.error("Initialization Failed", {
                description: message
            });
        } finally {
            setIsCreating(false);
        }
    }

    async function handleCreateFromBank(questions: BankQuestion[]) {
        // Bank flow does not require job_role/level — API defaults them when omitted.
        const finalRole = selectedRole === "Other" ? customRole : selectedRole;
        const finalLevel = selectedLevel === "Other" ? customLevel : selectedLevel;
        setIsCreating(true);
        try {
            const res = await fetch("/api/tests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: testTitle || undefined,
                    job_role: finalRole || undefined,
                    level: finalLevel || undefined,
                    job_description: jobDescription || undefined,
                    question_count: questions.length,
                    time_limit_minutes: timeLimit,
                    max_participants: maxParticipants ? parseInt(maxParticipants) : undefined,
                    start_time: startTime ? new Date(startTime).toISOString() : undefined,
                    expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
                    target_type: targetType,
                    position_id: positionId,
                    group_id: groupId,
                    bank_questions: questions,
                }),
            });
            if (!res.ok) {
                const e = await res.json();
                throw new Error(e.error || "Failed to create test");
            }
            const data = await res.json();
            toast.success("Test created from Question Bank");
            if (notifyOnCreated) {
                const audio = new Audio("/sound/ting.mp3");
                audio.play().catch(console.error);
            }
            if (onCreated) {
                await onCreated(data.test);
            } else {
                router.push(`/dashboard/tests/${data.test.id}`);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to create test";
            toast.error("Creation Failed", { description: message });
        } finally {
            setIsCreating(false);
        }
    }

    async function handlePullFromBank(config: LevelConfig) {
        setLevelConfig(config);
        setShortageProposal(null);
        setIsPulling(true);
        try {
            const res = await fetch("/api/question-bank/pull", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? "Pull failed");
            setPulledQuestions(json.questions ?? []);
            setShortageProposal(json.shortage_proposal ?? null);
            setBankStep("preview");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to pull questions");
        } finally {
            setIsPulling(false);
        }
    }

    const lastBankConfigRef = useRef<string>("");

    const handleBankConfigChange = useCallback((config: LevelConfig) => {
        const serialized = JSON.stringify(config);
        if (serialized === lastBankConfigRef.current) return;
        lastBankConfigRef.current = serialized;
        setLevelConfig(config);
    }, []);

    // Called when LevelConfigStep's applySubstitution redistributes type counts —
    // we own the matrix (Format Weights) so we must mirror back here.
    const handleSubstitutionApply = useCallback(
        (nextCounts: Partial<Record<QuestionType, number>>, newTotal: number) => {
            const reverseMap: Record<QuestionType, string> = Object.entries(MATRIX_TYPE_MAP).reduce(
                (acc, [label, qt]) => ({ ...acc, [qt]: label }),
                {} as Record<QuestionType, string>,
            );
            setMatrix((prev) => {
                const next: Record<string, number> = {};
                for (const label of Object.keys(prev)) next[label] = 0;
                for (const [qt, count] of Object.entries(nextCounts)) {
                    const label = reverseMap[qt as QuestionType];
                    if (label) next[label] = count ?? 0;
                }
                return next;
            });
            setActivePreset("custom");
            if (newTotal !== questionCount) {
                setQuestionCount(newTotal);
                setQuestionCountInput(String(newTotal));
            }
        },
        [questionCount],
    );

    function buildBankLevelConfig(confirmSubstitution = false): LevelConfig {
        const normalizedLevel = (displayLevel || "Junior").toLowerCase().startsWith("senior")
            ? "senior"
            : (displayLevel || "Junior").toLowerCase().startsWith("mid") || (displayLevel || "Junior").toLowerCase().startsWith("middle")
                ? "middle"
                : "junior";

        return {
            mode: "single",
            level: normalizedLevel,
            total: questionCount,
            type_counts: (Object.entries(syncedBankTypeCounts) as Array<[QuestionType, number | undefined]>)
                .filter(([, count]) => (count ?? 0) > 0)
                .map(([question_type, count]) => ({ question_type, count: count ?? 0 })),
            confirmSubstitution,
        };
    }

    const content = questionSource === "skills" ? (
        <CreateTestFromSkills
            onBack={() => setQuestionSource("ai")}
            embedded={isEmbed}
            onCreated={onCreated}
        />
    ) : (
        <>
            {!isEmbed && (
                <div className="flex items-center justify-between gap-4 mb-4">
                    <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Create Test" }]} />
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            onClick={() => {
                                setQuestionSource("bank");
                                setTargetType("employee");
                                setBankStep("config");
                                setIsConstraintsOpen(true);
                            }}
                            className="bg-success/15 border border-border/35 text-success hover:bg-success/25 rounded-xl h-9 px-4 gap-2"
                        >
                            <Database className="w-4 h-4" />
                            Question Bank
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setQuestionSource("skills");
                                setTargetType("employee");
                            }}
                            className="bg-primary/15 border border-border/35 text-primary hover:bg-primary/25 rounded-xl h-9 px-4 gap-2"
                        >
                            <Database className="w-4 h-4" />
                            From Skills
                        </Button>
                    </div>
                </div>
            )}
                <FadeIn className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider border border-border/20 mb-6">
                        <Bot className="w-3.5 h-3.5" />
                        Deployment Configuration
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extralight font-display text-foreground mb-4 tracking-tight">Target Parameters</h1>
                    <p className="text-muted-foreground font-light max-w-lg mx-auto text-base leading-relaxed">Define the objective constraints. Our AI engine will synthesize an origin-specific 10-question evaluation matrix.</p>
                </FadeIn>

                <div className="grid grid-cols-1 xl:grid-cols-[4fr_1px_8fr] gap-12 xl:gap-16 relative">

                    {/* Left Column: JD Input */}
                    <div className="flex flex-col gap-6">
                        <CreateTestJdInput
                            jobDescription={jobDescription}
                            setJobDescription={setJobDescription}
                            isAnalyzing={isAnalyzing}
                            onAnalyze={handleAnalyzeJD}
                        />
                    </div>

                    {/* Desktop Divider */}
                    <div className="hidden xl:block w-px relative">
                        <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" />
                    </div>

                    {/* Right Column: Roles and Grades */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Step 1: Role Selection */}
                        <CreateTestRoleGrid
                            selectedRole={selectedRole}
                            setSelectedRole={setSelectedRole}
                            slideRoles={slideRoles}
                            customSlideRoles={customSlideRoles}
                            customRole={customRole}
                            setCustomRole={setCustomRole}
                        />

                        {/* Step 2: Level Selection */}
                        <CreateTestLevelGrid
                            selectedLevel={selectedLevel}
                            setSelectedLevel={setSelectedLevel}
                            customLevel={customLevel}
                            setCustomLevel={setCustomLevel}
                        />
                    </div>
                </div>

                {/* Finalization Section */}
                <AnimatePresence>
                    {(isReady || questionSource === 'bank') && (
                        <FadeIn delay={0.1} className="mt-16 max-w-3xl mx-auto">
                            <Card className="border-border/30 bg-muted/40 backdrop-blur-2xl overflow-hidden relative shadow-2xl rounded-3xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                                <CardContent className="p-10 relative z-10">

                            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex-1 text-center md:text-left">
                                    <Label className="text-primary/60 text-xs font-mono uppercase tracking-wider mb-2 block">Synthesis Target</Label>
                                    <div className="text-2xl text-foreground font-light font-display line-clamp-2">
                                        {testTitle || (questionSource === 'bank' ? `${displayLevel || 'Junior'} Question Bank Test` : `${displayLevel} ${displayRole}`)}
                                    </div>
                                    {testTitle && (
                                        <div className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
                                            <span className="border border-border/20 text-muted-foreground bg-transparent text-xs font-medium px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                {questionSource === 'bank' ? 'Question Bank • Employee' : `${displayLevel} ${displayRole}`}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 mt-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1.5">{questionSource === 'bank' ? <Database className="w-4 h-4" /> : <Brain className="w-4 h-4" />} {questionSource === 'bank' ? 'Question Bank Pool' : 'Neural Draft Matrix'}</span>
                                        <span className="hidden sm:block w-1 h-1 rounded-full bg-muted" />
                                        <span className="font-mono flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> {questionCount} Questions</span>
                                        <span className="hidden sm:block w-1 h-1 rounded-full bg-muted" />
                                        <span className="font-mono">T-{String(timeLimit).padStart(2, '0')}:00 TIMELIMIT</span>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => questionSource === 'bank' ? handlePullFromBank(levelConfig ?? buildBankLevelConfig()) : handleCreate()}
                                    disabled={questionSource === 'bank' ? (!isSumValid || isPulling) : ((!selectedRole) || (selectedRole === 'Other' && !customRole) || (!selectedLevel) || (selectedLevel === 'Other' && !customLevel) || isCreating)}
                                    className="bg-white text-black hover:bg-foreground rounded-2xl h-14 px-10 text-base font-semibold shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all duration-300 gap-3 overflow-hidden relative group w-full md:w-auto shrink-0 border-none"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    {isCreating || isPulling ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            <span>{questionSource === 'bank' ? 'Pulling Bank...' : 'Building Matrix...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{questionSource === 'bank' ? 'Execute Generation' : 'Execute Generation'}</span>
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </div>

                            {questionSource === 'bank' && bankStep === 'preview' && levelConfig && (
                                <div className="mt-8">
                                    <QuestionPullPreview
                                        questions={pulledQuestions}
                                        config={levelConfig}
                                        shortageProposal={shortageProposal}
                                        onConfirmed={handleCreateFromBank}
                                        onAcceptSubstitution={() => handlePullFromBank({ ...levelConfig, confirmSubstitution: true })}
                                        onBack={() => setBankStep('config')}
                                    />
                                </div>
                            )}

                            {(questionSource === 'ai' || questionSource === 'bank') && (
                            <div className="mt-8 pt-6 border-t border-border/10 flex items-center justify-between">
                                {/* Notification Toggle */}
                                <div className={`flex items-center gap-3 ${questionSource === 'bank' ? 'opacity-0 pointer-events-none' : ''}`}>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={notifyOnCreated}
                                        onClick={() => setNotifyOnCreated(!notifyOnCreated)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--muted)] ${notifyOnCreated ? "bg-white" : "bg-accent"}`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-lg ring-0 transition-transform duration-200 ${notifyOnCreated ? "translate-x-5 bg-muted" : "translate-x-0 bg-white"}`}
                                        />
                                    </button>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            <Bell className="w-3 h-3" />
                                            Notification when the questionnaire is created
                                        </span>
                                        <span className={`text-[10px] mt-0.5 ${notifyOnCreated ? "text-primary" : "text-muted-foreground"}`}>
                                            {notifyOnCreated ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                                <Dialog open={isConstraintsOpen} onOpenChange={setIsConstraintsOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="bg-transparent border-border/30 text-primary hover:bg-primary/10 rounded-2xl px-6 h-12 transition-all cursor-pointer">
                                            <Settings className="w-4 h-4 mr-2" />
                                            Test Constraints & Settings
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="!max-w-[95vw] md:!max-w-[850px] lg:!max-w-[960px] w-full max-h-[88vh] bg-background/95 border border-border text-foreground rounded-[1.5rem] shadow-2xl p-0 overflow-hidden backdrop-blur-3xl">
                                        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-card/30">
                                            <div className="flex items-center justify-between">
                                                <DialogTitle className="text-xl font-display font-medium text-foreground">Test Constraints & Design</DialogTitle>
                                                <div className="flex items-center gap-2">
                                                    {questionSource === 'bank' && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => { setQuestionSource('ai'); setBankStep('config'); setIsConstraintsOpen(false); }}
                                                            className="h-7 rounded-full border-border/25 bg-primary/10 px-3 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20 hover:text-white"
                                                        >
                                                            Back to AI Generate
                                                        </Button>
                                                    )}
                                                    {isEnhancingInstruction ? (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold uppercase tracking-wider">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" /> Pending AI Rewrite
                                                        </div>
                                                    ) : isModalReady ? (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ready
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase tracking-wider">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Not Ready
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <DialogDescription className="text-muted-foreground text-[13px] mt-1.5">
                                                Configure structural boundaries, timings, and intelligence constraints for generation.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5 max-h-[calc(88vh-104px)] overflow-hidden">

                                            {/* Left Column: Settings */}
                                            <div className="p-6 space-y-6 bg-transparent overflow-y-auto custom-scrollbar">
                                                <div>
                                                    <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                                        Assessment Target
                                                    </h3>
                                                    <div className="space-y-3">
                                                        <TargetTypeSelector
                                                            value={targetType}
                                                            onChange={setTargetType}
                                                            disabled={isCreating}
                                                            allowedTypes={allowedTargetTypes}
                                                        />
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <PositionSelector
                                                                value={positionId}
                                                                onChange={setPositionId}
                                                                disabled={isCreating}
                                                            />
                                                            <GroupSelector
                                                                value={groupId}
                                                                onChange={setGroupId}
                                                                disabled={isCreating}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                                        Temporal & Boundary
                                                    </h3>
                                                    <div className="space-y-3">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide ml-1">Manual Title</Label>
                                                            <Input
                                                                type="text"
                                                                value={testTitle}
                                                                onChange={(e) => setTestTitle(e.target.value)}
                                                                placeholder="Optional display name override..."
                                                                className="bg-black/30 border-border h-10 rounded-xl text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/30 text-xs"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide ml-1">Question<span className="text-rose-500 text-base font-black ml-1 leading-none">*</span></Label>
                                                                <Input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={questionCountInput}
                                                                    onChange={(e) => {
                                                                        const raw = e.target.value.replace(/[^0-9]/g, "");
                                                                        setQuestionCountInput(raw);
                                                                        const num = parseInt(raw, 10);
                                                                        if (!isNaN(num)) handleQuestionCountChange(Math.min(50, Math.max(1, num)));
                                                                    }}
                                                                    onBlur={() => {
                                                                        const num = parseInt(questionCountInput, 10);
                                                                        const clamped = isNaN(num) ? 10 : Math.min(50, Math.max(1, num));
                                                                        setQuestionCount(clamped);
                                                                        setQuestionCountInput(String(clamped));
                                                                        handleQuestionCountChange(clamped);
                                                                    }}
                                                                    className="bg-black/30 border-border h-10 rounded-xl text-foreground focus-visible:ring-primary/30 text-xs text-center font-mono" />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide ml-1">Time (m)<span className="text-rose-500 text-base font-black ml-1 leading-none">*</span></Label>
                                                                <Input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={timeLimitInput}
                                                                    onChange={(e) => {
                                                                        const raw = e.target.value.replace(/[^0-9]/g, "");
                                                                        setTimeLimitInput(raw);
                                                                        const num = parseInt(raw, 10);
                                                                        if (!isNaN(num)) setTimeLimit(Math.min(180, Math.max(1, num)));
                                                                    }}
                                                                    onBlur={() => {
                                                                        const num = parseInt(timeLimitInput, 10);
                                                                        const clamped = isNaN(num) ? 15 : Math.min(180, Math.max(1, num));
                                                                        setTimeLimit(clamped);
                                                                        setTimeLimitInput(String(clamped));
                                                                    }}
                                                                    className="bg-black/30 border-border h-10 rounded-xl text-foreground focus-visible:ring-primary/30 text-xs text-center font-mono" />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide ml-1">Participants<span className="text-rose-500 text-base font-black ml-1 leading-none">*</span></Label>
                                                                <Input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={maxParticipants}
                                                                    onChange={(e) => {
                                                                        const raw = e.target.value.replace(/[^0-9]/g, "");
                                                                        setMaxParticipants(raw);
                                                                    }}
                                                                    onBlur={() => {
                                                                        const num = parseInt(maxParticipants, 10);
                                                                        const clamped = isNaN(num) || num < 1 ? 1 : num;
                                                                        setMaxParticipants(String(clamped));
                                                                    }}
                                                                    className="bg-black/30 border-border h-10 rounded-xl text-foreground focus-visible:ring-primary/30 text-xs text-center font-mono" />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide ml-1">Start Day</Label>
                                                                <Input type="datetime-local"
                                                                    value={startTime}
                                                                    onChange={(e) => setStartTime(e.target.value)}
                                                                    className="bg-black/30 border-border h-10 rounded-xl text-foreground text-[11px] [&::-webkit-calendar-picker-indicator]:invert px-2.5 focus-visible:ring-primary/30 cursor-pointer font-mono" />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide ml-1">Expired Day</Label>
                                                                <Input type="datetime-local"
                                                                    value={expiresAt}
                                                                    onChange={(e) => setExpiresAt(e.target.value)}
                                                                    className="bg-black/30 border-border h-10 rounded-xl text-foreground text-[11px] [&::-webkit-calendar-picker-indicator]:invert px-2.5 focus-visible:ring-primary/30 cursor-pointer font-mono" />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide ml-1">Core Instruction</Label>
                                                            <div className="relative">
                                                                <Textarea
                                                                    value={testDescription}
                                                                    onChange={(e) => setTestDescription(e.target.value)}
                                                                    placeholder="E.g. Focus on logical thinking..."
                                                                    className="bg-black/30 border-border min-h-[60px] max-h-[80px] overflow-y-auto rounded-xl text-foreground placeholder:text-muted-foreground resize-none text-[12px] pr-10 focus-visible:ring-primary/30 custom-scrollbar" />
                                                                {testDescription.trim().length > 0 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleEnhanceInstruction}
                                                                        disabled={isEnhancingInstruction}
                                                                        className="absolute bottom-1.5 right-1.5 h-6 px-2 flex items-center justify-center gap-1.5 rounded-lg bg-primary/20 hover:bg-primary/40 text-primary transition-all"
                                                                        title="Enhance with AI"
                                                                    >
                                                                        {isEnhancingInstruction ? (
                                                                            <>
                                                                                <span className="w-2.5 h-2.5 border border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin" />
                                                                                <span className="text-[10px] font-bold">Working...</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Sparkles className="w-3 h-3" />
                                                                                <span className="text-[10px] font-bold">AI Rewrite</span>
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {questionSource === 'bank' && (
                                                    <div className="pt-6 mt-2 border-t border-border">
                                                        <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                                            Question Bank Pull Settings
                                                        </h3>
                                                        <LevelConfigStep
                                                            initialTotal={questionCount}
                                                            lockTotal
                                                            hideTotal
                                                            syncedTypeCounts={syncedBankTypeCounts}
                                                            onSyncedCountsChange={handleSubstitutionApply}
                                                            hideTypePicker
                                                            hideSubmit
                                                            onConfigured={handleBankConfigChange}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Column: Question Format Breakdown */}
                                            <div className="p-6 bg-black/40 flex flex-col h-full overflow-y-auto custom-scrollbar">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">Format Weights</h3>
                                                    <div className={`px-3 py-1 rounded-full border inline-flex items-center gap-1.5 transition-all duration-500 ${isSumValid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'}`}>
                                                        <div className={`w-1 h-1 rounded-full ${isSumValid ? 'bg-emerald-500' : 'bg-rose-500 shadow-[0_0_8px_color-mix(in_srgb,var(--danger)_80%,transparent)]'}`} />
                                                        <span className="text-[9px] font-mono font-bold tracking-wider uppercase">Pool: {currentSum} / {questionCount}</span>
                                                    </div>
                                                </div>

                                                <div className="mb-4 space-y-3 shrink-0">
                                                    <div className="flex bg-background/50 p-1 rounded-xl gap-1 border border-border">
                                                        {presetsList.map(p => (
                                                            <button
                                                                key={p.id}
                                                                onClick={() => handleApplyPreset(p.id)}
                                                                className={`flex-1 text-[9px] font-bold py-1.5 rounded-lg transition-all duration-300 uppercase tracking-widest ${activePreset === p.id ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-muted-foreground hover:bg-muted'}`}
                                                            >
                                                                {p.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground bg-background/30 px-3 py-2 rounded-xl border border-border leading-relaxed min-h-[40px] flex items-center justify-center text-center italic">
                                                        {activePreset !== "custom" ? presetsList.find(p => p.id === activePreset)?.description : "Custom setup active. Exact counts will be met."}
                                                    </div>
                                                </div>

                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2">
                                                    {Object.entries(matrix).map(([formatKey, count]) => (
                                                        <div key={formatKey} className="flex items-center justify-between group bg-background/40 hover:bg-muted/60 p-1.5 pl-2.5 rounded-lg border border-border hover:border-border/20 transition-all cursor-pointer">
                                                            <Label className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors cursor-pointer w-full leading-tight pr-1" htmlFor={`matrix-${formatKey}`}>
                                                                {formatKey}
                                                            </Label>
                                                            <Input
                                                                id={`matrix-${formatKey}`}
                                                                type="number"
                                                                min={0}
                                                                max={50}
                                                                value={count}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value) || 0;
                                                                    setMatrix(prev => ({ ...prev, [formatKey]: val }));
                                                                    setActivePreset("custom");
                                                                }}
                                                                className="w-10 h-6 bg-black/60 border-border text-center text-[10px] p-0 focus-visible:ring-1 focus-visible:ring-primary/50 shrink-0 rounded-md hover:border-border/30 transition-all font-mono"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            )}
                        </CardContent>
                    </Card>
                </FadeIn>
            )}
        </AnimatePresence>




        </>
    );

    return (
        <PageTransition className={`${isEmbed ? "h-full bg-background overflow-hidden rounded-xl" : "min-h-screen bg-transparent overflow-hidden"} text-foreground font-body selection:bg-primary/30 relative`}>
            {isEmbed ? <EmbeddedPremiumBackground /> : <PremiumBackground />}

            {!isEmbed && <AppNavbar />}

            {isEmbed ? (
                <div className="relative z-10 h-full overflow-y-auto px-4 py-6">
                    {content}
                </div>
            ) : (
                <PageContainer className="relative z-10">
                    {content}
                </PageContainer>
            )}
        </PageTransition>
    );
}

function EmbeddedPremiumBackground() {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-background">
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
                style={{
                    backgroundImage: `url("/textures/noise-256x256.png")`,
                    backgroundRepeat: "repeat",
                    backgroundSize: "256px 256px",
                }}
            />
            <div className="absolute -top-[10%] -left-[10%] h-[80%] w-[80%] rounded-full bg-indigo-500/10 blur-[140px]" />
            <div className="absolute -bottom-[20%] right-0 h-[70%] w-[70%] rounded-full bg-blue-600/10 blur-[120px]" />
            <div className="absolute left-[20%] top-[30%] h-[40%] w-[40%] rounded-full bg-emerald-500/5 blur-[100px]" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute left-[20%] top-0 h-full w-px bg-gradient-to-b from-transparent via-white to-transparent" />
                <div className="absolute left-[40%] top-0 h-full w-px bg-gradient-to-b from-transparent via-white to-transparent" />
                <div className="absolute left-[60%] top-0 h-full w-px bg-gradient-to-b from-transparent via-white to-transparent" />
                <div className="absolute left-[80%] top-0 h-full w-px bg-gradient-to-b from-transparent via-white to-transparent" />
            </div>
            <div
                className="absolute inset-0 opacity-[0.07] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
                    backgroundSize: "100px 100px",
                    maskImage: "radial-gradient(ellipse at center, black, transparent 80%)",
                }}
            />
            <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />
        </div>
    );
}
