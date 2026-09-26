"use client";
import { alpha } from "@/lib/utils";
import { toneAt, toneFor } from "@/lib/ui/tones";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, FileText, Loader2, RefreshCw, AlertTriangle,
  Sparkles, AlertCircle, User, Briefcase, GraduationCap,
  Award, Globe, CheckCircle2, Clock, Code2, Globe2, Heart,
  Star, XCircle, Shield, TrendingDown, Building2,
} from "lucide-react";
import ScoreRing from "@/components/crm/score-ring";
import OverrideScoreDialog from "@/components/recruitment/override-score-dialog";
import StatusBadge from "@/components/crm/status-badge";
import { useApplicationRealtime } from "@/hooks/use-application-realtime";
import { motion, AnimatePresence } from "framer-motion";
import type { PipelineStatus } from "@/types/recruitment";

const PIPELINE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NEW: { label: "New", color: "var(--primary)" },
  SCREENED: { label: "Screened", color: "var(--ai)" },
  SHORTLISTED: { label: "Shortlisted", color: "var(--primary)" },
  INTERVIEW_SCHEDULED: { label: "Interview Scheduled", color: "var(--warning)" },
  INTERVIEWED: { label: "Interviewed", color: "var(--warning)" },
  PASSED: { label: "Passed", color: "var(--success)" },
  FAILED: { label: "Failed", color: "var(--danger)" },
  REJECTED: { label: "Rejected", color: "var(--muted-foreground)" },
  OFFERED: { label: "Offered", color: "var(--primary)" },
  ACCEPTED: { label: "Accepted", color: "var(--success)" },
  OFFER_REJECTED: { label: "Offer Rejected", color: "var(--danger)" },
  ONBOARDED: { label: "Onboarded", color: "var(--success)" },
};

interface ApplicationData {
  application: {
    id: string;
    pipelineStatus: PipelineStatus;
    createdAt: string;
    createdBy: string | null;
  };
  person: {
    id: string;
    fullName: string;
    email: string;
    type: string | null;
    source: string | null;
  };
  jobDescription: { id: string; title: string; department: string | null } | null;
  cv: {
    id: string;
    parseStatus: string;
    originalFilename: string;
    mimeType: string;
    retryCount: number;
  } | null;
  screening: {
    id: string;
    aiScore: number | null;
    finalScore: number | null;
    skillMatchScore: number | null;
    experienceMatchScore: number | null;
    domainMatchScore: number | null;
    educationMatchScore: number | null;
    cultureFitScore: number | null;
    strengthsJson: string[] | null;
    weaknessesJson: string[] | null;
    summary: string | null;
    recommendation: string | null;
    keyHighlights: string[] | null;
    missingRequirements: string[] | null;
    parsedCvJson: Record<string, unknown> | null;
    isOverridden: boolean;
    overrideReason: string | null;
    overriddenAt: string | null;
    screenedAt: string;
  } | null;
  history: Array<{
    id: string;
    fromStatus: PipelineStatus | null;
    toStatus: PipelineStatus;
    changedBy: string | null;
    changedAt: string;
    note: string | null;
  }>;
}

interface Props {
  id: string;
  userRole: string;
}

const CAN_OVERRIDE = ["hr", "interviewer", "admin", "super_admin"];

const ANALYSIS_STEPS = [
  { label: "Initializing Neural Modules", durationMs: 2000, log: "Booting AI analysis engine..." },
  { label: "CV Data Extraction", durationMs: 4000, log: "Parsing PDF structure and extracting semantic layers..." },
  { label: "Semantic Analysis", durationMs: 6000, log: "Mapping candidate skills to requirements..." },
  { label: "Scoring & Evaluation", durationMs: 15000, log: "Analyzing experience longevity and domain relevance..." },
  { label: "Compiling Insights", durationMs: 4000, log: "Generating strengths and weaknesses report..." },
];

