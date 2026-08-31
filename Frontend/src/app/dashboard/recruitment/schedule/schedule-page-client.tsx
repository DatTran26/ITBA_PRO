"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    AlertTriangle,
    ArrowLeft,
    BadgeCheck,
    Building2,
    Calendar,
    CalendarClock,
    ChevronDown,
    Clock3,
    FileText,
    Gauge,
    Link2,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Search,
    Sparkles,
    Timer,
    UserCheck,
    Users,
    Video,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/motion-wrapper";
import BackgroundOrbs from "@/components/ui/background-orbs";

interface Candidate {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    jdId: string | null;
    jdTitle: string;
    status: string;
    pipelineStatus: string;
    createdAt: string;
    aiScore: number | null;
    finalScore: number | null;
    screening?: {
        strengths: string[] | null;
        weaknesses: string[] | null;
        summary: string | null;
    };
    testResults: {
        score: number | null;
        total: number | null;
        status: string | null;
    }[];
}

interface InterviewSchedule {
    id: string;
    jobApplicationId: string;
    interviewerId: string;
    interviewerName: string;
    scheduledAt: string;
    status: string;
    recruiterNote: string | null;
}

type RequiredScheduleField =
    | "interviewRound"
    | "interviewDate"
    | "startTime"
    | "duration"
    | "locationType";

const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
};

function formatDate(value: string) {
    if (!value) return "-";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "-";
    return dt.toLocaleDateString("vi-VN");
}

function formatTime(value: string) {
    if (!value) return "-";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "-";
    return dt.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getTestStatusLabel(status: string | null) {
    if (!status) return "Chưa có bài test";
    if (status === "COMPLETED") return "Đã hoàn thành";
    if (status === "IN_PROGRESS") return "Đang làm";
    if (status === "PENDING") return "Đang chờ";
    return status;
}

function getScoreTone(score: number | null) {
    if (score === null) {
        return {
            badge: "bg-white/5 border-white/10 text-[#8B99B0]",
            bar: "bg-linear-to-r from-[#5A6882] to-[#8B99B0]",
            value: "-",
        };
    }

    if (score >= 70) {
        return {
            badge: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
            bar: "bg-linear-to-r from-emerald-400 to-emerald-300",
            value: String(Math.round(score)),
        };
    }

    if (score >= 50) {
        return {
            badge: "bg-amber-500/15 border-amber-500/30 text-amber-300",
            bar: "bg-linear-to-r from-amber-400 to-amber-300",
            value: String(Math.round(score)),
        };
    }

    return {
        badge: "bg-rose-500/15 border-rose-500/30 text-rose-300",
        bar: "bg-linear-to-r from-rose-400 to-rose-300",
        value: String(Math.round(score)),
    };
}

const INTERVIEW_ROUND_OPTIONS = [
    { value: "Round 1", label: "Round 1 - Sơ tuyển" },
    { value: "Round 2", label: "Round 2 - Chuyên môn" },
    { value: "Final", label: "Final" },
];

const MONTH_LABELS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatDateInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDateDisplay(value: string) {
    if (!value) return "mm/dd/yyyy";
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return "mm/dd/yyyy";
    return `${month}/${day}/${year}`;
}

function buildCalendarDays(monthDate: Date) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const start = new Date(year, month, 1 - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        return date;
    });
}

