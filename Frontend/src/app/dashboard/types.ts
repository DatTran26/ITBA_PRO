/* Shared dashboard types used by page.tsx and all dashboard components */

export interface DashboardUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

export interface DashboardTest {
    id: string;
    title?: string;
    job_role: string;
    level: string;
    share_token: string;
    status: string;
    created_at: string;
    question_count: number;
    questions: { count: number } | { count: number }[];
    target_type?: string;
    position_id?: string | null;
    group_id?: string | null;
    /* Enriched per-test result stats */
    resultCount: number;
    passCount: number;
    failCount: number;
    pendingCount: number;
    avgScore: number | null;
}

export interface DashboardStats {
    activeTests: number;
    totalSubmissions: number;
    pendingReview: number;
    passed: number;
    failed: number;
    pendingAiReview: number;
}

export interface PipelineStage {
    label: string;
    count: number;
    color: string;
    bgColor: string;
}

export interface MonthlyData {
    month: number;
    passed: number;
    failed: number;
}

export interface PendingAiResult {
    id: string;
    name: string;
}

export type DashboardMode =
    | "hr"          // HR pipeline — visible to all roles
    | "interviewer" // Interviewer overview — visible to all roles
    | "recruitment" // Assessments / tests
    | "employee"    // Employee evaluation
    | "admin";      // Admin stats

export interface AdminStats {
    totalUsers: number;
    totalAdmins: number;
    totalRecruiters: number;
    totalAssessments: number;
    totalSubmissions: number;
    totalTokensIn: number;
    totalTokensOut: number;
    totalCost: number;
    tokensByFeature: { feature: string; tokens: number; cost: number }[];
    tokensByDay: { date: string; tokens: number; cost: number }[];
    topRecruiters: { name: string; email: string; testCount: number }[];
    latestVersion: { version_number: string; title: string; status: string; created_at: string } | null;
}

export interface EmployeeStats {
    employeesEvaluated: number;
    avgSkillScore: number | null;
    positionsWithGaps: number;
    pendingEvaluations: number;
    evaluationCompletion: number;
}

export interface EmployeePipelineStage {
    label: string;
    count: number;
    color: string;
    bgColor: string;
}

export interface SkillGapItem {
    skillName: string;
    category: string | null;
    avgScore: number;
    requiredLevel: number;
    gapSize: number;
    evaluationCount: number;
}

export interface AttentionCandidate {
    id: string;
    candidate_name: string;
    candidate_email: string;
    testName: string;
    testId: string;
    score: number;
    totalQuestions: number;
    status: string | null;
    hasAiAnalysis: boolean;
    submittedAt: string;
    reason: "pending_review" | "no_ai_analysis" | "borderline";
}