function TechnicalLog({ stepIndex }: { stepIndex: number }) {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (stepIndex < ANALYSIS_STEPS.length) {
      const step = ANALYSIS_STEPS[stepIndex];
      const frame = requestAnimationFrame(() => {
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${step.log}`]);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [stepIndex]);

  return (
    <div className="mt-8 w-full max-w-2xl bg-muted rounded-xl border border-border p-4 font-mono text-[10px] text-primary/80 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="space-y-1">
        {logs.map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-2"
          >
            <span className="shrink-0 text-muted-foreground opacity-40">{">"}</span>
            {log}
          </motion.div>
        ))}
        <motion.div
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="inline-block w-2 h-3 bg-primary ml-1 align-middle"
        />
      </div>
    </div>
  );
}

const STUCK_TIMEOUT_MS = 3 * 60 * 1000;

const RECOMMENDATION_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  STRONG_HIRE: { label: "Ưu tiên tuyển", color: "var(--success)", bg: "color-mix(in srgb, var(--success) 8%, transparent)", border: "color-mix(in srgb, var(--success) 25%, transparent)", icon: Star },
  HIRE: { label: "Nên phỏng vấn", color: "var(--success)", bg: "color-mix(in srgb, var(--success) 8%, transparent)", border: "color-mix(in srgb, var(--success) 25%, transparent)", icon: CheckCircle2 },
  MAYBE: { label: "Cần cân nhắc", color: "var(--warning)", bg: "color-mix(in srgb, var(--warning) 8%, transparent)", border: "color-mix(in srgb, var(--warning) 25%, transparent)", icon: AlertCircle },
  NO_HIRE: { label: "Không phù hợp", color: "var(--danger)", bg: "color-mix(in srgb, var(--danger) 8%, transparent)", border: "color-mix(in srgb, var(--danger) 25%, transparent)", icon: XCircle },
};

function getScoreGrade(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Xuất sắc", color: "var(--success)" };
  if (score >= 75) return { label: "Tốt", color: "var(--success)" };
  if (score >= 60) return { label: "Khá", color: "var(--warning)" };
  if (score >= 40) return { label: "Trung bình", color: "var(--warning)" };
  return { label: "Yếu", color: "var(--danger)" };
}

interface EnhancedScoreBarProps {
  label: string;
  value: number | null;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: string;
}

function EnhancedScoreBar({ label, value, icon: Icon, accent }: EnhancedScoreBarProps) {
  const pct = Math.min(Math.max(value ?? 0, 0), 100);
  return (
    <div className="flex items-center gap-3 py-2">
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${alpha(accent, 13)}`, border: `1px solid ${alpha(accent, 19)}` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
      </div>
      <span className="text-sm text-foreground w-24 shrink-0">{label}</span>
      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: alpha(accent, 12) }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${alpha(accent, 56)}, ${accent})`,
            boxShadow: `0 0 10px ${alpha(accent, 38)}`,
          }}
        />
      </div>
      <span className="text-sm font-bold tabular-nums w-8 text-right text-foreground">
        {value === null || value === undefined ? <span className="text-muted-foreground">–</span> : Math.round(pct)}
      </span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 bg-accent rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 bg-accent rounded-xl" />
        <div className="h-48 bg-accent rounded-xl" />
      </div>
      <div className="h-32 bg-accent rounded-xl" />
    </div>
  );
}

interface AnalysisLoadingCardProps {
  isStuck: boolean;
  onRetry: () => void;
  isRetrying: boolean;
}

function AnalysisLoadingCard({ isStuck, onRetry, isRetrying }: AnalysisLoadingCardProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (isStuck) return;
    if (stepIndex >= ANALYSIS_STEPS.length - 1) return;
    const timer = setTimeout(() => {
      setStepIndex((prev) => Math.min(prev + 1, ANALYSIS_STEPS.length - 1));
    }, ANALYSIS_STEPS[stepIndex].durationMs);
    return () => clearTimeout(timer);
  }, [stepIndex, isStuck]);

  if (isStuck) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-12 flex flex-col items-center gap-6 text-center max-w-xl mx-auto border-warning/20"
      >
        <div className="w-16 h-16 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center shadow-[0_0_20px_color-mix(in_srgb,var(--warning)_10%,transparent)]">
          <Clock className="w-8 h-8 text-warning" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground font-display">Deep Analysis is taking longer than usual</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            AI is processing complex data points. You can wait a moment longer or restart the process.
          </p>
        </div>
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
          {isRetrying ? "Restarting Analysis..." : "Restart CV Analysis"}
        </button>
      </motion.div>
    );
  }

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Scanning Effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: ["0%", "100%", "0%"] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-transparent via-primary/40 to-transparent"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center">
        {/* Animated Scanner Hexagon/Circle */}
        <div className="relative w-32 h-32 mb-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-primary/40"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[10px] rounded-full border border-dashed border-ai/40"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary flex items-center justify-center shadow-2xl shadow-blue-500/20">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          {/* Pulsing rings */}
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-2 border-primary/30"
          />
        </div>

        <div className="flex flex-col items-center gap-2 mb-8">
          <h2 className="text-2xl font-display font-light tracking-tight text-foreground">
            Running <span className="font-semibold text-primary">Deep CV Analysis</span>
          </h2>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Neural Layer Active</span>
          </div>
        </div>

        <div className="w-full max-w-md bg-muted rounded-2xl border border-border p-6 backdrop-blur-xl">
          <div className="space-y-4">
            {ANALYSIS_STEPS.map((step, i) => {
              const isDone = i < stepIndex;
              const isActive = i === stepIndex;
              return (
                <div key={i} className="flex items-center gap-4 group">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isDone ? 'bg-success/10 text-success' : isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[10px] font-bold">{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${isDone ? 'text-success' : isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                      </span>
                      {isActive && (
                        <motion.span
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="text-[10px] font-bold text-primary uppercase tracking-widest"
                        >
                          Processing...
                        </motion.span>
                      )}
                    </div>
                    {/* Tiny Progress Bar */}
                    <div className="mt-2 h-[2px] w-full bg-muted rounded-full overflow-hidden">
                      {isDone ? (
                        <div className="h-full w-full bg-success" />
                      ) : isActive ? (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: step.durationMs / 1000 }}
                          className="h-full bg-primary"
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Technical Log Console */}
        <TechnicalLog stepIndex={stepIndex} />

        <p className="mt-8 text-xs text-muted-foreground animate-pulse">Neural engine is synthesizing professional matches...</p>
      </div>
    </div>
  );
}

export default function CvAnalyzeClient({ id, userRole }: Props) {
  const router = useRouter();
  const [data, setData] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isStuck, setIsStuck] = useState(false);

  const realtime = useApplicationRealtime(id);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recruitment/applications/${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? "Failed to load application.");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stuck detection: 3 minutes of PENDING/PROCESSING with no screening
  useEffect(() => {
    if (!data) return;
    const isAnalyzing =
      !data.screening &&
      (data.cv?.parseStatus === "PENDING" || data.cv?.parseStatus === "PROCESSING");
    if (!isAnalyzing) {
      setIsStuck(false);
      return;
    }
    const timer = setTimeout(() => setIsStuck(true), STUCK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [data]);

  // Sync realtime score updates → re-fetch for full data
  useEffect(() => {
    if (!realtime.aiScore || !data) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtime.aiScore, realtime.pipelineStatus]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    setIsStuck(false);
    try {
      const res = await fetch(`/api/recruitment/applications/${id}/cv-analysis`, {
        method: "POST",
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error((b as { error?: string }).error ?? "Failed");
      }
      await fetchData();
    } catch {
      // silent — realtime will update when done
    } finally {
      setIsRetrying(false);
    }
  }, [id, fetchData]);

  // Auto-trigger when CV is PENDING (e.g. fire-and-forget from upload failed)
  useEffect(() => {
    if (!data || data.screening) return;
    if (data.cv?.parseStatus === "PENDING") {
      handleRetry();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.cv?.parseStatus]);

  const handleCvPreview = async () => {
    if (!data?.cv?.id) return;
    setCvLoading(true);
    try {
      const res = await fetch(`/api/recruitment/cv/${data.cv.id}`);
      if (res.ok) {
        const { signedUrl } = await res.json();
        window.open(signedUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setCvLoading(false);
    }
  };

  const handleOverrideSuccess = (finalScore: number) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        screening: prev.screening
          ? {
            ...prev.screening,
            finalScore,
            isOverridden: true,
            overriddenAt: new Date().toISOString(),
          }
          : prev.screening,
      };
    });
  };

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center py-20 gap-4">
        <p className="text-danger text-sm">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-lg bg-primary/15 text-primary text-sm hover:bg-primary/25 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { application, person, screening, cv, jobDescription } = data;
  const pipelineStatus = realtime.pipelineStatus ?? application.pipelineStatus;
  const isAnalyzing =
    !screening &&
    (cv?.parseStatus === "PENDING" || cv?.parseStatus === "PROCESSING");

  // Derived display values for screening
  const displayScore = screening
    ? (screening.isOverridden ? screening.finalScore : screening.aiScore)
    : null;
  const hasScore = displayScore !== null && displayScore !== undefined;
  const grade = hasScore ? getScoreGrade(displayScore as number) : null;
  const recConfig = screening?.recommendation ? RECOMMENDATION_CONFIG[screening.recommendation] : null;
  const RecIcon = recConfig?.icon;
  const parsedCvJson = screening?.parsedCvJson ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      {/* Section 1 — Header card */}
      <div className="glass-card p-6 pt-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-1.5" style={{ background: `linear-gradient(90deg, ${toneFor(person.fullName).mark}, var(--primary))` }} />
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/20 border border-border transition-all shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="w-12 h-12 shrink-0 rounded-2xl grid place-items-center text-base font-black"
                style={{ color: toneFor(person.fullName).ink, backgroundColor: toneFor(person.fullName).bg }}>
            {person.fullName.trim().split(/\s+/).map((w) => w[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join("").toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl md:text-3xl font-black leading-tight tracking-tight text-foreground">{person.fullName}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-muted-foreground truncate">{person.email}</span>
              {jobDescription && (
                <>
                  <div className="w-1 h-1 rounded-full bg-muted-foreground opacity-40" />
                  <p className="text-xs font-bold text-primary uppercase tracking-widest truncate">
                    {jobDescription.title}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge status={pipelineStatus} config={PIPELINE_STATUS_CONFIG} />
          {cv && (
            <button
              onClick={handleCvPreview}
              disabled={cvLoading}
              className="h-11 flex items-center gap-2 px-5 rounded-xl text-sm font-semibold bg-background border border-border text-foreground hover:bg-primary hover:text-white transition-all disabled:opacity-50 shadow-sm"
            >
              {cvLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {cv.originalFilename ?? "Xem CV"}
            </button>
          )}
          {CAN_OVERRIDE.includes(userRole) && screening && (
            <OverrideScoreDialog
              applicationId={id}
              currentFinalScore={screening.finalScore}
              onSuccess={handleOverrideSuccess}
            />
          )}
        </div>
      </div>

      {/* Scoring results */}
      {screening ? (
        <>
          {/* Section 2 — Main Analysis Report Card */}
          <div className="glass-card p-8 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -mr-16 -mt-16" />

            {/* Zone A — Score ring + breakdown bars side by side */}
            <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-center">
              {/* Left: Big score ring */}
              <div className="flex flex-col items-center gap-5 lg:w-[40%] shrink-0 relative rounded-2xl py-6"
                   style={{ backgroundColor: `color-mix(in srgb, ${grade?.color ?? "var(--primary)"} 7%, var(--card))` }}>
                <div className="flex items-center gap-2 self-start lg:self-center mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    Neural Ranking Score
                  </span>
                </div>

                <div className="relative group/ring">
                  <ScoreRing value={displayScore as number} size={180} fontSizeRatio={0.2} label="" />
                  <div
                    className="absolute inset-0 rounded-full blur-3xl opacity-10 group-hover/ring:opacity-30 transition-opacity pointer-events-none"
                    style={{ backgroundColor: grade?.color }}
                  />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-10px] rounded-full border border-dashed border-primary/20 pointer-events-none"
                  />
                </div>

                <div className="flex flex-col items-center gap-3 text-center">
                  {grade && (
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold text-foreground tracking-tight">
                        Overall <span className="font-bold" style={{ color: grade.color }}>{grade.label}</span>
                      </span>
                      {screening.isOverridden && (
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1 bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                          Adjusted by Recruiter
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    {screening.aiScore !== null && (
                      <div className="flex flex-col items-center p-2 rounded-xl bg-muted border border-border min-w-[70px]">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">AI Pure</span>
                        <span className="text-sm font-bold text-foreground">{screening.aiScore}</span>
                      </div>
                    )}
                    {recConfig && RecIcon && (
                      <div
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-transform hover:scale-105"
                        style={{
                          color: recConfig.color,
                          backgroundColor: recConfig.bg,
                          border: `1px solid ${recConfig.border}`,
                        }}
                      >
                        <RecIcon className="w-4 h-4" />
                        {recConfig.label}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-[1px] h-48 bg-muted-foreground/10 hidden lg:block" />

              {/* Right: 5 breakdown bars */}
              <div className="flex-1 w-full space-y-1">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    Semantic Breakdown
                  </p>

                </div>
                <EnhancedScoreBar label="Kỹ năng" value={screening.skillMatchScore} icon={Code2} accent={toneAt(0).mark} />
                <EnhancedScoreBar label="Kinh nghiệm" value={screening.experienceMatchScore} icon={Briefcase} accent={toneAt(1).mark} />
                <EnhancedScoreBar label="Lĩnh vực" value={screening.domainMatchScore} icon={Globe2} accent={toneAt(2).mark} />
                <EnhancedScoreBar label="Học vấn" value={screening.educationMatchScore} icon={GraduationCap} accent={toneAt(3).mark} />
                <EnhancedScoreBar label="Văn hóa" value={screening.cultureFitScore} icon={Heart} accent={toneAt(4).mark} />
              </div>
            </div>

            {/* Zone B — Summary banner */}
            {screening.summary && (
              <div className="mt-10 pt-8 border-t border-border relative group/summary">
                <div className="absolute top-[-10px] left-8 px-2 bg-muted text-[10px] font-bold text-primary uppercase tracking-widest">
                  Executive Summary
                </div>
                <p className="text-lg text-foreground leading-relaxed group-hover/summary:text-foreground transition-colors">
                  &ldquo;{screening.summary}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Section 3 — Key Highlights & Missing Requirements */}
          {((screening.keyHighlights?.length ?? 0) > 0 ||
            (screening.missingRequirements?.length ?? 0) > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(screening.keyHighlights?.length ?? 0) > 0 && (
                  <div className="glass-card p-8 relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                      <Sparkles className="w-12 h-12 text-warning" />
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-warning" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground font-display uppercase tracking-widest">
                        Strategic Highlights
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {(screening.keyHighlights ?? []).map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-4 p-4 rounded-2xl bg-muted border border-border hover:border-warning/30 transition-all group/item"
                        >
                          <div className="w-6 h-6 rounded-lg bg-background border border-border flex items-center justify-center shrink-0 text-[10px] font-bold text-warning">
                            0{i + 1}
                          </div>
                          <span className="text-sm text-foreground leading-relaxed group-hover/item:text-foreground transition-colors">{h}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                {(screening.missingRequirements?.length ?? 0) > 0 && (
                  <div className="glass-card p-8 relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                      <AlertTriangle className="w-12 h-12 text-warning" />
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground font-display uppercase tracking-widest">
                        Critical Gaps
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {(screening.missingRequirements ?? []).map((m, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-3 py-3 px-4 rounded-xl bg-muted border border-border"
                        >
                          <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                          <span className="text-sm text-foreground leading-relaxed">{m}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Section 4 — Strengths & Weaknesses */}
          {((screening.strengthsJson?.length ?? 0) > 0 ||
            (screening.weaknessesJson?.length ?? 0) > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    </div>
                    <h3 className="text-sm font-bold text-success uppercase tracking-widest">
                      Primary Strengths
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {(screening.strengthsJson ?? []).map((s, i) => (
                      <div key={i} className="group/item">
                        <div className="flex items-start gap-4">
                          <div className="w-5 h-5 rounded-full bg-success/20 border border-success/30 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform">
                            <CheckCircle2 className="w-3 h-3 text-success" />
                          </div>
                          <span className="text-sm text-foreground leading-relaxed group-hover/item:text-foreground transition-colors">{s}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass-card p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-danger" />
                    </div>
                    <h3 className="text-sm font-bold text-danger uppercase tracking-widest">
                      Potential Risks
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {(screening.weaknessesJson ?? []).map((w, i) => (
                      <div key={i} className="group/item">
                        <div className="flex items-start gap-4">
                          <div className="w-5 h-5 rounded-full bg-danger/20 border border-danger/30 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform">
                            <XCircle className="w-3 h-3 text-danger" />
                          </div>
                          <span className="text-sm text-foreground leading-relaxed group-hover/item:text-foreground transition-colors">{w}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          {/* Section 5 — Semantic Data Hub */}
          {parsedCvJson && Object.keys(parsedCvJson).length > 0 && (
            <div className="glass-card p-8 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <Shield className="w-48 h-48 text-primary" />
              </div>

              <div className="flex items-center justify-between mb-8 relative z-10">
                <h2 className="text-xl font-display font-light text-foreground flex items-center gap-4 tracking-tight">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  Extracted <span className="font-semibold text-primary">Semantic Hub</span>
                </h2>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-success/5 border border-success/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] font-bold text-success uppercase tracking-[0.15em]">Neural Confidence: High</span>
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 relative z-10">
                {[
                  { icon: Briefcase, label: "Current Title", value: parsedCvJson.current_title as string | undefined, accent: "var(--primary)" },
                  { icon: Building2, label: "Major Enterprise", value: parsedCvJson.current_company as string | undefined, accent: "var(--primary)" },
                  {
                    icon: Award,
                    label: "Professional Tenure",
                    value: parsedCvJson.total_years_experience != null
                      ? `${String(parsedCvJson.total_years_experience)} Combined Years`
                      : undefined,
                    accent: "var(--warning)"
                  },
                  { icon: Globe, label: "Geographic Hub", value: parsedCvJson.location as string | undefined, accent: "var(--ai)" },
                ]
                  .filter((f) => Boolean(f.value))
                  .map(({ icon: Icon, label, value, accent }) => (
                    <div
                      key={label}
                      className="p-5 rounded-2xl bg-background/50 border border-border hover:border-border transition-all hover:translate-y-[-2px]"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${alpha(accent, 8)}` }}>
                          <Icon className="w-4 h-4" style={{ color: accent }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{label}</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground block leading-snug">{String(value)}</span>
                    </div>
                  ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-border relative z-10">
                {/* Skills Column */}
                {Array.isArray(parsedCvJson.skills) && parsedCvJson.skills.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-5">
                      <Code2 className="w-4 h-4 text-primary" />
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Validated Skill Matrix</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(parsedCvJson.skills as string[]).map((skill, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-xl bg-muted border border-border text-primary text-xs font-semibold hover:border-primary/40 hover:bg-primary/5 transition-all cursor-default"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education Column */}
                {Array.isArray(parsedCvJson.education) && parsedCvJson.education.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-5">
                      <GraduationCap className="w-4 h-4 text-ai" />
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Academic Lineage</h3>
                    </div>
                    <div className="space-y-4">
                      {(parsedCvJson.education as Array<Record<string, string>>).map((edu, i) => (
                        <div key={i} className="pl-4 border-l-2 border-ai/20 relative">
                          <div className="absolute top-0 left-[-5px] w-2 h-2 rounded-full bg-ai shadow-[0_0_8px_var(--ai)]" />
                          <h4 className="text-sm font-bold text-foreground leading-tight">
                            {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 font-medium">
                            {edu.school}{edu.year ? ` • Class of ${edu.year}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : cv?.parseStatus === "FAILED" ? (
        <div className="glass-card p-5">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">CV Analysis thất bại</p>
              <p className="text-xs text-muted-foreground mt-1">Có lỗi xảy ra khi AI xử lý CV. Bạn có thể thử lại.</p>
            </div>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
              {isRetrying ? "Đang thử lại..." : "Thử lại CV Analysis"}
            </button>
          </div>
        </div>
      ) : isAnalyzing ? (
        <AnalysisLoadingCard isStuck={isStuck} onRetry={handleRetry} isRetrying={isRetrying} />
      ) : (
        <div className="glass-card p-5">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-muted-foreground">Chưa có kết quả sàng lọc.</p>
            {!jobDescription && (
              <p className="text-xs text-warning">
                ⚠ Cần gán Job Description trước khi chạy CV Analysis.
              </p>
            )}
            {["hr", "interviewer", "admin", "super_admin"].includes(userRole) && (
              <button
                onClick={handleRetry}
                disabled={isRetrying || !jobDescription}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                {isRetrying ? "Đang xử lý..." : "Bắt đầu CV Analysis"}
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
