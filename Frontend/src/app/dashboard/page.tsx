import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DashboardStats, PipelineStage, AttentionCandidate, DashboardTest, MonthlyData, DashboardMode, EmployeeStats, SkillGapItem, AdminStats } from "./types";
import { cookies } from "next/headers";
import { DEV_AUTH_COOKIE, parseDevAuthCookie } from "@/lib/dev-auth";

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ mode?: string }>;
}) {
    const { mode: modeParam } = await searchParams;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const cookieStore = await cookies();
    const devUser = parseDevAuthCookie(cookieStore.get(DEV_AUTH_COOKIE)?.value);
    if (!user && !devUser) redirect("/login");

    let userData = devUser;
    if (user) {
        const { data } = await supabase
            .from("users")
            .select("*")
            .eq("auth_id", user.id)
            .single();
        userData = data;
    }

    if (!userData && user) {
        const defaultName = user.user_metadata?.name || user.email?.split("@")[0] || "Admin";
        const defaultEmail = user.email || "";
        const { data: insertedUser } = await supabase
            .from("users")
            .insert({
                auth_id: user.id,
                email: defaultEmail,
                name: defaultName,
                role: "super_admin",
            })
            .select("*")
            .single();

        userData = insertedUser || {
            id: user.id,
            auth_id: user.id,
            email: defaultEmail,
            name: defaultName,
            role: "super_admin",
            created_at: new Date().toISOString(),
        };
    }
    if (!userData) redirect("/login");

    const isAdmin = userData?.role === "admin" || userData?.role === "super_admin";
    const isHr = userData?.role === "hr";
    const isInterviewer = userData?.role === "interviewer";
    const role = (userData?.role as string) || "super_admin";

    const roleDefaultMode: Record<string, DashboardMode> = {
        super_admin: "recruitment", admin: "recruitment",
        recruiter: "recruitment", hr: "hr",
        interviewer: "interviewer",
    };
    const validModesForRole: Record<string, DashboardMode[]> = {
        admin:       ["hr", "interviewer", "recruitment", "employee", "admin"],
        super_admin: ["hr", "interviewer", "recruitment", "employee", "admin"],
        recruiter:   ["recruitment", "employee"],
        hr:          ["hr"],
        interviewer: ["hr", "interviewer"],
    };
    const validModes = validModesForRole[role] ?? ["recruitment"];
    const mode: DashboardMode = validModes.includes(modeParam as DashboardMode)
        ? (modeParam as DashboardMode)
        : (roleDefaultMode[role] ?? "recruitment");

    // HR/Interviewer modes: skip all heavy server fetching — data loaded client-side
    if (mode === "hr" || mode === "interviewer") {
        return (
            <DashboardClient
                mode={mode}
                user={userData}
                tests={[]}
                stats={{ activeTests: 0, totalSubmissions: 0, pendingReview: 0, passed: 0, failed: 0, pendingAiReview: 0 }}
                pipeline={[]}
                monthlyData={[]}
                attentionCandidates={[]}
                pendingAiResults={[]}
                isAdmin={isAdmin}
                isHr={isHr}
            />
        );
    }

    // Fetch admin stats if admin mode
    let adminStats: AdminStats | null = null;
    if (mode === "admin") {
        const adminDb = createAdminClient();
        const { data: allUsers } = await adminDb.from("users").select("role");
        const { count: testCount } = await adminDb.from("tests").select("*", { count: "exact", head: true });
        const { count: resultCount } = await adminDb.from("results").select("*", { count: "exact", head: true });

        const thirtyDaysAgoDate = new Date();
        thirtyDaysAgoDate.setUTCDate(thirtyDaysAgoDate.getUTCDate() - 30);
        const thirtyDaysAgo = thirtyDaysAgoDate.toISOString();
        const { data: usageData } = await adminDb
            .from("ai_usage")
            .select("feature, tokens_in, tokens_out, cost_estimate, created_at")
            .gte("created_at", thirtyDaysAgo);

        const usage = usageData || [];
        const totalTokensIn = usage.reduce((s, u) => s + (u.tokens_in || 0), 0);
        const totalTokensOut = usage.reduce((s, u) => s + (u.tokens_out || 0), 0);
        const totalCost = usage.reduce((s, u) => s + Number(u.cost_estimate || 0), 0);

        // Group by feature
        const featureMap = new Map<string, { tokens: number; cost: number }>();
        for (const u of usage) {
            const f = featureMap.get(u.feature) || { tokens: 0, cost: 0 };
            f.tokens += (u.tokens_in || 0) + (u.tokens_out || 0);
            f.cost += Number(u.cost_estimate || 0);
            featureMap.set(u.feature, f);
        }

        // Group by day
        const dayMap = new Map<string, { tokens: number; cost: number }>();
        for (const u of usage) {
            const day = u.created_at ? u.created_at.slice(0, 10) : "unknown";
            const d = dayMap.get(day) || { tokens: 0, cost: 0 };
            d.tokens += (u.tokens_in || 0) + (u.tokens_out || 0);
            d.cost += Number(u.cost_estimate || 0);
            dayMap.set(day, d);
        }

        // Top recruiters
        const { data: recruiterTests } = await adminDb
            .from("tests")
            .select("recruiter_id, users(name, email)");
        const recruiterMap = new Map<string, { name: string; email: string; count: number }>();
        for (const t of recruiterTests || []) {
            const u = t.users as unknown as { name: string; email: string } | null;
            const existing = recruiterMap.get(t.recruiter_id) || { name: u?.name || "", email: u?.email || "", count: 0 };
            existing.count++;
            recruiterMap.set(t.recruiter_id, existing);
        }
        const topRecruiters = [...recruiterMap.values()].sort((a, b) => b.count - a.count).slice(0, 5)
            .map((r) => ({ name: r.name, email: r.email, testCount: r.count }));

        // Latest version
        const { data: latestVer } = await adminDb
            .from("versions")
            .select("version_number, title, status, created_at")
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        const users = allUsers || [];
        adminStats = {
            totalUsers: users.length,
            totalAdmins: users.filter((u) => u.role === "admin" || u.role === "super_admin").length,
            totalRecruiters: users.filter((u) => u.role === "recruiter").length,
            totalAssessments: testCount || 0,
            totalSubmissions: resultCount || 0,
            totalTokensIn: totalTokensIn,
            totalTokensOut: totalTokensOut,
            totalCost: totalCost,
            tokensByFeature: [...featureMap.entries()].map(([feature, v]) => ({ feature, ...v })),
            tokensByDay: [...dayMap.entries()].map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date)),
            topRecruiters,
            latestVersion: latestVer || null,
        };
    }

    let testsQuery = supabase
        .from("tests")
        .select("*, questions(count)")
        .order("created_at", { ascending: false });

    if (userData?.role !== "admin") {
        testsQuery = testsQuery.eq("recruiter_id", userData?.id);
    }

    const { data: rawTests } = await testsQuery;
    const allTestsList = rawTests || [];

    // Filter tests by mode
    const modeTests = mode === "employee"
        ? allTestsList.filter((t) => t.target_type === "employee")
        : allTestsList.filter((t) => t.target_type !== "employee");

    const testIds = modeTests.map((t) => t.id);

    const { data: results } = testIds.length > 0
        ? await supabase
            .from("results")
            .select("id, test_id, candidate_name, candidate_email, score, total_questions, ai_analysis, status, submitted_at, time_taken, note, person_id")
            .in("test_id", testIds)
            .order("submitted_at", { ascending: false })
        : { data: [] };

    const allResults = results || [];

    // Enrich tests with per-test result stats
    const tests: DashboardTest[] = modeTests.map((t) => {
        const testResults = allResults.filter((r) => r.test_id === t.id);
        const passCount = testResults.filter((r) => r.status === "pass").length;
        const failCount = testResults.filter((r) => r.status === "fail").length;
        const pendingCount = testResults.filter((r) => !r.status).length;
        const totalScorePercent = testResults.reduce(
            (sum, r) => sum + (r.total_questions > 0 ? (r.score / r.total_questions) * 100 : 0), 0
        );
        return {
            ...t,
            resultCount: testResults.length,
            passCount,
            failCount,
            pendingCount,
            avgScore: testResults.length > 0 ? totalScorePercent / testResults.length : null,
        };
    });

    // Dashboard KPI stats
    const stats: DashboardStats = {
        activeTests: tests.filter((t) => t.status === "active").length,
        totalSubmissions: allResults.length,
        pendingReview: allResults.filter((r) => !r.status).length,
        passed: allResults.filter((r) => r.status === "pass").length,
        failed: allResults.filter((r) => r.status === "fail").length,
        pendingAiReview: allResults.filter((r) => !r.ai_analysis).length,
    };

    // Pipeline stages
    const aiAnalyzedCount = allResults.filter((r) => r.ai_analysis).length;
    let pipeline: PipelineStage[];

    if (mode === "employee") {
        // Employee pipeline: Test Completed -> Skills Assessed -> Level Confirmed
        const resultIds = allResults.map((r) => r.id);
        let skillsAssessedCount = 0;
        if (resultIds.length > 0) {
            const { count } = await supabase
                .from("skill_evaluations")
                .select("result_id", { count: "exact", head: true })
                .in("result_id", resultIds);
            // Count distinct result_ids that have at least one evaluation
            const { data: evalResults } = await supabase
                .from("skill_evaluations")
                .select("result_id")
                .in("result_id", resultIds);
            const uniqueEvalResultIds = new Set((evalResults || []).map((e) => e.result_id));
            skillsAssessedCount = uniqueEvalResultIds.size;
        }

        const personIds = allResults.map((r) => r.person_id).filter(Boolean);
        let levelConfirmedCount = 0;
        if (personIds.length > 0) {
            const { data: persons } = await supabase
                .from("persons")
                .select("id, current_level")
                .in("id", personIds);
            levelConfirmedCount = (persons || []).filter((p) => p.current_level).length;
        }

        pipeline = [
            { label: "Test Completed", count: allResults.length, color: "#8B99B0", bgColor: "#8B99B00D" },
            { label: "Skills Assessed", count: skillsAssessedCount, color: "#B48EFF", bgColor: "#B48EFF0D" },
            { label: "Level Confirmed", count: levelConfirmedCount, color: "#36DDAB", bgColor: "#36DDAB0D" },
        ];
    } else {
        pipeline = [
            { label: "Submitted", count: allResults.length, color: "#8B99B0", bgColor: "#8B99B00D" },
            { label: "Pending Review", count: stats.pendingReview, color: "#FFB86C", bgColor: "#FFB86C0D" },
            { label: "AI Analyzed", count: aiAnalyzedCount, color: "#B48EFF", bgColor: "#B48EFF0D" },
        ];
    }

    // Monthly passed vs failed (current year)
    const currentYear = new Date().getFullYear();
    const monthlyData: MonthlyData[] = Array.from({ length: 12 }, (_, i) => {
        const monthResults = allResults.filter((r) => {
            const d = new Date(r.submitted_at);
            return d.getMonth() === i && d.getFullYear() === currentYear;
        });
        return {
            month: i,
            passed: monthResults.filter((r) => r.status === "pass").length,
            failed: monthResults.filter((r) => r.status === "fail").length,
        };
    });

    // Candidates needing attention
    const testNameMap = Object.fromEntries(tests.map((t) => [t.id, t.title || t.job_role]));
    const attentionCandidates: AttentionCandidate[] = allResults
        .filter((r) => {
            const pct = r.total_questions > 0 ? r.score / r.total_questions : 0;
            return !r.status || !r.ai_analysis || (r.status && pct >= 0.4 && pct <= 0.7);
        })
        .map((r) => {
            const pct = r.total_questions > 0 ? r.score / r.total_questions : 0;
            let reason: AttentionCandidate["reason"] = "pending_review";
            if (!r.ai_analysis) reason = "no_ai_analysis";
            else if (r.status && pct >= 0.4 && pct <= 0.7) reason = "borderline";
            return {
                id: r.id,
                candidate_name: r.candidate_name,
                candidate_email: r.candidate_email,
                testName: testNameMap[r.test_id] || "Unknown",
                testId: r.test_id,
                score: r.score,
                totalQuestions: r.total_questions,
                status: r.status,
                hasAiAnalysis: !!r.ai_analysis,
                submittedAt: r.submitted_at,
                reason,
            };
        })
        .slice(0, 10);

    const pendingAiResults = allResults
        .filter((r) => !r.ai_analysis)
        .map((r) => ({ id: r.id, name: r.candidate_name || r.candidate_email || "Unknown" }));

    // Employee-specific stats
    let employeeStats: EmployeeStats | null = null;
    let skillGaps: SkillGapItem[] = [];

    if (mode === "employee") {
        const uniquePersonIds = new Set(allResults.map((r) => r.person_id).filter(Boolean));
        const resultIds = allResults.map((r) => r.id);

        let evalData: any[] = [];
        if (resultIds.length > 0) {
            const { data } = await supabase
                .from("skill_evaluations")
                .select("result_id, skill_id, score, status, skills(name, category)")
                .in("result_id", resultIds);
            evalData = data || [];
        }

        const resultsWithEvals = new Set(evalData.map((e) => e.result_id));
        const avgScore = evalData.length > 0
            ? evalData.reduce((sum, e) => sum + e.score, 0) / evalData.length
            : null;

        // Skill gaps: group by skill, compute avg vs required
        const skillScores = new Map<string, { name: string; category: string | null; scores: number[]; required: number }>();
        type SkillScoreEntry = { name: string; category: string | null; scores: number[]; required: number };

        // Get requirements for positions linked to employee tests
        const positionIds = [...new Set(modeTests.map((t) => t.position_id).filter(Boolean))];
        let reqMap = new Map<string, number>();
        if (positionIds.length > 0) {
            const { data: reqs } = await supabase
                .from("position_skill_requirements")
                .select("skill_id, required_level")
                .in("position_id", positionIds);
            for (const r of reqs || []) {
                const existing = reqMap.get(r.skill_id) || 0;
                reqMap.set(r.skill_id, Math.max(existing, r.required_level));
            }
        }

        for (const ev of evalData) {
            const skillName = (ev.skills as any)?.name ?? "Unknown";
            const skillCat = (ev.skills as any)?.category ?? null;
            const existing: SkillScoreEntry = skillScores.get(ev.skill_id) || { name: skillName, category: skillCat, scores: [] as number[], required: reqMap.get(ev.skill_id) || 3 };
            existing.scores.push(ev.score);
            skillScores.set(ev.skill_id, existing);
        }

        skillGaps = [];
        for (const [, info] of skillScores) {
            const avg = info.scores.reduce((a, b) => a + b, 0) / info.scores.length;
            if (avg < info.required) {
                skillGaps.push({
                    skillName: info.name,
                    category: info.category,
                    avgScore: avg,
                    requiredLevel: info.required,
                    gapSize: info.required - avg,
                    evaluationCount: info.scores.length,
                });
            }
        }

        employeeStats = {
            employeesEvaluated: uniquePersonIds.size,
            avgSkillScore: avgScore,
            positionsWithGaps: skillGaps.length > 0 ? new Set(skillGaps.map((g) => g.skillName)).size : 0,
            pendingEvaluations: allResults.length - resultsWithEvals.size,
            evaluationCompletion: allResults.length > 0
                ? Math.round((resultsWithEvals.size / allResults.length) * 100)
                : 0,
        };
    }

    return (
        <DashboardClient
            mode={mode}
            user={userData}
            tests={tests}
            stats={stats}
            pipeline={pipeline}
            monthlyData={monthlyData}
            attentionCandidates={attentionCandidates}
            pendingAiResults={pendingAiResults}
            employeeStats={employeeStats}
            skillGaps={skillGaps}
            adminStats={adminStats}
            isAdmin={isAdmin}
            isHr={isHr}
        />
    );
}