function formatTimeDisplay(value: string) {
    if (!value) return "--:-- --";
    const [hourValue, minuteValue] = value.split(":");
    const hour = Number(hourValue);
    if (Number.isNaN(hour)) return "--:-- --";
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${String(displayHour).padStart(2, "0")}:${minuteValue ?? "00"} ${period}`;
}

export default function SchedulePageClient({
    user,
}: {
    user: { name: string; email: string; role: string };
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const preselectedCandidateId = searchParams.get("id");

    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [interviews, setInterviews] = useState<InterviewSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [selectedCandidate, setSelectedCandidate] =
        useState<Candidate | null>(null);
    const [interviewDate, setInterviewDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [duration, setDuration] = useState("60");
    const [interviewRound, setInterviewRound] = useState("Round 1");
    const [recruiterNote, setRecruiterNote] = useState("");
    const [locationType, setLocationType] = useState<
        "online" | "office" | "phone"
    >("online");
    const [locationDetail, setLocationDetail] = useState("Google Meet / Zoom");
    const [preselectHandled, setPreselectHandled] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<RequiredScheduleField, boolean>>>({});
    const [openPicker, setOpenPicker] = useState<"round" | "date" | "time" | null>(null);
    const [calendarMonth, setCalendarMonth] = useState(() => new Date());

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [candRes, interviewRes] = await Promise.all([
                fetch(
                    "/api/recruitment/applications?status=SHORTLISTED&pageSize=50",
                ),
                fetch("/api/recruitment/interviews"),
            ]);

            if (candRes.ok) {
                const data = await candRes.json();
                type AppRaw = { id: string; person?: { fullName?: string; email?: string; phone?: string | null; testResults?: unknown[] }; jobDescription?: { id?: string; title?: string }; status?: string; pipelineStatus?: string; createdAt?: string; aiScore?: number | null; screening?: { aiScore?: number | null; finalScore?: number | null; strengths?: unknown; weaknesses?: unknown; summary?: string } };
                setCandidates(
                    (data.applications ?? []).map((application: AppRaw) => ({
                        id: application.id,
                        fullName: application.person?.fullName ?? "-",
                        email: application.person?.email ?? "-",
                        phone: application.person?.phone ?? null,
                        jdId: application.jobDescription?.id ?? null,
                        jdTitle: application.jobDescription?.title ?? "-",
                        status:
                            application.status ??
                            application.pipelineStatus ??
                            "SHORTLISTED",
                        pipelineStatus: application.pipelineStatus ?? "-",
                        createdAt: application.createdAt ?? "",
                        aiScore: application.screening?.aiScore ?? null,
                        finalScore: application.screening?.finalScore ?? null,
                        screening: application.screening
                            ? {
                                  strengths: application.screening.strengths,
                                  weaknesses: application.screening.weaknesses,
                                  summary: application.screening.summary,
                              }
                            : undefined,
                        testResults: application.person?.testResults ?? [],
                    })),
                );
            }

            if (interviewRes.ok) {
                const data = await interviewRes.json();
                type InterviewRaw = { id: string; job_application_id: string; interviewer_id?: string; interviewer_name?: string; interviewer?: { name?: string }; users?: { name?: string }; scheduled_at: string; status?: string; recruiter_note?: string | null };
                setInterviews(
                    (data.interviews ?? []).map((item: InterviewRaw) => ({
                        id: item.id,
                        jobApplicationId: item.job_application_id,
                        interviewerId: item.interviewer_id,
                        interviewerName:
                            item.interviewer_name ??
                            item.interviewer?.name ??
                            item.users?.name ??
                            "Interviewer",
                        scheduledAt: item.scheduled_at,
                        status: item.status ?? "scheduled",
                        recruiterNote: item.recruiter_note ?? null,
                    })),
                );
            }
        } catch (error) {
            console.error("Schedule page fetch error:", error);
            toast.error("Không thể tải dữ liệu lịch phỏng vấn.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        setPreselectHandled(false);
    }, [preselectedCandidateId]);

    const filteredCandidates = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return candidates.filter((candidate) => {
            return (
                candidate.fullName.toLowerCase().includes(query) ||
                candidate.jdTitle.toLowerCase().includes(query) ||
                candidate.email.toLowerCase().includes(query)
            );
        });
    }, [candidates, searchQuery]);

    useEffect(() => {
        if (
            preselectHandled ||
            !preselectedCandidateId ||
            loading ||
            candidates.length === 0
        ) {
            return;
        }

        const matchedCandidate = candidates.find(
            (candidate) => candidate.id === preselectedCandidateId,
        );

        if (matchedCandidate) {
            setSelectedCandidate(matchedCandidate);
        } else {
            toast.error(
                "Không tìm thấy ứng viên cần lên lịch hoặc ứng viên chưa đủ điều kiện SHORTLISTED.",
            );
        }

        setPreselectHandled(true);
    }, [candidates, loading, preselectHandled, preselectedCandidateId]);

    const interviewCountByCandidate = useMemo(() => {
        const map: Record<string, number> = {};
        interviews.forEach((item) => {
            map[item.jobApplicationId] = (map[item.jobApplicationId] ?? 0) + 1;
        });
        return map;
    }, [interviews]);

    const handleClearSelection = useCallback(() => {
        setSelectedCandidate(null);

        const params = new URLSearchParams(searchParams.toString());
        params.delete("id");
        const nextUrl = params.toString()
            ? `${pathname}?${params.toString()}`
            : pathname;
        router.replace(nextUrl, { scroll: false });
    }, [pathname, router, searchParams]);

    const handleSelectCandidate = useCallback(
        (candidate: Candidate) => {
            setSelectedCandidate(candidate);

            const params = new URLSearchParams(searchParams.toString());
            params.set("id", candidate.id);
            router.replace(`${pathname}?${params.toString()}`, {
                scroll: false,
            });
        },
        [pathname, router, searchParams],
    );

    const selectedCandidateInterviews = useMemo(() => {
        if (!selectedCandidate) return [];
        return interviews
            .filter((item) => item.jobApplicationId === selectedCandidate.id)
            .sort(
                (a, b) =>
                    new Date(b.scheduledAt).getTime() -
                    new Date(a.scheduledAt).getTime(),
            );
    }, [interviews, selectedCandidate]);

    const selectedTestResult = useMemo(() => {
        if (!selectedCandidate || selectedCandidate.testResults.length === 0)
            return null;
        return selectedCandidate.testResults[0];
    }, [selectedCandidate]);

    const scheduledAtLocal = useMemo(() => {
        if (!interviewDate || !startTime) return "";
        return `${interviewDate}T${startTime}`;
    }, [interviewDate, startTime]);

    const endTimeLabel = useMemo(() => {
        if (!scheduledAtLocal) return "-";
        const start = new Date(scheduledAtLocal);
        if (Number.isNaN(start.getTime())) return "-";
        const end = new Date(start.getTime() + Number(duration) * 60 * 1000);
        return formatTime(end.toISOString());
    }, [scheduledAtLocal, duration]);

    const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
    const selectedDateValue = useMemo(() => {
        if (!interviewDate) return null;
        const [year, month, day] = interviewDate.split("-").map(Number);
        if (!year || !month || !day) return null;
        return new Date(year, month - 1, day);
    }, [interviewDate]);
    const selectedHour = startTime ? Number(startTime.split(":")[0]) : 9;
    const selectedMinute = startTime ? startTime.split(":")[1] : "00";
    const selectedPeriod = selectedHour >= 12 ? "PM" : "AM";
    const selectedHour12 = selectedHour % 12 || 12;
    const hourOptions = Array.from({ length: 12 }, (_, index) => index + 1);
    const minuteOptions = ["00", "15", "30", "45"];

    function updateStartTime(nextHour12: number, nextMinute: string, nextPeriod: "AM" | "PM") {
        const hour24 = nextPeriod === "AM"
            ? nextHour12 % 12
            : (nextHour12 % 12) + 12;
        setStartTime(`${String(hour24).padStart(2, "0")}:${nextMinute}`);
        setFieldErrors((prev) => ({ ...prev, startTime: false }));
    }

    const handleSubmit = useCallback(
        async (event: React.FormEvent) => {
            event.preventDefault();

            const nextFieldErrors: Partial<Record<RequiredScheduleField, boolean>> = {
                interviewRound: !interviewRound.trim(),
                interviewDate: !interviewDate,
                startTime: !startTime,
                duration: !duration,
                locationType: !locationType,
            };
            setFieldErrors(nextFieldErrors);

            if (Object.values(nextFieldErrors).some(Boolean)) {
                toast.error("Vui lòng điền đủ vòng, ngày, giờ, thời lượng và hình thức phỏng vấn.");
                return;
            }

            if (!selectedCandidate || !scheduledAtLocal || !locationDetail.trim()) {
                toast.error("Vui lòng điền đầy đủ thông tin bắt buộc.");
                return;
            }

            const scheduledDate = new Date(scheduledAtLocal);
            if (Number.isNaN(scheduledDate.getTime())) {
                toast.error("Thời gian phỏng vấn không hợp lệ.");
                return;
            }

            if (scheduledDate.getTime() < Date.now()) {
                toast.error("Không thể tạo lịch ở thời điểm quá khứ.");
                return;
            }

            setSubmitting(true);
            try {
                const response = await fetch(
                    `/api/recruitment/applications/${selectedCandidate.id}/schedule-interview`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            scheduled_at: scheduledDate.toISOString(),
                            timezone:
                                Intl.DateTimeFormat().resolvedOptions()
                                    .timeZone,
                            recruiter_note: recruiterNote.trim(),
                            duration_minutes: parseInt(duration, 10),
                            location_type: locationType,
                            location_detail: locationDetail,
                            interview_round: interviewRound,
                        }),
                    },
                );

                if (!response.ok) {
                    const payload = await response.json();
                    toast.error(
                        payload.error || "Không thể lưu lịch phỏng vấn.",
                    );
                    return;
                }

                toast.success(
                    `Đã lên lịch phỏng vấn cho ${selectedCandidate.fullName}`,
                );
                handleClearSelection();

                setInterviewDate("");
                setStartTime("");
                setRecruiterNote("");
                fetchData();
            } catch (error) {
                console.error("Schedule submit error:", error);
                toast.error("Lỗi kết nối máy chủ.");
            } finally {
                setSubmitting(false);
            }
        },
        [
            duration,
            fetchData,
            handleClearSelection,
            interviewDate,
            interviewRound,
            locationDetail,
            locationType,
            recruiterNote,
            scheduledAtLocal,
            selectedCandidate,
            startTime,
        ],
    );

    return (
        <div className="min-h-dvh bg-[#0A0F1D] text-[#ECF0F7]">
            <AppNavbar user={user} />
            <BackgroundOrbs />

            <PageTransition>
                <main className="relative z-10 max-w-368 mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10">
                    <div className="pointer-events-none absolute inset-x-0 top-20 h-80 bg-[radial-gradient(ellipse_at_top,rgba(91,108,240,0.24),transparent_66%)]" />
                    <PageBreadcrumb breadcrumbs={[{ label: "Recruitment", href: "/dashboard/recruitment" }, { label: "Điều phối phỏng vấn" }]} />

                    <header className="mb-6 rounded-3xl border border-white/10 bg-[#111629]/85 backdrop-blur-md p-5 sm:p-7 shadow-[0_26px_70px_-34px_rgba(0,0,0,0.9)] relative overflow-hidden">
                        <div className="pointer-events-none absolute -right-20 -top-24 w-72 h-72 rounded-full bg-[#5B6CF0]/15 blur-3xl" />
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide bg-[#7C8FFF]/15 text-[#B6C2FF] border border-[#7C8FFF]/35">
                                    <CalendarClock size={14} />
                                    Điều phối tuyển dụng
                                </div>
                                <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
                                    Điều phối phỏng vấn
                                </h1>
                                <p className="mt-2 text-sm text-[#8B99B0] max-w-2xl">
                                    Xem đủ ngữ cảnh CV, test và trạng thái
                                    pipeline trước khi lên lịch để giảm sai sót
                                    điều phối.
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => router.push("/dashboard")}
                                    className="h-10 rounded-xl border-white/15 bg-white/5 hover:bg-white/10 text-[#ECF0F7]"
                                >
                                    <ArrowLeft size={14} className="mr-2" />
                                    Quay lại
                                </Button>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="rounded-2xl border border-white/10 bg-linear-to-b from-white/10 to-white/3 px-4 py-3">
                                <p className="text-xs text-[#8B99B0] inline-flex items-center gap-1.5">
                                    <Users size={13} /> Ứng viên chờ lịch
                                </p>
                                <p className="mt-1 text-xl font-semibold">
                                    {candidates.length}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-linear-to-b from-white/10 to-white/3 px-4 py-3">
                                <p className="text-xs text-[#8B99B0] inline-flex items-center gap-1.5">
                                    <Gauge size={13} /> Kết quả lọc
                                </p>
                                <p className="mt-1 text-xl font-semibold">
                                    {filteredCandidates.length}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-linear-to-b from-white/10 to-white/3 px-4 py-3">
                                <p className="text-xs text-[#8B99B0] inline-flex items-center gap-1.5">
                                    <UserCheck size={13} /> Lịch đã tạo
                                </p>
                                <p className="mt-1 text-xl font-semibold">
                                    {interviews.length}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-linear-to-b from-white/10 to-white/3 px-4 py-3">
                                <p className="text-xs text-[#8B99B0] inline-flex items-center gap-1.5">
                                    <BadgeCheck size={13} /> Trạng thái
                                </p>
                                <p className="mt-1 text-sm font-semibold text-emerald-400">
                                    Sẵn sàng điều phối
                                </p>
                            </div>
                        </div>
                    </header>

                    <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                        <aside className="xl:col-span-4 rounded-3xl border border-white/10 bg-[#111629]/80 backdrop-blur-md min-h-112 flex flex-col shadow-[0_24px_50px_-35px_rgba(0,0,0,0.9)]">
                            <div className="p-4 sm:p-5 border-b border-white/10">
                                <div className="flex items-center justify-between gap-2 mb-4">
                                    <h2 className="text-sm font-semibold tracking-wide text-[#8B99B0] flex items-center gap-2">
                                        <Users
                                            size={15}
                                            className="text-[#7C8FFF]"
                                        />
                                        Ứng viên đủ điều kiện phỏng vấn
                                    </h2>
                                    <span className="text-xs px-2 py-1 rounded-full bg-[#7C8FFF]/15 text-[#7C8FFF] border border-[#7C8FFF]/30">
                                        {filteredCandidates.length}
                                    </span>
                                </div>

                                <div className="relative">
                                    <Search
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6882]"
                                        size={15}
                                    />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(event) =>
                                            setSearchQuery(event.target.value)
                                        }
                                        placeholder="Tìm theo tên, email, vị trí, JD..."
                                        className="w-full h-11 rounded-xl border border-white/10 bg-[#0A0F1D] pl-10 pr-3 text-base placeholder:text-[#5A6882] focus:outline-none focus:ring-2 focus:ring-[#7C8FFF]/40"
                                    />
                                </div>
                            </div>

                            <motion.div
                                initial="hidden"
                                animate="show"
                                variants={{
                                    show: {
                                        transition: { staggerChildren: 0.04 },
                                    },
                                }}
                                className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2"
                            >
                                {loading ? (
                                    <div className="h-full min-h-44 grid place-items-center text-[#8B99B0]">
                                        <Loader2
                                            className="animate-spin"
                                            size={20}
                                        />
                                    </div>
                                ) : filteredCandidates.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/3 p-5 text-sm text-[#8B99B0]">
                                        Không tìm thấy ứng viên phù hợp.
                                    </div>
                                ) : (
                                    filteredCandidates.map((candidate) => {
                                        const active =
                                            selectedCandidate?.id ===
                                            candidate.id;
                                        const rounds =
                                            interviewCountByCandidate[
                                                candidate.id
                                            ] ?? 0;
                                        const test =
                                            candidate.testResults[0] ?? null;
                                        const needAttention =
                                            !test ||
                                            test.status !== "COMPLETED";

                                        return (
                                            <motion.button
                                                key={candidate.id}
                                                variants={cardVariants}
                                                onClick={() =>
                                                    handleSelectCandidate(
                                                        candidate,
                                                    )
                                                }
                                                className={`w-full text-left rounded-2xl border p-3 transition ${
                                                    active
                                                        ? "bg-[#1E2840] border-[#7C8FFF]/60 shadow-[0_12px_24px_-16px_rgba(91,108,240,0.8)]"
                                                        : "bg-[#0F172A]/70 border-white/10 hover:border-white/25 hover:bg-[#182238]"
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5 h-10 w-10 rounded-full bg-[#5B6CF0]/25 border border-[#7C8FFF]/40 text-[#ECF0F7] grid place-items-center font-semibold">
                                                        {candidate.fullName.charAt(
                                                            0,
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-sm font-semibold truncate">
                                                                {
                                                                    candidate.fullName
                                                                }
                                                            </p>
                                                            <span className="text-[10px] rounded-full px-2 py-0.5 bg-[#7C8FFF]/15 text-[#B6C2FF] border border-[#7C8FFF]/30">
                                                                R
                                                                {Math.max(
                                                                    1,
                                                                    rounds + 1,
                                                                )}
                                                            </span>
                                                        </div>

                                                        <p className="mt-1 text-xs text-[#8B99B0] truncate">
                                                            {candidate.jdTitle}
                                                        </p>
                                                        <p className="mt-1 text-[11px] text-[#5A6882] truncate">
                                                            {candidate.email}
                                                        </p>

                                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                                            <span className="text-[10px] uppercase tracking-wider rounded-full px-2 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                                                {
                                                                    candidate.pipelineStatus
                                                                }
                                                            </span>
                                                            <span className="text-[10px] rounded-full px-2 py-1 bg-white/5 border border-white/10 text-[#8B99B0]">
                                                                CV{" "}
                                                                {candidate.finalScore ??
                                                                    candidate.aiScore ??
                                                                    "-"}
                                                            </span>
                                                            <span
                                                                className={`text-[10px] rounded-full px-2 py-1 border ${
                                                                    needAttention
                                                                        ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                                                                        : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                                                }`}
                                                            >
                                                                Test:{" "}
                                                                {getTestStatusLabel(
                                                                    test?.status ??
                                                                        null,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.button>
                                        );
                                    })
                                )}
                            </motion.div>
                        </aside>

                        <div className="xl:col-span-8">
                            <AnimatePresence mode="wait">
                                {!selectedCandidate ? (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="rounded-3xl border border-white/10 bg-[#111629]/75 backdrop-blur-md min-h-112 p-8 sm:p-10 grid place-items-center text-center"
                                    >
                                        <div className="max-w-lg">
                                            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl border border-[#7C8FFF]/30 bg-[#7C8FFF]/15 grid place-items-center text-[#7C8FFF]">
                                                <Sparkles size={28} />
                                            </div>
                                            <h3 className="text-2xl font-bold">
                                                Sẵn sàng lên lịch phỏng vấn
                                            </h3>
                                            <p className="mt-3 text-[#8B99B0]">
                                                Chọn một ứng viên bên trái để
                                                xem ngữ cảnh CV, test, lịch sử
                                                vòng trước và tiến hành điều
                                                phối.
                                            </p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key={selectedCandidate.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="rounded-3xl border border-white/10 bg-[#111629]/80 backdrop-blur-md overflow-hidden shadow-[0_28px_65px_-36px_rgba(0,0,0,0.9)]"
                                    >
                                        <div className="p-5 sm:p-6 border-b border-white/10 bg-linear-to-r from-white/8 to-transparent">
                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                <div>
                                                    <h2 className="text-xl sm:text-2xl font-bold">
                                                        {
                                                            selectedCandidate.fullName
                                                        }
                                                    </h2>
                                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#8B99B0]">
                                                        <span className="inline-flex items-center gap-2 text-[#ECF0F7]">
                                                            <UserCheck
                                                                size={14}
                                                                className="text-[#7C8FFF]"
                                                            />
                                                            {
                                                                selectedCandidate.jdTitle
                                                            }
                                                        </span>
                                                        <span className="inline-flex items-center gap-2">
                                                            <Mail size={14} />
                                                            {
                                                                selectedCandidate.email
                                                            }
                                                        </span>
                                                        {selectedCandidate.phone && (
                                                            <span className="inline-flex items-center gap-2">
                                                                <Phone
                                                                    size={14}
                                                                />
                                                                {
                                                                    selectedCandidate.phone
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-9 rounded-lg border-white/15 bg-white/5 hover:bg-white/10"
                                                        onClick={() =>
                                                            router.push(`/dashboard/recruitment/${selectedCandidate.id}`)
                                                        }
                                                    >
                                                        <FileText
                                                            size={14}
                                                            className="mr-2"
                                                        />
                                                        Xem CV
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-9 rounded-lg border-white/15 bg-white/5 hover:bg-white/10"
                                                        onClick={() =>
                                                            router.push(
                                                                `/dashboard/recruitment/${selectedCandidate.id}`,
                                                            )
                                                        }
                                                    >
                                                        <Link2
                                                            size={14}
                                                            className="mr-2"
                                                        />
                                                        Xem hồ sơ
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                {/* Stage */}
                                                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-2.5">
                                                    <div className="h-7 w-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 grid place-items-center shrink-0">
                                                        <BadgeCheck size={13} className="text-emerald-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] text-emerald-500/60 font-medium uppercase tracking-wider">Stage</p>
                                                        <p className="text-xs font-bold text-emerald-300 truncate">{selectedCandidate.pipelineStatus}</p>
                                                    </div>
                                                </div>
                                                {/* CV Score */}
                                                {(() => {
                                                    const score = selectedCandidate.finalScore ?? selectedCandidate.aiScore ?? null;
                                                    const tone = getScoreTone(score);
                                                    return (
                                                        <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${tone.badge}`}>
                                                            <div className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 grid place-items-center shrink-0">
                                                                <Gauge size={13} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] font-medium uppercase tracking-wider opacity-60">Điểm CV</p>
                                                                <p className="text-xs font-bold">{tone.value}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                                {/* Test */}
                                                <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
                                                    selectedTestResult?.status === "COMPLETED"
                                                        ? "border-[#7C8FFF]/25 bg-[#7C8FFF]/8"
                                                        : "border-amber-500/25 bg-amber-500/8"
                                                }`}>
                                                    <div className={`h-7 w-7 rounded-lg grid place-items-center shrink-0 ${
                                                        selectedTestResult?.status === "COMPLETED"
                                                            ? "bg-[#7C8FFF]/15 border border-[#7C8FFF]/30 text-[#B6C2FF]"
                                                            : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                                                    }`}>
                                                        <FileText size={13} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={`text-[10px] font-medium uppercase tracking-wider opacity-60 ${
                                                            selectedTestResult?.status === "COMPLETED" ? "text-[#B6C2FF]" : "text-amber-300"
                                                        }`}>Test</p>
                                                        <p className={`text-xs font-bold truncate ${
                                                            selectedTestResult?.status === "COMPLETED" ? "text-[#C7D0FF]" : "text-amber-300"
                                                        }`}>
                                                            {getTestStatusLabel(selectedTestResult?.status ?? null)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5 sm:p-6 border-b border-white/10 bg-[#0F172A]/45">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="h-px flex-1 bg-white/8" />
                                                <p className="text-[10px] uppercase tracking-widest text-[#5A6882] font-semibold px-2">Decision Context</p>
                                                <div className="h-px flex-1 bg-white/8" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {/* AI Summary card */}
                                                <div className="relative rounded-2xl border border-[#7C8FFF]/20 bg-[#0A0F1D]/60 p-4 overflow-hidden">
                                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(124,143,255,0.08),transparent_60%)] pointer-events-none" />
                                                    <div className="relative">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="h-6 w-6 rounded-lg bg-[#7C8FFF]/20 border border-[#7C8FFF]/30 grid place-items-center">
                                                                <Sparkles size={12} className="text-[#B6C2FF]" />
                                                            </div>
                                                            <p className="text-xs font-semibold text-[#B6C2FF] tracking-wide">Tóm tắt AI</p>
                                                        </div>
                                                        <p className="text-sm leading-relaxed text-[#C8D0DF]">
                                                            {selectedCandidate.screening?.summary || "Chưa có tóm tắt AI."}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Test result card */}
                                                <div className={`relative rounded-2xl border p-4 overflow-hidden ${
                                                    selectedTestResult?.status === "COMPLETED"
                                                        ? "border-emerald-500/20 bg-[#0A0F1D]/60"
                                                        : "border-amber-500/20 bg-[#0A0F1D]/60"
                                                }`}>
                                                    <div className={`absolute inset-0 pointer-events-none ${
                                                        selectedTestResult?.status === "COMPLETED"
                                                            ? "bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.07),transparent_60%)]"
                                                            : "bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.07),transparent_60%)]"
                                                    }`} />
                                                    <div className="relative">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className={`h-6 w-6 rounded-lg grid place-items-center border ${
                                                                selectedTestResult?.status === "COMPLETED"
                                                                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                                                                    : "bg-amber-500/20 border-amber-500/30 text-amber-400"
                                                            }`}>
                                                                <BadgeCheck size={12} />
                                                            </div>
                                                            <p className={`text-xs font-semibold tracking-wide ${
                                                                selectedTestResult?.status === "COMPLETED" ? "text-emerald-300" : "text-amber-300"
                                                            }`}>Kết quả test</p>
                                                            {selectedTestResult && selectedTestResult.score !== null && (
                                                                <span className="ml-auto text-xs font-bold text-[#ECF0F7]">
                                                                    {selectedTestResult.score}/{selectedTestResult.total ?? "?"}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {selectedTestResult ? (
                                                            <div className="space-y-2">
                                                                <p className="text-sm text-[#C8D0DF]">
                                                                    {getTestStatusLabel(selectedTestResult.status)}
                                                                </p>
                                                                {selectedTestResult.score !== null && selectedTestResult.total !== null && (
                                                                    <div className="mt-2">
                                                                        <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
                                                                            <div
                                                                                className="h-full rounded-full bg-linear-to-r from-emerald-500 to-emerald-400 transition-all"
                                                                                style={{ width: `${Math.min(100, (selectedTestResult.score / selectedTestResult.total) * 100)}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                <p className="text-sm text-[#C8D0DF]">Chưa có dữ liệu test cho ứng viên này.</p>
                                                                <div className="inline-flex items-center gap-2 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2.5 py-1.5 mt-1">
                                                                    <AlertTriangle size={12} />
                                                                    Nên kiểm tra test trước khi xác nhận lịch.
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedCandidateInterviews.length >
                                                0 && (
                                                <div className="mt-4 rounded-2xl border border-white/10 bg-[#0B1222]/70 p-4">
                                                    <p className="text-sm font-semibold mb-3">
                                                        Lịch sử vòng phỏng vấn
                                                    </p>
                                                    <div className="space-y-2">
                                                        {selectedCandidateInterviews
                                                            .slice(0, 3)
                                                            .map(
                                                                (
                                                                    item,
                                                                    index,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            item.id
                                                                        }
                                                                        className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-sm"
                                                                    >
                                                                        <span className="text-[#C8D0DF]">
                                                                            Round{" "}
                                                                            {index +
                                                                                1}{" "}
                                                                            -{" "}
                                                                            {
                                                                                item.interviewerName
                                                                            }
                                                                        </span>
                                                                        <span className="text-[#8B99B0]">
                                                                            {formatDate(
                                                                                item.scheduledAt,
                                                                            )}{" "}
                                                                            {formatTime(
                                                                                item.scheduledAt,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <form
                                            onSubmit={handleSubmit}
                                            className="p-5 sm:p-6 space-y-5"
                                        >
                                            <div>
                                                <label
                                                    htmlFor="interview-round"
                                                    className="mb-2 block text-sm text-[#8B99B0]"
                                                >
                                                    Vòng phỏng vấn <span className="ml-1.5 text-rose-400">*</span>
                                                </label>
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        id="interview-round"
                                                        aria-invalid={fieldErrors.interviewRound || undefined}
                                                        onClick={() => setOpenPicker((current) => current === "round" ? null : "round")}
                                                        className={`w-full h-12 rounded-xl border bg-[#0A0F1D] px-4 pr-10 text-left text-base text-[#ECF0F7] focus:outline-none focus:ring-2 focus:ring-[#7C8FFF]/40 ${fieldErrors.interviewRound ? "border-rose-500/60" : "border-white/10"}`}
                                                    >
                                                        {INTERVIEW_ROUND_OPTIONS.find((option) => option.value === interviewRound)?.label ?? "Ch?n v?ng ph?ng v?n"}
                                                    </button>
                                                    <ChevronDown
                                                        size={16}
                                                        className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6882] transition-transform ${openPicker === "round" ? "rotate-180" : ""}`}
                                                    />
                                                    {openPicker === "round" && (
                                                        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-[#5B6CF0]/40 bg-[#0A0F1D] shadow-[0_18px_50px_rgba(0,0,0,0.55)]">
                                                            {INTERVIEW_ROUND_OPTIONS.map((option) => (
                                                                <button
                                                                    key={option.value}
                                                                    type="button"
                                                                    onMouseDown={() => {
                                                                        setInterviewRound(option.value);
                                                                        setFieldErrors((prev) => ({ ...prev, interviewRound: false }));
                                                                        setOpenPicker(null);
                                                                    }}
                                                                    className={`block w-full px-4 py-2.5 text-left text-base transition-colors ${interviewRound === option.value ? "bg-[#5B6CF0]/25 text-white" : "text-[#ECF0F7] hover:bg-white/10"}`}
                                                                >
                                                                    {option.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label
                                                        htmlFor="interview-date"
                                                        className="mb-2 block text-sm text-[#8B99B0]"
                                                    >
                                                        Ngày phỏng vấn <span className="ml-1.5 text-rose-400">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <button
                                                            type="button"
                                                            id="interview-date"
                                                            aria-invalid={fieldErrors.interviewDate || undefined}
                                                            onClick={() => setOpenPicker((current) => current === "date" ? null : "date")}
                                                            className={`w-full h-12 rounded-xl border bg-[#0A0F1D] px-4 pr-11 text-left text-base focus:outline-none focus:ring-2 focus:ring-[#7C8FFF]/40 ${fieldErrors.interviewDate ? "border-rose-500/60" : "border-white/10"} ${interviewDate ? "text-[#ECF0F7]" : "text-[#8B99B0]"}`}
                                                        >
                                                            {formatDateDisplay(interviewDate)}
                                                        </button>
                                                        <Calendar size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8B99B0]" />
                                                        {openPicker === "date" && (
                                                            <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-2xl border border-[#5B6CF0]/30 bg-[#0A0F1D] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.6)]">
                                                                <div className="mb-3 flex items-center justify-between">
                                                                    <button type="button" className="text-sm font-semibold text-[#ECF0F7]" onMouseDown={() => setCalendarMonth(new Date())}>
                                                                        {MONTH_LABELS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                                                                    </button>
                                                                    <div className="flex items-center gap-2">
                                                                        <button type="button" className="rounded-lg p-1.5 text-[#8B99B0] hover:bg-white/10 hover:text-white" onMouseDown={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>?</button>
                                                                        <button type="button" className="rounded-lg p-1.5 text-[#8B99B0] hover:bg-white/10 hover:text-white" onMouseDown={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>?</button>
                                                                    </div>
                                                                </div>
                                                                <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#ECF0F7]">
                                                                    {WEEKDAY_LABELS.map((day) => <div key={day}>{day}</div>)}
                                                                </div>
                                                                <div className="grid grid-cols-7 gap-1">
                                                                    {calendarDays.map((date) => {
                                                                        const value = formatDateInput(date);
                                                                        const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                                                                        const isSelected = selectedDateValue?.toDateString() === date.toDateString();
                                                                        return (
                                                                            <button
                                                                                key={value}
                                                                                type="button"
                                                                                onMouseDown={() => {
                                                                                    setInterviewDate(value);
                                                                                    setFieldErrors((prev) => ({ ...prev, interviewDate: false }));
                                                                                    setOpenPicker(null);
                                                                                }}
                                                                                className={`h-8 rounded-lg text-sm font-semibold transition-colors ${isSelected ? "bg-[#5B6CF0] text-white ring-1 ring-white/50" : isCurrentMonth ? "text-[#ECF0F7] hover:bg-white/10" : "text-[#5A6882] hover:bg-white/5"}`}
                                                                            >
                                                                                {date.getDate()}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                                <div className="mt-3 flex items-center justify-between text-sm">
                                                                    <button type="button" className="text-[#8B99B0] hover:text-white" onMouseDown={() => setInterviewDate("")}>Clear</button>
                                                                    <button type="button" className="text-[#7C8FFF] hover:text-white" onMouseDown={() => {
                                                                        const today = new Date();
                                                                        setCalendarMonth(today);
                                                                        setInterviewDate(formatDateInput(today));
                                                                        setFieldErrors((prev) => ({ ...prev, interviewDate: false }));
                                                                        setOpenPicker(null);
                                                                    }}>Today</button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label
                                                        htmlFor="start-time"
                                                        className="mb-2 block text-sm text-[#8B99B0]"
                                                    >
                                                        Giờ bắt đầu <span className="ml-1.5 text-rose-400">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <button
                                                            type="button"
                                                            id="start-time"
                                                            aria-invalid={fieldErrors.startTime || undefined}
                                                            onClick={() => setOpenPicker((current) => current === "time" ? null : "time")}
                                                            className={`w-full h-12 rounded-xl border bg-[#0A0F1D] px-4 pr-11 text-left text-base focus:outline-none focus:ring-2 focus:ring-[#7C8FFF]/40 ${fieldErrors.startTime ? "border-rose-500/60" : "border-white/10"} ${startTime ? "text-[#ECF0F7]" : "text-[#8B99B0]"}`}
                                                        >
                                                            {formatTimeDisplay(startTime)}
                                                        </button>
                                                        <Clock3 size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8B99B0]" />
                                                        {openPicker === "time" && (
                                                            <div className="absolute left-0 top-full z-50 mt-2 grid w-64 grid-cols-3 gap-1 rounded-2xl border border-[#5B6CF0]/30 bg-[#0A0F1D] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.6)]">
                                                                <div className="max-h-56 overflow-y-auto pr-1">
                                                                    {hourOptions.map((hour) => (
                                                                        <button key={hour} type="button" onMouseDown={() => updateStartTime(hour, selectedMinute, selectedPeriod)} className={`block h-9 w-full rounded-lg text-sm font-semibold ${selectedHour12 === hour ? "bg-[#93C5FD] text-[#0A0F1D]" : "text-[#ECF0F7] hover:bg-white/10"}`}>
                                                                            {String(hour).padStart(2, "0")}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                <div className="max-h-56 overflow-y-auto pr-1">
                                                                    {minuteOptions.map((minute) => (
                                                                        <button key={minute} type="button" onMouseDown={() => updateStartTime(selectedHour12, minute, selectedPeriod)} className={`block h-9 w-full rounded-lg text-sm font-semibold ${selectedMinute === minute ? "bg-white/80 text-[#0A0F1D]" : "text-[#ECF0F7] hover:bg-white/10"}`}>
                                                                            {minute}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                <div>
                                                                    {(["AM", "PM"] as const).map((period) => (
                                                                        <button key={period} type="button" onMouseDown={() => updateStartTime(selectedHour12, selectedMinute, period)} className={`block h-9 w-full rounded-lg text-sm font-bold ${selectedPeriod === period ? "bg-white/90 text-[#0A0F1D]" : "text-[#ECF0F7] hover:bg-white/10"}`}>
                                                                            {period}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="mb-2 block text-sm text-[#8B99B0]">
                                                        Thời lượng <span className="ml-1.5 text-rose-400">*</span>
                                                    </label>
                                                    <div className={`grid grid-cols-4 gap-2 rounded-xl border bg-[#0A0F1D] p-1.5 ${fieldErrors.duration ? "border-rose-500/60" : "border-white/10"}`}>
                                                        {[
                                                            "30",
                                                            "45",
                                                            "60",
                                                            "90",
                                                        ].map((minute) => (
                                                            <button
                                                                key={minute}
                                                                type="button"
                                                                onClick={() => {
                                                                    setDuration(
                                                                        minute,
                                                                    );
                                                                    setFieldErrors((prev) => ({ ...prev, duration: false }));
                                                                }}
                                                                className={`h-9 rounded-lg text-sm transition ${
                                                                    duration ===
                                                                    minute
                                                                        ? "bg-[#5B6CF0] text-white"
                                                                        : "text-[#8B99B0] hover:bg-white/10"
                                                                }`}
                                                            >
                                                                {minute}m
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-sm text-[#B7C3D9] flex flex-wrap items-center gap-3">
                                                <span className="inline-flex items-center gap-2">
                                                    <Clock3 size={14} /> Kết
                                                    thúc dự kiến: {endTimeLabel}
                                                </span>
                                                <span className="inline-flex items-center gap-2">
                                                    <Calendar size={14} /> Múi
                                                    giờ:{" "}
                                                    {
                                                        Intl.DateTimeFormat().resolvedOptions()
                                                            .timeZone
                                                    }
                                                </span>
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm text-[#8B99B0]">
                                                    Hình thức phỏng vấn <span className="ml-1.5 text-rose-400">*</span>
                                                </label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setLocationType(
                                                                "online",
                                                            );
                                                            setFieldErrors((prev) => ({ ...prev, locationType: false }));
                                                        }}
                                                        aria-pressed={locationType === "online"}
                                                        aria-invalid={fieldErrors.locationType || undefined}
                                                        className={`h-11 rounded-xl border text-sm flex items-center justify-center gap-2 transition ${
                                                            locationType ===
                                                            "online"
                                                                ? "border-[#7C8FFF]/40 bg-[#7C8FFF]/15 text-[#C7D0FF]"
                                                                : "border-white/10 bg-[#0A0F1D] text-[#8B99B0] hover:bg-white/10"
                                                        }`}
                                                    >
                                                        <Video size={14} />
                                                        Online
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setLocationType(
                                                                "office",
                                                            );
                                                            setFieldErrors((prev) => ({ ...prev, locationType: false }));
                                                        }}
                                                        aria-pressed={locationType === "office"}
                                                        aria-invalid={fieldErrors.locationType || undefined}
                                                        className={`h-11 rounded-xl border text-sm flex items-center justify-center gap-2 transition ${
                                                            locationType ===
                                                            "office"
                                                                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                                                                : "border-white/10 bg-[#0A0F1D] text-[#8B99B0] hover:bg-white/10"
                                                        }`}
                                                    >
                                                        <Building2 size={14} />
                                                        Văn phòng
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setLocationType(
                                                                "phone",
                                                            );
                                                            setFieldErrors((prev) => ({ ...prev, locationType: false }));
                                                        }}
                                                        aria-pressed={locationType === "phone"}
                                                        aria-invalid={fieldErrors.locationType || undefined}
                                                        className={`h-11 rounded-xl border text-sm flex items-center justify-center gap-2 transition ${
                                                            locationType ===
                                                            "phone"
                                                                ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300"
                                                                : "border-white/10 bg-[#0A0F1D] text-[#8B99B0] hover:bg-white/10"
                                                        }`}
                                                    >
                                                        <Phone size={14} />
                                                        Phone
                                                    </button>
                                                </div>

                                                <div className="relative mt-3">
                                                    <MapPin
                                                        size={16}
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6882]"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={locationDetail}
                                                        onChange={(event) =>
                                                            setLocationDetail(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder={
                                                            locationType ===
                                                            "online"
                                                                ? "Nhập link họp"
                                                                : locationType ===
                                                                    "office"
                                                                  ? "Nhập địa điểm/phòng họp"
                                                                  : "Nhập hướng dẫn gọi điện"
                                                        }
                                                        className="w-full h-12 rounded-xl border border-white/10 bg-[#0A0F1D] pl-10 pr-3 text-base focus:outline-none focus:ring-2 focus:ring-[#7C8FFF]/40"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm text-[#8B99B0]">
                                                    Ghi chú cho interviewer
                                                </label>
                                                <textarea
                                                    rows={4}
                                                    value={recruiterNote}
                                                    onChange={(event) =>
                                                        setRecruiterNote(
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Thêm lưu ý trọng tâm cần phỏng vấn, điểm cần xác minh"
                                                    className="w-full rounded-xl border border-white/10 bg-[#0A0F1D] p-3 text-base focus:outline-none focus:ring-2 focus:ring-[#7C8FFF]/40 resize-y"
                                                />
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-3 pt-1">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        toast.info(
                                                            "Lưu nháp sẽ được bổ sung ở giai đoạn tiếp theo.",
                                                        )
                                                    }
                                                    className="h-11 rounded-xl border-white/15 bg-white/5 hover:bg-white/10"
                                                >
                                                    Lưu nháp
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setSelectedCandidate(
                                                            null,
                                                        )
                                                    }
                                                    className="h-11 rounded-xl border-white/15 bg-white/5 hover:bg-white/10"
                                                >
                                                    Hủy
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={submitting}
                                                    className="h-11 rounded-xl bg-linear-to-r from-[#5B6CF0] via-[#6577FF] to-[#4B5DE4] hover:brightness-110 text-white sm:min-w-56 shadow-[0_12px_26px_-12px_rgba(91,108,240,0.85)]"
                                                >
                                                    {submitting ? (
                                                        <span className="inline-flex items-center gap-2">
                                                            <Loader2
                                                                className="animate-spin"
                                                                size={16}
                                                            />
                                                            Đang lưu lịch...
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-2 font-semibold">
                                                            <Timer size={16} />
                                                            Xác nhận lên lịch
                                                        </span>
                                                    )}
                                                </Button>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </section>
                </main>
            </PageTransition>
        </div>
    );
}
