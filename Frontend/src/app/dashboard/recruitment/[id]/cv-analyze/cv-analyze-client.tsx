"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, FileText, Loader2, RefreshCw, AlertTriangle,
  Sparkles, AlertCircle, User, Briefcase, GraduationCap,
  Award, Globe, CheckCircle2, Clock, Code2, Globe2, Heart,
  Star, XCircle, Shield, TrendingUp, TrendingDown, Building2,
} from "lucide-react";
import ScoreRing from "@/components/crm/score-ring";
import OverrideScoreDialog from "@/components/recruitment/override-score-dialog";
import StatusBadge from "@/components/crm/status-badge";
import { useApplicationRealtime } from "@/hooks/use-application-realtime";
import { motion, AnimatePresence } from "framer-motion";
import type { PipelineStatus } from "@/types/recruitment";

const PIPELINE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NEW: { label: "New", color: "#3B82F6" },
  SCREENED: { label: "Screened", color: "#8B5CF6" },
  SHORTLISTED: { label: "Shortlisted", color: "#7C8FFF" },
  INTERVIEW_SCHEDULED: { label: "Interview Scheduled", color: "#F59E0B" },
  INTERVIEWED: { label: "Interviewed", color: "#F97316" },
  PASSED: { label: "Passed", color: "#22C55E" },
  FAILED: { label: "Failed", color: "#EF4444" },
  REJECTED: { label: "Rejected", color: "#6B7280" },
  OFFERED: { label: "Offered", color: "#06B6D4" },
  ACCEPTED: { label: "Accepted", color: "#10B981" },
  OFFER_REJECTED: { label: "Offer Rejected", color: "#EF4444" },
  ONBOARDED: { label: "Onboarded", color: "#22C55E" },
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
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${step.log}`]);
    }
  }, [stepIndex]);

  return (
    <div className="mt-8 w-full max-w-2xl bg-black/40 rounded-xl border border-white/5 p-4 font-mono text-[10px] text-[#5B6CF0]/80 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#5B6CF0]/30 to-transparent" />
      <div className="space-y-1">
        {logs.map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-2"
          >
            <span className="shrink-0 text-[#8B99B0] opacity-40">{">"}</span>
            {log}
          </motion.div>
        ))}
        <motion.div
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="inline-block w-2 h-3 bg-[#5B6CF0] ml-1 align-middle"
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
  STRONG_HIRE: { label: "Ưu tiên tuyển", color: "#10B981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", icon: Star },
  HIRE: { label: "Nên phỏng vấn", color: "#22C55E", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.25)", icon: CheckCircle2 },
  MAYBE: { label: "Cần cân nhắc", color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", icon: AlertCircle },
  NO_HIRE: { label: "Không phù hợp", color: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", icon: XCircle },
};

function getScoreGrade(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Xuất sắc", color: "#10B981" };
  if (score >= 75) return { label: "Tốt", color: "#22C55E" };
  if (score >= 60) return { label: "Khá", color: "#F59E0B" };
  if (score >= 40) return { label: "Trung bình", color: "#F97316" };
  return { label: "Yếu", color: "#EF4444" };
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
        style={{ backgroundColor: `${accent}20`, border: `1px solid ${accent}30` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
      </div>
      <span className="text-sm text-[#C8D0E0] w-24 shrink-0">{label}</span>
      <div className="flex-1 h-3 bg-[#0D1220] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${accent}90, ${accent})`,
            boxShadow: `0 0 10px ${accent}60`,
          }}
        />
      </div>
      <span className="text-sm font-bold tabular-nums w-8 text-right" style={{ color: accent }}>
        {Math.round(pct)}
      </span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 bg-[#222C4A] rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 bg-[#222C4A] rounded-xl" />
        <div className="h-48 bg-[#222C4A] rounded-xl" />
      </div>
      <div className="h-32 bg-[#222C4A] rounded-xl" />
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
        className="glass-card p-12 flex flex-col items-center gap-6 text-center max-w-xl mx-auto border-[#F59E0B]/20"
      >
        <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.1)]">
          <Clock className="w-8 h-8 text-[#F59E0B]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#ECF0F7] font-display">Deep Analysis is taking longer than usual</h2>
          <p className="text-sm text-[#8B99B0] mt-2 max-w-sm">
            AI is processing complex data points. You can wait a moment longer or restart the process.
          </p>
        </div>
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#7C8FFF] hover:bg-[#5B6CF0] text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
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
          className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-transparent via-[#5B6CF0]/40 to-transparent"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#121A2E_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center">
        {/* Animated Scanner Hexagon/Circle */}
        <div className="relative w-32 h-32 mb-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-[#5B6CF0]/40"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[10px] rounded-full border border-dashed border-[#B48EFF]/40"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5B6CF0] to-[#7C8FFF] flex items-center justify-center shadow-2xl shadow-blue-500/20">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          {/* Pulsing rings */}
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-2 border-[#5B6CF0]/30"
          />
        </div>

        <div className="flex flex-col items-center gap-2 mb-8">
          <h2 className="text-2xl font-display font-light tracking-tight text-[#ECF0F7]">
            Running <span className="font-semibold text-[#7C8FFF]">Deep CV Analysis</span>
          </h2>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-[#36DDAB] animate-pulse" />
            <span className="text-[10px] font-bold text-[#8B99B0] uppercase tracking-widest">Neural Layer Active</span>
          </div>
        </div>

        <div className="w-full max-w-md bg-white/5 rounded-2xl border border-white/10 p-6 backdrop-blur-xl">
          <div className="space-y-4">
            {ANALYSIS_STEPS.map((step, i) => {
              const isDone = i < stepIndex;
              const isActive = i === stepIndex;
              return (
                <div key={i} className="flex items-center gap-4 group">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isDone ? 'bg-[#36DDAB]/10 text-[#36DDAB]' : isActive ? 'bg-[#5B6CF0]/10 text-[#5B6CF0]' : 'bg-white/5 text-[#5A6882]'}`}>
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[10px] font-bold">{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${isDone ? 'text-[#36DDAB]' : isActive ? 'text-[#ECF0F7]' : 'text-[#5A6882]'}`}>
                        {step.label}
                      </span>
                      {isActive && (
                        <motion.span
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="text-[10px] font-bold text-[#7C8FFF] uppercase tracking-widest"
                        >
                          Processing...
                        </motion.span>
                      )}
                    </div>
                    {/* Tiny Progress Bar */}
                    <div className="mt-2 h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                      {isDone ? (
                        <div className="h-full w-full bg-[#36DDAB]" />
                      ) : isActive ? (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: step.durationMs / 1000 }}
                          className="h-full bg-[#5B6CF0]"
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

        <p className="mt-8 text-xs text-[#5A6882] animate-pulse">Neural engine is synthesizing professional matches...</p>
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
        <p className="text-[#EF4444] text-sm">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-lg bg-[#7C8FFF]/15 text-[#7C8FFF] text-sm hover:bg-[#7C8FFF]/25 transition-colors"
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
      <div className="glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 overflow-hidden relative group">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#5B6CF0] opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-[#8B99B0] hover:text-[#ECF0F7] hover:bg-[#5B6CF0]/20 border border-white/5 transition-all shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-display font-light text-[#ECF0F7] truncate tracking-tight">
              {person.fullName.split(' ')[0]} <span className="font-semibold">{person.fullName.split(' ').slice(1).join(' ')}</span>
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-[#5A6882] truncate">{person.email}</span>
              {jobDescription && (
                <>
                  <div className="w-1 h-1 rounded-full bg-[#5A6882] opacity-40" />
                  <p className="text-xs font-bold text-[#7C8FFF] uppercase tracking-widest truncate">
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
              className="h-11 flex items-center gap-2 px-5 rounded-xl text-sm font-semibold bg-[#121A2E] border border-white/5 text-[#ECF0F7] hover:bg-[#5B6CF0] hover:text-white transition-all disabled:opacity-50 shadow-lg shadow-black/20"
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
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#5B6CF0]/10 to-transparent rounded-full blur-3xl -mr-16 -mt-16" />

            {/* Zone A — Score ring + breakdown bars side by side */}
            <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-center">
              {/* Left: Big score ring */}
              <div className="flex flex-col items-center gap-5 lg:w-[40%] shrink-0 relative">
                <div className="flex items-center gap-2 self-start lg:self-center mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7C8FFF] animate-pulse" />
                  <span className="text-[10px] font-bold text-[#8B99B0] uppercase tracking-[0.2em]">
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
                    className="absolute inset-[-10px] rounded-full border border-dashed border-[#5B6CF0]/20 pointer-events-none"
                  />
                </div>

                <div className="flex flex-col items-center gap-3 text-center">
                  {grade && (
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-display font-light text-[#ECF0F7] tracking-tight">
                        Overall <span className="font-bold" style={{ color: grade.color }}>{grade.label}</span>
                      </span>
                      {screening.isOverridden && (
                        <span className="text-[10px] font-bold text-[#7C8FFF] uppercase tracking-widest mt-1 bg-[#7C8FFF]/10 px-2 py-0.5 rounded-md border border-[#7C8FFF]/20">
                          Adjusted by Recruiter
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    {screening.aiScore !== null && (
                      <div className="flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5 min-w-[70px]">
                        <span className="text-[10px] font-bold text-[#5A6882] uppercase">AI Pure</span>
                        <span className="text-sm font-bold text-[#ECF0F7]">{screening.aiScore}</span>
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

              <div className="w-[1px] h-48 bg-[#8B99B0]/10 hidden lg:block" />

              {/* Right: 5 breakdown bars */}
              <div className="flex-1 w-full space-y-1">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold text-[#8B99B0] uppercase tracking-[0.2em]">
                    Semantic Breakdown
                  </p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-[#36DDAB]" />
                    <span className="text-[10px] text-[#36DDAB] font-bold">Accuracy High</span>
                  </div>
                </div>
                <EnhancedScoreBar label="Kỹ năng" value={screening.skillMatchScore} icon={Code2} accent="#7C8FFF" />
                <EnhancedScoreBar label="Kinh nghiệm" value={screening.experienceMatchScore} icon={Briefcase} accent="#F59E0B" />
                <EnhancedScoreBar label="Lĩnh vực" value={screening.domainMatchScore} icon={Globe2} accent="#06B6D4" />
                <EnhancedScoreBar label="Học vấn" value={screening.educationMatchScore} icon={GraduationCap} accent="#8B5CF6" />
                <EnhancedScoreBar label="Văn hóa" value={screening.cultureFitScore} icon={Heart} accent="#EC4899" />
              </div>
            </div>

            {/* Zone B — Summary banner */}
            {screening.summary && (
              <div className="mt-10 pt-8 border-t border-white/5 relative group/summary">
                <div className="absolute top-[-10px] left-8 px-2 bg-[#1B253B] text-[10px] font-bold text-[#5B6CF0] uppercase tracking-widest">
                  Executive Summary
                </div>
                <p className="text-lg font-display font-light text-[#C8D0E0] leading-relaxed italic group-hover/summary:text-[#ECF0F7] transition-colors">
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
                      <Sparkles className="w-12 h-12 text-[#F59E0B]" />
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                      </div>
                      <h3 className="text-sm font-bold text-[#ECF0F7] font-display uppercase tracking-widest">
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
                          className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#F59E0B]/30 transition-all group/item"
                        >
                          <div className="w-6 h-6 rounded-lg bg-[#121A2E] border border-white/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-[#F59E0B]">
                            0{i + 1}
                          </div>
                          <span className="text-sm text-[#C8D0E0] leading-relaxed group-hover/item:text-[#ECF0F7] transition-colors">{h}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                {(screening.missingRequirements?.length ?? 0) > 0 && (
                  <div className="glass-card p-8 relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                      <AlertTriangle className="w-12 h-12 text-[#F97316]" />
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-[#F97316]" />
                      </div>
                      <h3 className="text-sm font-bold text-[#ECF0F7] font-display uppercase tracking-widest">
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
                          className="flex items-center gap-3 py-3 px-4 rounded-xl bg-white/5 border border-white/5"
                        >
                          <AlertCircle className="w-4 h-4 text-[#F97316] shrink-0" />
                          <span className="text-sm text-[#C8D0E0] leading-relaxed">{m}</span>
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
                    <div className="w-8 h-8 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                    </div>
                    <h3 className="text-sm font-bold text-[#22C55E] uppercase tracking-widest">
                      Primary Strengths
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {(screening.strengthsJson ?? []).map((s, i) => (
                      <div key={i} className="group/item">
                        <div className="flex items-start gap-4">
                          <div className="w-5 h-5 rounded-full bg-[#22C55E]/20 border border-[#22C55E]/30 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform">
                            <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />
                          </div>
                          <span className="text-sm text-[#C8D0E0] leading-relaxed group-hover/item:text-[#ECF0F7] transition-colors">{s}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass-card p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-[#EF4444]" />
                    </div>
                    <h3 className="text-sm font-bold text-[#EF4444] uppercase tracking-widest">
                      Potential Risks
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {(screening.weaknessesJson ?? []).map((w, i) => (
                      <div key={i} className="group/item">
                        <div className="flex items-start gap-4">
                          <div className="w-5 h-5 rounded-full bg-[#EF4444]/20 border border-[#EF4444]/30 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform">
                            <XCircle className="w-3 h-3 text-[#EF4444]" />
                          </div>
                          <span className="text-sm text-[#C8D0E0] leading-relaxed group-hover/item:text-[#ECF0F7] transition-colors">{w}</span>
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
                <Shield className="w-48 h-48 text-[#5B6CF0]" />
              </div>

              <div className="flex items-center justify-between mb-8 relative z-10">
                <h2 className="text-xl font-display font-light text-[#ECF0F7] flex items-center gap-4 tracking-tight">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5B6CF0] to-[#7C8FFF] flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  Extracted <span className="font-semibold text-[#7C8FFF]">Semantic Hub</span>
                </h2>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#36DDAB]/5 border border-[#36DDAB]/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#36DDAB] animate-pulse" />
                    <span className="text-[10px] font-bold text-[#36DDAB] uppercase tracking-[0.15em]">Neural Confidence: High</span>
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 relative z-10">
                {[
                  { icon: Briefcase, label: "Current Title", value: parsedCvJson.current_title as string | undefined, accent: "#7C8FFF" },
                  { icon: Building2, label: "Major Enterprise", value: parsedCvJson.current_company as string | undefined, accent: "#06B6D4" },
                  {
                    icon: Award,
                    label: "Professional Tenure",
                    value: parsedCvJson.total_years_experience != null
                      ? `${String(parsedCvJson.total_years_experience)} Combined Years`
                      : undefined,
                    accent: "#F59E0B"
                  },
                  { icon: Globe, label: "Geographic Hub", value: parsedCvJson.location as string | undefined, accent: "#8B5CF6" },
                ]
                  .filter((f) => Boolean(f.value))
                  .map(({ icon: Icon, label, value, accent }) => (
                    <div
                      key={label}
                      className="p-5 rounded-2xl bg-[#121A2E]/50 border border-white/5 hover:border-white/10 transition-all hover:translate-y-[-2px]"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
                          <Icon className="w-4 h-4" style={{ color: accent }} />
                        </div>
                        <span className="text-[10px] text-[#5A6882] font-bold uppercase tracking-widest">{label}</span>
                      </div>
                      <span className="text-sm font-semibold text-[#ECF0F7] block leading-snug">{String(value)}</span>
                    </div>
                  ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-white/5 relative z-10">
                {/* Skills Column */}
                {Array.isArray(parsedCvJson.skills) && parsedCvJson.skills.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-5">
                      <Code2 className="w-4 h-4 text-[#5B6CF0]" />
                      <h3 className="text-[10px] font-bold text-[#8B99B0] uppercase tracking-[0.2em]">Validated Skill Matrix</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(parsedCvJson.skills as string[]).map((skill, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[#7C8FFF] text-xs font-semibold hover:border-[#5B6CF0]/40 hover:bg-[#5B6CF0]/5 transition-all cursor-default"
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
                      <GraduationCap className="w-4 h-4 text-[#8B5CF6]" />
                      <h3 className="text-[10px] font-bold text-[#8B99B0] uppercase tracking-[0.2em]">Academic Lineage</h3>
                    </div>
                    <div className="space-y-4">
                      {(parsedCvJson.education as Array<Record<string, string>>).map((edu, i) => (
                        <div key={i} className="pl-4 border-l-2 border-[#8B5CF6]/20 relative">
                          <div className="absolute top-0 left-[-5px] w-2 h-2 rounded-full bg-[#8B5CF6] shadow-[0_0_8px_#8B5CF6]" />
                          <h4 className="text-sm font-bold text-[#ECF0F7] leading-tight">
                            {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                          </h4>
                          <p className="text-xs text-[#5A6882] mt-1 font-medium">
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
            <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#C8D0E0]">CV Analysis thất bại</p>
              <p className="text-xs text-[#5A6882] mt-1">Có lỗi xảy ra khi AI xử lý CV. Bạn có thể thử lại.</p>
            </div>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C8FFF]/15 hover:bg-[#7C8FFF]/25 text-[#7C8FFF] text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
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
            <p className="text-sm text-[#5A6882]">Chưa có kết quả sàng lọc.</p>
            {!jobDescription && (
              <p className="text-xs text-[#F59E0B]">
                ⚠ Cần gán Job Description trước khi chạy CV Analysis.
              </p>
            )}
            {["hr", "interviewer", "admin", "super_admin"].includes(userRole) && (
              <button
                onClick={handleRetry}
                disabled={isRetrying || !jobDescription}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C8FFF]/15 hover:bg-[#7C8FFF]/25 text-[#7C8FFF] text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
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
