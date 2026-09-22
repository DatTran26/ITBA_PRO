"use client";
import { alpha } from "@/lib/utils";

import { useState, useRef, useEffect } from "react";
import ScoreRing from "@/components/crm/score-ring";
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Star,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Code2,
  Briefcase,
  Globe2,
  GraduationCap,
  Heart,
  Pencil,
  Loader2,
} from "lucide-react";

interface ScoreCardProps {
  aiScore: number | null;
  finalScore: number | null;
  isOverridden: boolean;
  overriddenBy?: string;
  overriddenAt?: string;
  recommendation?: string | null;
  summary?: string | null;
  skillMatchScore: number | null;
  experienceMatchScore: number | null;
  domainMatchScore: number | null;
  educationMatchScore: number | null;
  cultureFitScore: number | null;
  onInlineOverride?: (newScore: number) => Promise<boolean>;
  canInlineOverride?: boolean;
}

const RECOMMENDATION_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
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
  const hasValue = value !== null && value !== undefined;
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
      <div className="flex-1 h-3 bg-background rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: hasValue ? `${pct}%` : "0%",
            background: hasValue ? `linear-gradient(90deg, ${alpha(accent, 56)}, ${accent})` : "transparent",
            boxShadow: hasValue ? `0 0 10px ${alpha(accent, 38)}` : "none",
          }}
        />
      </div>
      <span className="text-sm font-bold tabular-nums w-8 text-right" style={{ color: hasValue ? accent : "var(--muted-foreground)" }}>
        {hasValue ? Math.round(pct) : "—"}
      </span>
    </div>
  );
}

