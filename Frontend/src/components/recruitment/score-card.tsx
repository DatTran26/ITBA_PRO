"use client";

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
  STRONG_HIRE: { label: "Ưu tiên tuyển", color: "#10B981", bg: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.25)", icon: Star },
  HIRE: { label: "Nên phỏng vấn", color: "#22C55E", bg: "rgba(34, 197, 94, 0.08)", border: "rgba(34, 197, 94, 0.25)", icon: CheckCircle2 },
  MAYBE: { label: "Cần cân nhắc", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.25)", icon: AlertCircle },
  NO_HIRE: { label: "Không phù hợp", color: "#EF4444", bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.25)", icon: XCircle },
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
  const hasValue = value !== null && value !== undefined;
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
            width: hasValue ? `${pct}%` : "0%",
            background: hasValue ? `linear-gradient(90deg, ${accent}90, ${accent})` : "transparent",
            boxShadow: hasValue ? `0 0 10px ${accent}60` : "none",
          }}
        />
      </div>
      <span className="text-sm font-bold tabular-nums w-8 text-right" style={{ color: hasValue ? accent : "#5A6882" }}>
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
  const avgColor = avg !== null ? getScoreGrade(avg).color : "#5A6882";

  return (
    <div className="glass-card p-6 w-full">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Left: Big score ring */}
        <div className="flex flex-col items-center gap-3 sm:w-[35%] shrink-0">
          <div className="flex items-center justify-between w-full mb-1 min-h-(1.5rem)">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0EA5E9] drop-shadow-[0_0_5px_rgba(14,165,233,0.5)]" />
              <span className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] uppercase tracking-widest mt-0.5 drop-shadow-[0_0_5px_rgba(14,165,233,0.3)]">
                AI SCORE
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isOverridden && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#A855F7]/15 border border-[#A855F7]/40 text-[#A855F7] text-[10px] font-bold tracking-wider shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                  Đã điều chỉnh
                </span>
              )}
              {canInlineOverride && !isEditing && hasScore && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditScore(String(displayScore as number));
                  }}
                  className="px-2 py-1 h-6 rounded border border-[#F59E0B]/50 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 hover:border-[#F59E0B]/80 text-[#F59E0B] flex items-center justify-center gap-1.5 transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#0F1628]/40 rounded-full backdrop-blur-[2px]">
                    {isSubmitting ? (
                      <Loader2 className="w-8 h-8 text-[#F59E0B] animate-spin" />
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
                          className="w-16 h-12 bg-transparent text-center text-[#ECF0F7] text-4xl font-bold focus:outline-none placeholder:text-[#8B99B0]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                          min="0"
                          max="100"
                        />
                        <span className="text-[9px] font-bold text-[#F59E0B] uppercase mt-2 bg-[#F59E0B]/10 px-2 py-0.5 rounded-full border border-[#F59E0B]/20">
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
                  <span className="text-xs text-[#5A6882] flex items-center gap-1">
                    {(displayScore as number) > aiScore ? (
                      <TrendingUp className="w-3 h-3 text-[#22C55E]" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-[#EF4444]" />
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
              <span className="text-[#5A6882] text-sm">Chưa có điểm</span>
            </div>
          )}
        </div>

        {/* Right: 5 breakdown bars */}
        <div className="flex-1 flex flex-col justify-center gap-0.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#8B99B0] uppercase tracking-wider">
              Chi tiết đánh giá
            </span>
            {avg !== null && (
              <span className="text-xs text-[#5A6882]">
                Trung bình: <span className="font-bold" style={{ color: avgColor }}>{avg}</span>
              </span>
            )}
          </div>
          <EnhancedScoreBar label="Kỹ năng" value={skillMatchScore} icon={Code2} accent="#7C8FFF" />
          <EnhancedScoreBar label="Kinh nghiệm" value={experienceMatchScore} icon={Briefcase} accent="#F59E0B" />
          <EnhancedScoreBar label="Lĩnh vực" value={domainMatchScore} icon={Globe2} accent="#06B6D4" />
          <EnhancedScoreBar label="Học vấn" value={educationMatchScore} icon={GraduationCap} accent="#8B5CF6" />
          <EnhancedScoreBar label="Văn hóa" value={cultureFitScore} icon={Heart} accent="#EC4899" />
        </div>
      </div>

      {/* Zone B — Summary banner */}
      {summary && (
        <div className="mt-4 pt-4 border-t border-[#8B99B0]/10 px-1">
          <p className="text-sm text-[#C8D0E0] leading-relaxed italic">
            &ldquo;{summary}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
