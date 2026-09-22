"use client";

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
const InterviewHistoryTab = lazy(() => import("./_components/interview-history-tab"));
import {
    ArrowLeft,
    FileText,
    Loader2,
    RefreshCw,
    AlertTriangle,
    Sparkles,
    AlertCircle,
    User,
    Briefcase,
    GraduationCap,
    Award,
    Globe,
    Pencil,
    CheckCircle2,
    XCircle,
    Mail,
    Clock,
    ChevronDown,
    ChevronUp,
    Building,
    Building2,
    Eye,
    MoreVertical,
    History,
    Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import ScoreCard from "@/components/recruitment/score-card";
import StatusTimeline from "@/components/recruitment/status-timeline";
import OverrideScoreDialog from "@/components/recruitment/override-score-dialog";
import OfferActions from "@/components/recruitment/offer-actions";
import NotesPanel from "@/components/crm/notes-panel";
import StatusBadge from "@/components/crm/status-badge";
import { useApplicationRealtime } from "@/hooks/use-application-realtime";
import type { PipelineStatus } from "@/types/recruitment";

interface InsightTimelineItemProps {
    text: string;
    type: "highlight" | "strength" | "missing" | "weakness";
    isLast: boolean;
}

function InsightTimelineItem({ text, type, isLast }: InsightTimelineItemProps) {
    const configs = {
        highlight: {
            icon: Sparkles,
            iconColor: "text-warning",
            bg: "bg-muted",
            border: "border-warning/50 hover:border-warning",
            line: "bg-gradient-to-b from-warning/50",
        },
        strength: {
            icon: CheckCircle2,
            iconColor: "text-success",
            bg: "bg-muted",
            border: "border-success/50 hover:border-success",
            line: "bg-gradient-to-b from-success/50",
        },
        missing: {
            icon: AlertCircle,
            iconColor: "text-warning",
            bg: "bg-muted",
            border: "border-warning/50 hover:border-warning",
            line: "bg-gradient-to-b from-warning/50",
        },
        weakness: {
            icon: XCircle,
            iconColor: "text-danger",
            bg: "bg-muted",
            border: "border-danger/50 hover:border-danger",
            line: "bg-gradient-to-b from-danger/50",
        },
    };
    const c = configs[type];
    const Icon = c.icon;

    return (
        <div className="relative flex items-start gap-5 group">
            {!isLast && (
                <div
                    className={`absolute left-[15px] top-[32px] bottom-[-24px] w-[2px] ${c.line} to-transparent opacity-20 group-hover:opacity-50 transition-opacity`}
                />
            )}
            <div
                className={`relative z-10 w-8 h-8 rounded-full ${c.bg} border-2 ${c.border} flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:shadow-[0_0_20px_inherit]`}
            >
                <Icon className={`w-3.5 h-3.5 ${c.iconColor}`} />
            </div>
            <div className="pt-1 flex-1 pb-6">
                <p className="text-[14px] text-foreground leading-relaxed group-hover:text-foreground transition-colors">
                    {text}
                </p>
            </div>
        </div>
    );
}

const PIPELINE_STATUS_CONFIG: Record<string, { label: string; color: string }> =
    {
        NEW: { label: "New", color: "var(--primary)" },
        SCREENED: { label: "Screened", color: "var(--ai)" },
        SHORTLISTED: { label: "Pass", color: "var(--success)" },
        INTERVIEW_SCHEDULED: { label: "Interview Scheduled", color: "var(--warning)" },
        INTERVIEWED: { label: "Interviewed", color: "var(--warning)" },
        PASSED: { label: "Passed", color: "var(--success)" },
        FAILED: { label: "Failed", color: "var(--danger)" },
        REJECTED: { label: "Fail", color: "var(--danger)" },
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
    jobDescription: {
        id: string;
        title: string;
        department: string | null;
    } | null;
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

const CAN_OVERRIDE = ["hr", "interviewer", "admin", "super_admin"];

export default function ApplicationDetailClient({ id, userRole }: Props) {
    const router = useRouter();
    const [data, setData] = useState<ApplicationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cvLoading, setCvLoading] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [activeTab, setActiveTab] = useState<"notes" | "interviews">("notes");

    const realtime = useApplicationRealtime(id);

    const fetchData = useCallback(
        async (isRefresh = false) => {
            if (!isRefresh) setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/recruitment/applications/${id}`);
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    setError(body.error ?? "Failed to load application.");
                    return;
                }
                const json = await res.json();
                setData(json);
            } catch {
                setError("Network error. Please try again.");
            } finally {
                if (!isRefresh) setLoading(false);
            }
        },
        [id],
    );

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRetry = useCallback(async () => {
        setIsRetrying(true);
        try {
            const res = await fetch(
                `/api/recruitment/applications/${id}/cv-analysis`,
                { method: "POST" },
            );
            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                throw new Error(b.error ?? "Failed");
            }
            await fetchData();
        } catch {
            await fetchData(); // Refresh to surface FAILED state
        } finally {
            setIsRetrying(false);
        }
    }, [id, fetchData]);

    // Sync realtime score updates into local state
    useEffect(() => {
        if (!realtime.aiScore || !data) return;
        setData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                application: {
                    ...prev.application,
                    pipelineStatus:
                        realtime.pipelineStatus ??
                        prev.application.pipelineStatus,
                },
                screening: prev.screening
                    ? {
                          ...prev.screening,
                          aiScore: realtime.aiScore ?? prev.screening.aiScore,
                      }
                    : prev.screening,
            };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [realtime.aiScore, realtime.pipelineStatus]);

    // Refresh when polling detects a terminal state that local data hasn't caught up with
    useEffect(() => {
        if (!data) return;
        const isTerminal = realtime.parseStatus === "COMPLETED" || realtime.parseStatus === "FAILED";
        if (isTerminal && data.cv?.parseStatus !== realtime.parseStatus) {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [realtime.parseStatus]);

    // Auto-trigger analysis when CV is freshly uploaded (PENDING, no screening yet)
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

    const handleInlineOverride = async (newScore: number): Promise<boolean> => {
        try {
            const res = await fetch(
                `/api/recruitment/applications/${id}/override-score`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        finalScore: newScore,
                        // Database requires at least 10 chars for reason
                        overrideReason:
                            "Chỉnh sửa trực tiếp trên giao diện ScoreRing",
                    }),
                },
            );

            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                toast.error(d.error || "Có lỗi khi lưu điểm");
                return false;
            }

            toast.success("Thay đổi điểm thành công");
            handleOverrideSuccess(newScore);
            return true;
        } catch {
            toast.error("Có lỗi đường truyền");
            return false;
        }
    };

    const updatePipelineStatus = async (toStatus: PipelineStatus) => {
        setIsUpdatingStatus(true);
        try {
            const res = await fetch(
                `/api/recruitment/applications/${id}/status`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ toStatus }),
                },
            );
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                toast.error(d.error || "Không thể cập nhật trạng thái");
            } else {
                toast.success("Đã cập nhật trạng thái thành công");
                // Optimistically update status for instant UI reaction
                setData((prev) =>
                    prev
                        ? {
                              ...prev,
                              application: {
                                  ...prev.application,
                                  pipelineStatus: toStatus,
                              },
                          }
                        : prev,
                );
                // Silently reload in background to update logs/history
                fetchData(true);
            }
        } catch {
            toast.error("Có lỗi kết nối");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    if (loading) return <Skeleton />;

    if (error) {
        return (
            <div className="flex flex-col items-center py-20 gap-4">
                <p className="text-danger text-sm">{error}</p>
                <button
                    onClick={() => fetchData()}
                    className="px-4 py-2 rounded-lg bg-primary/15 text-primary text-sm hover:bg-primary/25 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!data) return null;

    const { application, person, screening, cv, history, jobDescription } =
        data;
    const pipelineStatus = application.pipelineStatus;

    const isPassed = [
        "SHORTLISTED",
        "PASSED",
        "ACCEPTED",
        "ONBOARDED",
        "INTERVIEW_SCHEDULED",
        "INTERVIEWED",
        "OFFERED",
    ].includes(pipelineStatus);
    const isFailed = ["REJECTED", "FAILED", "OFFER_REJECTED"].includes(
        pipelineStatus,
    );
    const canUpdateStatus =
        CAN_OVERRIDE.includes(userRole) || userRole === "recruiter";

    return (
        <div className="space-y-6 pb-12">
            {/* Unified Candidate Profile Header */}
            <div className="glass-card p-6 flex flex-col gap-6 relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

                {/* Top row: Basics + Actions */}
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 relative z-10">
                    <div className="flex items-start gap-4">
                        <button
                            onClick={() => router.back()}
                            className="mt-1 p-2 rounded-xl text-muted-foreground bg-card/80 hover:text-foreground hover:bg-accent transition-all shrink-0 border border-muted-foreground/20 hover:border-muted-foreground/50 hover:shadow-[0_0_15px_color-mix(in_srgb,var(--primary)_15%,transparent)]"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col gap-1.5 mt-0.5">
                            <div className="flex items-center gap-4">
                                <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-foreground tracking-tight">
                                    {person.fullName}
                                </h1>

                                {/* Unified Interactive Pass/Fail Toggle */}
                                {(isPassed ||
                                    isFailed ||
                                    pipelineStatus === "SCREENED") && (
                                    <div className="flex items-center bg-background/80 rounded-full border border-border p-1 h-9 shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]">
                                        <button
                                            onClick={() =>
                                                !isPassed &&
                                                updatePipelineStatus(
                                                    "SHORTLISTED",
                                                )
                                            }
                                            disabled={
                                                isUpdatingStatus ||
                                                !canUpdateStatus ||
                                                isPassed
                                            }
                                            className={`relative w-[70px] h-full rounded-full text-[13px] font-bold transition-all duration-300 flex items-center justify-center ${
                                                isPassed
                                                    ? "bg-success text-white shadow-[0_0_15px_color-mix(in_srgb,var(--success)_40%,transparent)]"
                                                    : "text-muted-foreground hover:text-foreground bg-transparent"
                                            }`}
                                        >
                                            Pass
                                        </button>
                                        <button
                                            onClick={() =>
                                                !isFailed &&
                                                updatePipelineStatus("REJECTED")
                                            }
                                            disabled={
                                                isUpdatingStatus ||
                                                !canUpdateStatus ||
                                                isFailed
                                            }
                                            className={`relative w-[70px] h-full rounded-full text-[13px] font-bold transition-all duration-300 flex items-center justify-center ${
                                                isFailed
                                                    ? "bg-danger text-white shadow-[0_0_15px_color-mix(in_srgb,var(--danger)_40%,transparent)]"
                                                    : "text-muted-foreground hover:text-foreground bg-transparent"
                                            }`}
                                        >
                                            Fail
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
                                <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                    <Mail className="w-3.5 h-3.5" />
                                    {person.email}
                                </span>
                                {jobDescription && (
                                    <span className="flex items-center gap-1.5 text-success font-bold bg-gradient-to-r from-success/10 to-success/5 px-3 py-1 rounded-full border border-success/30 shadow-[0_0_10px_color-mix(in_srgb,var(--success)_10%,transparent)]">
                                        <Award className="w-4 h-4" />
                                        Ứng tuyển:{" "}
                                        <span className="text-foreground">
                                            {jobDescription.title}
                                        </span>
                                        {jobDescription.department
                                            ? ` · ${jobDescription.department}`
                                            : ""}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 xl:shrink-0">
                        {cv && (
                            <button
                                onClick={handleCvPreview}
                                disabled={cvLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-accent border border-muted-foreground/10 text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-colors disabled:opacity-50"
                            >
                                {cvLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Eye className="w-3.5 h-3.5" />
                                )}
                                {cv.originalFilename ?? "Xem CV"}
                            </button>
                        )}

                        {canUpdateStatus && (
                            <button
                                disabled={pipelineStatus !== "SHORTLISTED"}
                                onClick={() =>
                                    router.push(
                                        `/dashboard/recruitment/sessions?preselect=${encodeURIComponent(id)}`,
                                    )
                                }
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                    pipelineStatus !== "SHORTLISTED"
                                        ? "bg-muted-foreground/10 border border-muted-foreground/20 text-muted-foreground cursor-not-allowed opacity-50"
                                        : "bg-warning/15 border border-warning/30 text-warning hover:bg-warning/25 hover:border-warning/50 cursor-pointer shadow-[0_0_15px_color-mix(in_srgb,var(--warning)_5%,transparent)]"
                                }`}
                            >
                                <Calendar className="w-3.5 h-3.5" />
                                Lên lịch PV
                            </button>
                        )}
                        {(userRole === "recruiter" ||
                            userRole === "admin" ||
                            userRole === "super_admin") && (
                            <OfferActions
                                applicationId={id}
                                pipelineStatus={pipelineStatus}
                                onSuccess={fetchData}
                            />
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger className="p-2 rounded-lg text-muted-foreground bg-accent/50 hover:text-foreground hover:bg-accent border border-muted-foreground/10 transition-colors flex items-center justify-center cursor-pointer">
                                <MoreVertical className="w-4 h-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-48 bg-background border-muted shadow-xl"
                            >
                                <DropdownMenuItem
                                    onClick={() => setIsHistoryOpen(true)}
                                    className="text-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer focus:bg-muted/80 focus:text-foreground"
                                >
                                    <History className="w-4 h-4 mr-2" />
                                    Lịch sử phiên bản
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Dialog
                            open={isHistoryOpen}
                            onOpenChange={setIsHistoryOpen}
                        >
                            <DialogContent className="max-w-xl bg-gradient-to-b from-background to-background border-muted shadow-2xl p-0 overflow-hidden">
                                <DialogHeader className="p-5 pb-3 border-b border-border relative bg-muted/30">
                                    <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                                        <History className="w-5 h-5 text-muted-foreground" />{" "}
                                        Lịch sử trạng thái CV
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                    <StatusTimeline history={history} />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Extracted Info Grid (Prioritized: Experience & Education) */}
                {screening?.parsedCvJson &&
                    Object.keys(screening.parsedCvJson).length > 0 && (
                        <div className="flex flex-col gap-5 relative z-10 pt-4 border-t border-muted-foreground/10">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {screening.parsedCvJson
                                    .total_years_experience != null && (
                                    <div className="bg-gradient-to-br from-muted/60 to-background/60 backdrop-blur-md rounded-2xl p-4 border border-border hover:border-muted/30 transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />{" "}
                                            Kinh nghiệm
                                        </p>
                                        <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-foreground">
                                            {String(
                                                screening.parsedCvJson
                                                    .total_years_experience,
                                            )}{" "}
                                            năm
                                        </p>
                                    </div>
                                )}
                                {/* Education Summary */}
                                {Array.isArray(
                                    screening.parsedCvJson.education,
                                ) &&
                                    screening.parsedCvJson.education.length >
                                        0 && (
                                        <div className="bg-gradient-to-br from-muted/60 to-background/60 backdrop-blur-md rounded-2xl p-4 border border-border hover:border-muted/30 transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-ai mb-2 flex items-center gap-1.5">
                                                <GraduationCap className="w-3.5 h-3.5" />{" "}
                                                Học vấn nổi bật
                                            </p>
                                            <p className="text-[14px] font-bold text-foreground truncate leading-tight">
                                                {
                                                    (
                                                        screening.parsedCvJson
                                                            .education[0] as Record<
                                                            string,
                                                            string
                                                        >
                                                    ).degree
                                                }
                                            </p>
                                            {(
                                                screening.parsedCvJson
                                                    .education[0] as Record<
                                                    string,
                                                    string
                                                >
                                            ).school && (
                                                <div className="flex items-center gap-1.5 mt-2.5">
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted border border-border shadow-sm w-fit max-w-full">
                                                        <Building className="w-3 h-3 text-muted-foreground shrink-0" />
                                                        <span className="text-[11.5px] font-medium text-foreground truncate">
                                                            {
                                                                (
                                                                    screening
                                                                        .parsedCvJson
                                                                        .education[0] as Record<
                                                                        string,
                                                                        string
                                                                    >
                                                                ).school
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                {/* Permanent Contact Info (Phone & Location) taking up the 4th column to prevent empty holes */}
                                <div className="bg-gradient-to-br from-muted/60 to-background/60 backdrop-blur-md rounded-2xl p-4 border border-border hover:border-muted/30 transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-warning mb-2 flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5" /> Cá nhân
                                    </p>
                                    <p className="text-[14px] font-bold text-foreground truncate leading-tight">
                                        {(person as Record<string, string>)
                                            .phone ||
                                            (screening.parsedCvJson.phone
                                                ? String(
                                                      screening.parsedCvJson
                                                          .phone,
                                                  )
                                                : "Không có SĐT")}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-2.5">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted border border-border shadow-sm w-fit max-w-full">
                                            <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                                            <span className="text-[11.5px] font-medium text-foreground truncate">
                                                {screening.parsedCvJson.location
                                                    ? String(
                                                          screening.parsedCvJson
                                                              .location,
                                                      )
                                                    : "Chưa rõ khu vực"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {isHeaderExpanded &&
                                    Boolean(
                                        screening.parsedCvJson.current_title,
                                    ) && (
                                        <div className="bg-gradient-to-br from-muted/60 to-background/60 backdrop-blur-md rounded-2xl p-4 border border-border hover:border-muted/30 transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.2)] animate-in fade-in slide-in-from-top-2 duration-300">
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-success mb-2 flex items-center gap-1.5">
                                                <Briefcase className="w-3.5 h-3.5" />{" "}
                                                Công việc gần nhất
                                            </p>
                                            <p className="text-[14px] font-bold text-foreground truncate leading-tight">
                                                {String(
                                                    screening.parsedCvJson
                                                        .current_title,
                                                )}
                                            </p>
                                            {Boolean(
                                                screening.parsedCvJson
                                                    .current_company,
                                            ) && (
                                                <div className="flex items-center gap-1.5 mt-2.5">
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted border border-border shadow-sm w-fit max-w-full">
                                                        <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                                                        <span className="text-[11.5px] font-medium text-foreground truncate">
                                                            {String(
                                                                screening
                                                                    .parsedCvJson
                                                                    .current_company,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>

                            {/* Skills */}
                            {isHeaderExpanded &&
                                Array.isArray(screening.parsedCvJson.skills) &&
                                screening.parsedCvJson.skills.length > 0 && (
                                    <div className="flex flex-col gap-2 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-warning flex items-center gap-1.5 ml-1">
                                            <Sparkles className="w-3.5 h-3.5" />{" "}
                                            Bộ kỹ năng
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {(
                                                screening.parsedCvJson
                                                    .skills as string[]
                                            ).map((skill, i) => (
                                                <span
                                                    key={i}
                                                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary/10 to-ai/10 border border-primary/30 text-foreground text-[12px] font-medium shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_5%,transparent)] hover:border-ai/60 hover:shadow-[0_0_15px_color-mix(in_srgb,var(--ai)_20%,transparent)] transition-all cursor-default"
                                                >
                                                    {String(skill)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            {(Boolean(screening.parsedCvJson.current_title) ||
                                (Array.isArray(screening.parsedCvJson.skills) &&
                                    screening.parsedCvJson.skills.length >
                                        0)) && (
                                <div className="relative flex items-center justify-center mt-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-muted-foreground/20 border-dashed"></div>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setIsHeaderExpanded(
                                                !isHeaderExpanded,
                                            )
                                        }
                                        className="relative flex items-center gap-2 px-5 py-1.5 rounded-full bg-card hover:bg-accent text-muted-foreground hover:text-muted text-[12px] font-bold tracking-wide transition-all border border-muted-foreground/30 hover:border-primary/50 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                                    >
                                        {isHeaderExpanded ? (
                                            <>
                                                <ChevronUp className="w-4 h-4" />{" "}
                                                THU GỌN
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-4 h-4" />{" "}
                                                {Array.isArray(
                                                    screening.parsedCvJson
                                                        .skills,
                                                )
                                                    ? `XEM THÊM ${(screening.parsedCvJson.skills as string[]).length} KỸ NĂNG & CHI TIẾT CÔNG VIỆC`
                                                    : "HIỂN THỊ THÊM"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
            </div>

            {/* Score section */}
            {screening ? (
                <>
                    <div className="w-full">
                        <ScoreCard
                            aiScore={screening.aiScore}
                            finalScore={screening.finalScore}
                            isOverridden={screening.isOverridden}
                            overriddenAt={screening.overriddenAt ?? undefined}
                            recommendation={screening.recommendation}
                            summary={screening.summary}
                            skillMatchScore={screening.skillMatchScore}
                            experienceMatchScore={
                                screening.experienceMatchScore
                            }
                            domainMatchScore={screening.domainMatchScore}
                            educationMatchScore={screening.educationMatchScore}
                            cultureFitScore={screening.cultureFitScore}
                            canInlineOverride={CAN_OVERRIDE.includes(userRole)}
                            onInlineOverride={handleInlineOverride}
                        />
                    </div>

                    {/* Comparison Board (Pros vs Cons) */}
                    {((screening.keyHighlights?.length ?? 0) > 0 ||
                        (screening.strengthsJson?.length ?? 0) > 0 ||
                        (screening.missingRequirements?.length ?? 0) > 0 ||
                        (screening.weaknessesJson?.length ?? 0) > 0) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
                            {/* PROS COLUMN */}
                            <div className="relative overflow-hidden rounded-3xl bg-background/60 border border-success/10 p-6 sm:p-8 flex flex-col h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                                {/* Ambient glow */}
                                <div className="absolute top-0 left-0 right-0 h-64 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-success/10 via-transparent to-transparent pointer-events-none" />

                                <div className="flex flex-col gap-8 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-success/10 border border-success/30 flex items-center justify-center shrink-0 shadow-[0_0_25px_color-mix(in_srgb,var(--success)_15%,transparent)] backdrop-blur-xl">
                                            <Sparkles className="w-6 h-6 text-success" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-success to-success uppercase tracking-widest drop-shadow-sm">
                                                Sự Phù Hợp & Thế Mạnh
                                            </h3>
                                            <p className="text-[13px] text-muted-foreground mt-1">
                                                Những điểm sáng nổi bật nhất từ
                                                ứng viên
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        {(() => {
                                            const proItems = [
                                                ...(
                                                    screening.keyHighlights ??
                                                    []
                                                ).map((t) => ({
                                                    text: t,
                                                    type: "highlight" as const,
                                                })),
                                                ...(
                                                    screening.strengthsJson ??
                                                    []
                                                ).map((t) => ({
                                                    text: t,
                                                    type: "strength" as const,
                                                })),
                                            ];
                                            return proItems.map((item, i) => (
                                                <InsightTimelineItem
                                                    key={`pro-${i}`}
                                                    {...item}
                                                    isLast={
                                                        i ===
                                                        proItems.length - 1
                                                    }
                                                />
                                            ));
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* CONS COLUMN */}
                            <div className="relative overflow-hidden rounded-3xl bg-background/60 border border-danger/10 p-6 sm:p-8 flex flex-col h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                                {/* Ambient glow */}
                                <div className="absolute top-0 left-0 right-0 h-64 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-danger/10 via-transparent to-transparent pointer-events-none" />

                                <div className="flex flex-col gap-8 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-danger/20 to-warning/10 border border-danger/30 flex items-center justify-center shrink-0 shadow-[0_0_25px_color-mix(in_srgb,var(--danger)_15%,transparent)] backdrop-blur-xl">
                                            <AlertTriangle className="w-6 h-6 text-danger" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-danger to-warning uppercase tracking-widest drop-shadow-sm">
                                                Hạn Chế & Rủi Ro
                                            </h3>
                                            <p className="text-[13px] text-muted-foreground mt-1">
                                                Yêu cầu còn thiếu cần cân nhắc
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        {(() => {
                                            const conItems = [
                                                ...(
                                                    screening.missingRequirements ??
                                                    []
                                                ).map((t) => ({
                                                    text: t,
                                                    type: "missing" as const,
                                                })),
                                                ...(
                                                    screening.weaknessesJson ??
                                                    []
                                                ).map((t) => ({
                                                    text: t,
                                                    type: "weakness" as const,
                                                })),
                                            ];
                                            return conItems.map((item, i) => (
                                                <InsightTimelineItem
                                                    key={`con-${i}`}
                                                    {...item}
                                                    isLast={
                                                        i ===
                                                        conItems.length - 1
                                                    }
                                                />
                                            ));
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="glass-card p-5">
                    {cv?.parseStatus === "PENDING" ||
                    cv?.parseStatus === "PROCESSING" ? (
                        <div className="flex flex-col items-center gap-3 py-4 text-center">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-sm font-medium text-foreground">
                                Đang chạy CV Analysis...
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Hệ thống đang phân tích CV bằng AI. Trang sẽ tự
                                động cập nhật khi hoàn tất.
                            </p>
                        </div>
                    ) : cv?.parseStatus === "FAILED" ? (
                        <div className="flex flex-col items-center gap-3 py-4 text-center">
                            <div className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-danger" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    CV Analysis thất bại
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Có lỗi xảy ra khi AI xử lý CV. Bạn có thể
                                    thử lại.
                                </p>
                            </div>
                            <button
                                onClick={handleRetry}
                                disabled={isRetrying}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                <RefreshCw
                                    className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`}
                                />
                                {isRetrying
                                    ? "Đang thử lại..."
                                    : "Thử lại CV Analysis"}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 py-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                Chưa có kết quả sàng lọc.
                            </p>
                            {!jobDescription && (
                                <p className="text-xs text-warning">
                                    ⚠ Cần gán Job Description trước khi chạy CV
                                    Analysis.
                                </p>
                            )}
                            {[
                                "hr",
                                "interviewer",
                                "admin",
                                "super_admin",
                            ].includes(userRole) && (
                                <button
                                    onClick={handleRetry}
                                    disabled={isRetrying || !jobDescription}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <RefreshCw
                                        className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`}
                                    />
                                    {isRetrying
                                        ? "Đang xử lý..."
                                        : "Bắt đầu CV Analysis"}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* End of Parsed CV Info (Moved to top Header) */}

            {/* Notes + Interview history tabbed panel */}
            <div className="glass-card p-5">
                <div className="flex items-center gap-1 mb-4 bg-background border border-muted-foreground/12 rounded-lg p-1 w-fit">
                    {(["notes", "interviews"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t)}
                            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                activeTab === t
                                    ? "bg-primary text-white"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {t === "notes" ? "Ghi chú" : "Lịch sử PV"}
                        </button>
                    ))}
                </div>
                {activeTab === "notes" ? (
                    <NotesPanel entityType="job_application" entityId={id} />
                ) : (
                    <Suspense fallback={<div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}>
                        <InterviewHistoryTab applicationId={id} />
                    </Suspense>
                )}
            </div>
        </div>
    );
}