export default function ScoreCard({
  aiScore,
  finalScore,
  isOverridden,
  overriddenAt,
  recommendation,
  summary,
  skillMatchScore,
  experienceMatchScore,
  domainMatchScore,
  educationMatchScore,
  cultureFitScore,
  onInlineOverride,
  canInlineOverride,
}: ScoreCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editScore, setEditScore] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (!editScore || isSubmitting) return;
    const num = Number(editScore);
    if (isNaN(num) || num < 0 || num > 100) return;

    setIsSubmitting(true);
    if (onInlineOverride) {
      const success = await onInlineOverride(num);
      if (success) {
        setIsEditing(false);
      }
    }
    setIsSubmitting(false);
  };
  const displayScore = isOverridden ? finalScore : aiScore;
  const hasScore = displayScore !== null && displayScore !== undefined;
  const grade = hasScore ? getScoreGrade(displayScore as number) : null;
  const recConfig = recommendation ? RECOMMENDATION_CONFIG[recommendation] : null;
  const RecIcon = recConfig?.icon;

  const validScores = [skillMatchScore, experienceMatchScore, domainMatchScore, educationMatchScore, cultureFitScore].filter(
    (s): s is number => typeof s === "number"
  );
  const avg = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : null;
  const avgColor = avg !== null ? getScoreGrade(avg).color : "var(--muted-foreground)";

  return (
    <div className="glass-card p-6 w-full">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Left: Big score ring */}
        <div className="flex flex-col items-center gap-3 sm:w-[35%] shrink-0">
          <div className="flex items-center justify-between w-full mb-1 min-h-(1.5rem)">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary drop-shadow-[0_0_5px_color-mix(in_srgb,var(--primary)_50%,transparent)]" />
              <span className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary uppercase tracking-widest mt-0.5 drop-shadow-[0_0_5px_color-mix(in_srgb,var(--primary)_30%,transparent)]">
                AI SCORE
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isOverridden && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-ai/15 border border-ai/40 text-ai text-[10px] font-bold tracking-wider shadow-[0_0_10px_color-mix(in_srgb,var(--ai)_20%,transparent)]">
                  Đã điều chỉnh
                </span>
              )}
              {canInlineOverride && !isEditing && hasScore && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditScore(String(displayScore as number));
                  }}
                  className="px-2 py-1 h-6 rounded border border-warning/50 bg-warning/10 hover:bg-warning/20 hover:border-warning/80 text-warning flex items-center justify-center gap-1.5 transition-all duration-300 shadow-[0_0_15px_color-mix(in_srgb,var(--warning)_20%,transparent)]"
                  title="Chỉnh sửa điểm"
                >
                  <Pencil className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Chỉnh sửa điểm</span>
                </button>
              )}
            </div>
          </div>
          {hasScore ? (
            <>
              <div className="relative group">
                <ScoreRing
                  value={isEditing ? (editScore ? Number(editScore) : 0) : (displayScore as number)}
                  size={140}
                  hidePercentage={true}
                  fontSizeRatio={isEditing ? 0 : 0.3}
                />

                {isEditing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-card/40 rounded-full backdrop-blur-[2px]">
                    {isSubmitting ? (
                      <Loader2 className="w-8 h-8 text-warning animate-spin" />
                    ) : (
                      <>
                        <input
                          ref={inputRef}
                          type="number"
                          value={editScore}
                          onChange={(e) => setEditScore(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave();
                            if (e.key === "Escape") setIsEditing(false);
                          }}
                          onBlur={() => setIsEditing(false)}
                          className="w-16 h-12 bg-transparent text-center text-foreground text-4xl font-bold focus:outline-none placeholder:text-muted-foreground/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                          min="0"
                          max="100"
                        />
                        <span className="text-[9px] font-bold text-warning uppercase mt-2 bg-warning/10 px-2 py-0.5 rounded-full border border-warning/20">
                          Enter để lưu
                        </span>
                      </>
                    )}
                  </div>
                )}

                <div
                  className="absolute inset-0 rounded-full blur-2xl opacity-20 pointer-events-none"
                  style={{ backgroundColor: grade?.color }}
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                {grade && (
                  <span className="text-base font-bold" style={{ color: grade.color }}>
                    {grade.label}
                  </span>
                )}
                {isOverridden && aiScore !== null && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {(displayScore as number) > aiScore ? (
                      <TrendingUp className="w-3 h-3 text-success" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-danger" />
                    )}
                    AI: {aiScore}
                  </span>
                )}
                {recConfig && RecIcon && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-1"
                    style={{
                      color: recConfig.color,
                      backgroundColor: recConfig.bg,
                      border: `1px solid ${recConfig.border}`,
                    }}
                  >
                    <RecIcon className="w-3 h-3" />
                    {recConfig.label}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-8">
              <span className="text-muted-foreground text-sm">Chưa có điểm</span>
            </div>
          )}
        </div>

        {/* Right: 5 breakdown bars */}
        <div className="flex-1 flex flex-col justify-center gap-0.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Chi tiết đánh giá
            </span>
            {avg !== null && (
              <span className="text-xs text-muted-foreground">
                Trung bình: <span className="font-bold" style={{ color: avgColor }}>{avg}</span>
              </span>
            )}
          </div>
          <EnhancedScoreBar label="Kỹ năng" value={skillMatchScore} icon={Code2} accent="var(--primary)" />
          <EnhancedScoreBar label="Kinh nghiệm" value={experienceMatchScore} icon={Briefcase} accent="var(--warning)" />
          <EnhancedScoreBar label="Lĩnh vực" value={domainMatchScore} icon={Globe2} accent="var(--primary)" />
          <EnhancedScoreBar label="Học vấn" value={educationMatchScore} icon={GraduationCap} accent="var(--ai)" />
          <EnhancedScoreBar label="Văn hóa" value={cultureFitScore} icon={Heart} accent="var(--danger)" />
        </div>
      </div>

      {/* Zone B — Summary banner */}
      {summary && (
        <div className="mt-4 pt-4 border-t border-muted-foreground/10 px-1">
          <p className="text-sm text-foreground leading-relaxed italic">
            &ldquo;{summary}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
