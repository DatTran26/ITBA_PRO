"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/motion-wrapper";
import AppNavbar from "@/components/ui/app-navbar";
import PageContainer from "@/components/ui/page-container";
import { useUiLayout } from "@/components/ui/ui-layout-context";
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import KpiCardGrid from "@/components/crm/kpi-card-grid";
import OverviewBand from "@/components/shares/overview-band";
import MonthlyChart from "@/components/dashboard/monthly-chart";
import PipelineOverview from "@/components/dashboard/pipeline-overview";
import AssessmentGrid from "@/components/dashboard/assessment-grid";
import CandidatesAttention from "@/components/dashboard/candidates-attention";
import AiInsights from "@/components/dashboard/ai-insights";
import DashboardModeTabs from "@/components/dashboard/dashboard-mode-tabs";
import EmployeeKpiCards from "@/components/dashboard/employee-kpi-cards";
import SkillGapOverview from "@/components/dashboard/skill-gap-overview";
import AdminKpiCards from "@/components/dashboard/admin-kpi-cards";
import TokenUsageChart from "@/components/dashboard/token-usage-chart";
import FeatureBreakdown from "@/components/dashboard/feature-breakdown";
import ActiveRecruiters from "@/components/dashboard/active-recruiters";
import AdminQuickLinks from "@/components/dashboard/admin-quick-links";
import { ShieldAlert, Trash2, Power, AlertTriangle, CheckCircle2,
         Database, Send, Clock, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { DashboardUser, DashboardTest, DashboardStats, PipelineStage, AttentionCandidate, MonthlyData, PendingAiResult, DashboardMode, EmployeeStats, SkillGapItem, AdminStats } from "./types";
import HrDashboardClient from "./hr-dashboard-client";
import InterviewerDashboardClient from "./interviewer-dashboard-client";

export default function DashboardClient({
    mode = "recruitment", user, tests, stats, pipeline, monthlyData, attentionCandidates, pendingAiResults, employeeStats, skillGaps, adminStats, isAdmin, isHr,
}: {
    mode?: DashboardMode;
    user: DashboardUser;
    tests: DashboardTest[];
    stats: DashboardStats;
    pipeline: PipelineStage[];
    monthlyData: MonthlyData[];
    attentionCandidates: AttentionCandidate[];
    pendingAiResults: PendingAiResult[];
    employeeStats?: EmployeeStats | null;
    skillGaps?: SkillGapItem[];
    adminStats?: AdminStats | null;
    isAdmin?: boolean;
    isHr?: boolean;
}) {
    const layout = useUiLayout();
    const [localTests, setLocalTests] = useState(tests);
    const [confirmToggle, setConfirmToggle] = useState<{ id: string; status: string; name: string } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
    const [isToggling, setIsToggling] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleConfirmToggle() {
        if (!confirmToggle) return;
        setIsToggling(true);
        const { id, status } = confirmToggle;
        const newStatus = status === "active" ? "completed" : "active";
        try {
            const res = await fetch(`/api/tests/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error("Failed");
            setLocalTests((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
            toast.success(`Test ${newStatus === "active" ? "reactivated" : "deactivated"}`);
        } catch {
            toast.error("Status update failed");
        } finally {
            setIsToggling(false);
            setConfirmToggle(null);
        }
    }

    async function handleConfirmDelete() {
        if (!confirmDelete) return;
        setIsDeleting(true);
        const { id } = confirmDelete;
        try {
            const res = await fetch(`/api/tests/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Deletion failed");
            setLocalTests((prev) => prev.filter((t) => t.id !== id));
            toast.success("Assessment deleted successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete assessment");
        } finally {
            setIsDeleting(false);
            setConfirmDelete(null);
        }
    }

    // Sáu thẻ trải ngang, lấy thẳng từ DashboardStats mà trang chủ đã tính.
    const recruitmentKpis = [
        { label: "Đề thi đang mở", value: stats.activeTests, icon: Database },
        { label: "Lượt nộp", value: stats.totalSubmissions, icon: Send },
        { label: "Chờ duyệt", value: stats.pendingReview, icon: Clock },
        { label: "Đạt", value: stats.passed, icon: CheckCircle },
        { label: "Không đạt", value: stats.failed, icon: XCircle },
        { label: "Chờ AI chấm", value: stats.pendingAiReview, icon: Sparkles },
    ];

    return (
        <PageTransition className="min-h-screen bg-transparent text-foreground font-body selection:bg-primary/30 selection:text-white pb-12">
            {layout !== "sidebar" && <AppNavbar user={user} />}

            <PageContainer className="relative z-10">
                <DashboardHeader userRole={user.role} />
                <DashboardModeTabs activeMode={mode} role={user.role} />

                {mode === "hr" ? (
                    <HrDashboardClient user={user} />
                ) : mode === "interviewer" ? (
                    <InterviewerDashboardClient user={user} />
                ) : mode === "admin" && adminStats ? (
                    <>
                        <AdminKpiCards stats={adminStats} />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
                            <TokenUsageChart data={adminStats.tokensByDay} />
                            <FeatureBreakdown data={adminStats.tokensByFeature} />
                        </div>
                        <div className="mt-6">
                            <ActiveRecruiters data={adminStats.topRecruiters} />
                        </div>
                        <div className="mt-6">
                            <AdminQuickLinks />
                        </div>
                    </>
                ) : mode === "recruitment" ? (
                    <>
                        <div className="mb-6">
                            <KpiCardGrid items={recruitmentKpis} />
                        </div>

                        <OverviewBand>
                            <PipelineOverview stages={pipeline} />
                            <MonthlyChart data={monthlyData} />
                            <AiInsights stats={stats} tests={localTests} pendingAiResults={pendingAiResults} />
                        </OverviewBand>

                        <CandidatesAttention candidates={attentionCandidates} />
                        <AssessmentGrid
                            tests={localTests}
                            onToggleStatus={setConfirmToggle}
                            onDelete={setConfirmDelete}
                        />
                    </>
                ) : (
                    <>
                        <div className="mb-6">
                            <EmployeeKpiCards stats={employeeStats ?? null} />
                        </div>

                        <OverviewBand>
                            <PipelineOverview stages={pipeline} title="Tiến trình đánh giá" />
                            <MonthlyChart data={monthlyData} />
                            <SkillGapOverview gaps={skillGaps ?? []} />
                        </OverviewBand>

                        <AssessmentGrid
                            tests={localTests}
                            onToggleStatus={setConfirmToggle}
                            onDelete={setConfirmDelete}
                        />
                    </>
                )}
            </PageContainer>

            {/* Status Toggle Dialog - Pro VIP */}
            <Dialog open={!!confirmToggle} onOpenChange={(open) => !open && setConfirmToggle(null)}>
                <DialogContent className="bg-background/95 border-muted-foreground/20 text-foreground sm:max-w-[440px] rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
                    <DialogHeader className="relative z-10 flex flex-col items-center">
                        <div className={`p-4 rounded-3xl mb-6 border ${confirmToggle?.status === "active" ? "bg-amber-400/10 border-amber-400/20 text-amber-400" : "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"}`}>
                            <Power className="w-8 h-8" />
                        </div>
                        <DialogTitle className="text-2xl font-bold font-display text-center">Change Visibility?</DialogTitle>
                        <DialogDescription className="text-muted-foreground text-center text-base mt-2 max-w-[300px]">
                            {confirmToggle
                                ? confirmToggle.status === "active"
                                    ? `This will hide ${confirmToggle.name} from current candidates.`
                                    : `This will make ${confirmToggle.name} live for new candidates.`
                                : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="relative z-10 flex flex-col sm:flex-row gap-3 mt-8">
                        <Button variant="ghost" onClick={() => setConfirmToggle(null)} disabled={isToggling} className="flex-1 text-muted-foreground hover:text-foreground hover:bg-muted h-14 rounded-2xl font-bold cursor-pointer">Discard</Button>
                        <Button onClick={handleConfirmToggle} disabled={isToggling}
                            className={`flex-1 h-14 px-8 rounded-2xl font-bold shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                                confirmToggle?.status === "active"
                                ? "bg-amber-500 hover:bg-amber-600 text-foreground"
                                : "bg-emerald-500 hover:bg-emerald-600 text-black font-black"
                            }`}>
                            {isToggling ? "Updating..." : confirmToggle?.status === "active" ? "Deactivate" : "Reactivate"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Permanent Delete Dialog - Pro VIP */}
            <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
                <DialogContent className="bg-background/95 border-rose-500/30 text-foreground sm:max-w-[440px] rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 blur-[60px] rounded-full pointer-events-none" />
                    <DialogHeader className="relative z-10 flex flex-col items-center">
                        <div className="p-4 rounded-3xl mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400">
                            <Trash2 className="w-8 h-8" />
                        </div>
                        <DialogTitle className="text-2xl font-bold font-display text-center">Delete Permanently?</DialogTitle>
                        <DialogDescription className="text-rose-200/60 text-center text-sm mt-3 px-4 py-3 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                            <span className="flex items-center gap-2 font-bold text-rose-400 mb-1 justify-center">
                                <AlertTriangle className="w-4 h-4" /> Final Warning
                            </span>
                            Deleting <span className="text-rose-300 font-bold underline decoration-rose-500/50">{confirmDelete?.name}</span> will erase all candidate results and evaluation metrics. This action is irreversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="relative z-10 flex flex-col sm:flex-row gap-3 mt-8">
                        <Button variant="ghost" onClick={() => setConfirmDelete(null)} disabled={isDeleting} className="flex-1 text-muted-foreground hover:text-foreground hover:bg-muted h-14 rounded-2xl font-bold cursor-pointer">Keep It</Button>
                        <Button onClick={handleConfirmDelete} disabled={isDeleting}
                            className="flex-1 h-14 px-8 rounded-2xl font-bold bg-rose-500 hover:bg-rose-600 text-foreground shadow-xl shadow-rose-900/20 transition-all hover:scale-105 active:scale-95 cursor-pointer">
                            {isDeleting ? "Deleting..." : "Confirm Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageTransition>
    );
}
