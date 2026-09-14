import { createAdminClient } from "@/lib/supabase/admin";
import type { AuthContext } from "@/lib/api/auth-helpers";
import {
  classifyReportActions,
  REPORT_DETAIL_LIMIT,
  type ReportApplication,
  type ReportBreakdown,
  type ReportMetrics,
  type ReportScope,
  type ReportSnapshot,
  type ReportTrend,
} from "./report";

export class ReportDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReportDataError";
  }
}

type PersonRow = { full_name: string | null; email: string | null };
type JdRow = { id: string | null; title: string | null; department: string | null };
type CvRow = { id: string | null; parse_status: ReportApplication["cvStatus"] };
type ScreeningRow = { final_score: number | null; ai_score: number | null };
type HistoryRow = { changed_at: string | null };
type InterviewResultRow = { result: string | null; submitted_at: string | null };
type InterviewScheduleRow = {
  scheduled_at: string | null;
  status: string | null;
  interview_results: InterviewResultRow | InterviewResultRow[] | null;
};
type RawApplicationRow = {
  id: string;
  created_at: string;
  updated_at: string;
  pipeline_status: string;
  created_by: string | null;
  persons: PersonRow | PersonRow[] | null;
  job_descriptions: JdRow | JdRow[] | null;
  candidate_cvs: CvRow | CvRow[] | null;
  candidate_screenings: ScreeningRow | ScreeningRow[] | null;
  candidate_status_history: HistoryRow[] | null;
  interview_schedules: InterviewScheduleRow[] | null;
};

type RawReportPayload = {
  totalApplications?: number;
  totalCvsUploaded?: number;
  screenedApplications?: number;
  interviewedApplications?: number;
  onboardedApplications?: number;
  byStatus?: Record<string, number> | null;
  avgAiScore?: number;
  passRate?: number;
  offerAcceptanceRate?: number;
  avgTimeToHireDays?: number | null;
  medianTimeToHireDays?: number | null;
  processingQueue?: number;
  breakdowns?: Array<Partial<ReportBreakdown>> | null;
  trend?: Array<Partial<ReportTrend>> | null;
};

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeMetrics(payload: RawReportPayload): ReportMetrics {
  return {
    totalApplications: asNumber(payload.totalApplications),
    totalCvsUploaded: asNumber(payload.totalCvsUploaded),
    screenedApplications: asNumber(payload.screenedApplications),
    interviewedApplications: asNumber(payload.interviewedApplications),
    onboardedApplications: asNumber(payload.onboardedApplications),
    byStatus: payload.byStatus ?? {},
    avgAiScore: asNumber(payload.avgAiScore),
    passRate: asNumber(payload.passRate),
    offerAcceptanceRate: asNumber(payload.offerAcceptanceRate),
    avgTimeToHireDays: payload.avgTimeToHireDays ?? null,
    medianTimeToHireDays: payload.medianTimeToHireDays ?? null,
    processingQueue: asNumber(payload.processingQueue),
  };
}

function normalizeBreakdowns(payload: RawReportPayload): ReportBreakdown[] {
  return (payload.breakdowns ?? []).map((row) => ({
    jobDescriptionId: row.jobDescriptionId ?? null,
    jobTitle: asString(row.jobTitle, "Chưa gắn JD"),
    department: asString(row.department, "Chưa phân loại"),
    applications: asNumber(row.applications),
    screened: asNumber(row.screened),
    interviewed: asNumber(row.interviewed),
    onboarded: asNumber(row.onboarded),
    passRate: asNumber(row.passRate),
    offerAcceptanceRate: asNumber(row.offerAcceptanceRate),
    avgTimeToHireDays: row.avgTimeToHireDays ?? null,
  }));
}

function normalizeTrend(payload: RawReportPayload): ReportTrend[] {
  return (payload.trend ?? []).map((row) => ({
    month: asString(row.month),
    applications: asNumber(row.applications),
    screened: asNumber(row.screened),
    interviewed: asNumber(row.interviewed),
    onboarded: asNumber(row.onboarded),
  }));
}

function mapApplication(row: RawApplicationRow): ReportApplication {
  const person = first(row.persons);
  const jd = first(row.job_descriptions);
  const cv = first(row.candidate_cvs);
  const screening = first(row.candidate_screenings);
  const statusHistory = row.candidate_status_history ?? [];
  const lastStatusChangeAt = statusHistory
    .map((item) => item.changed_at)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;

  const interviewSchedules = (row.interview_schedules ?? []).map((schedule) => {
    const result = first(schedule.interview_results);
    return {
      scheduledAt: schedule.scheduled_at ?? "",
      status: schedule.status ?? "",
      result: result?.result ?? null,
      submittedAt: result?.submitted_at ?? null,
    };
  });

  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pipelineStatus: row.pipeline_status,
    candidateName: person?.full_name ?? "",
    candidateEmail: person?.email ?? "",
    jobTitle: jd?.title ?? "Chưa gắn JD",
    department: jd?.department ?? "Chưa phân loại",
    finalScore: screening?.final_score ?? null,
    aiScore: screening?.ai_score ?? null,
    cvStatus: cv?.parse_status ?? null,
    createdBy: row.created_by,
    lastStatusChangeAt,
    interviewSchedules,
  };
}

export async function loadRecruitmentReport(
  scope: ReportScope,
  ctx: Pick<AuthContext, "isAdmin" | "isHr" | "userId">,
): Promise<ReportSnapshot> {
  const admin = createAdminClient();
  const ownerId = ctx.isHr && !ctx.isAdmin ? ctx.userId : null;
  const roleScope = ownerId ? "own" : "all";

  const reportResult = admin.rpc("recruitment_management_report", {
    from_date: scope.from,
    to_date: scope.to,
    p_jd_id: scope.jdId,
    p_department: scope.department,
    p_owner_id: ownerId,
  });

  const jdSelect = scope.department
    ? "job_descriptions!inner(id, title, department)"
    : "job_descriptions(id, title, department)";
  let detailsQuery = admin
    .from("job_applications")
    .select(
      `
        id, created_at, updated_at, pipeline_status, created_by,
        persons!inner(full_name, email),
        ${jdSelect},
        candidate_cvs(id, parse_status),
        candidate_screenings!fk_current_screening(final_score, ai_score),
        candidate_status_history(changed_at),
        interview_schedules(scheduled_at, status, interview_results(result, submitted_at))
      `,
      { count: "exact" },
    )
    .gte("created_at", scope.from)
    .lte("created_at", scope.to)
    .order("created_at", { ascending: false })
    .range(0, REPORT_DETAIL_LIMIT - 1);

  if (scope.jdId) detailsQuery = detailsQuery.eq("job_description_id", scope.jdId);
  if (scope.department) detailsQuery = detailsQuery.eq("job_descriptions.department", scope.department);
  if (ownerId) detailsQuery = detailsQuery.eq("created_by", ownerId);

  const [{ data: reportData, error: reportError }, { data: detailData, count, error: detailError }] = await Promise.all([
    reportResult,
    detailsQuery,
  ]);

  if (reportError) {
    console.error("[recruitment/report] RPC error:", reportError.message);
    throw new ReportDataError("Không thể tải số liệu báo cáo.");
  }
  if (detailError) {
    console.error("[recruitment/report] detail query error:", detailError.message);
    throw new ReportDataError("Không thể tải chi tiết ứng viên.");
  }

  const applications = ((detailData ?? []) as unknown as RawApplicationRow[]).map(mapApplication);
  const totalMatchingApplications = count ?? 0;
  const metrics = normalizeMetrics((reportData ?? {}) as RawReportPayload);
  const generatedAt = new Date().toISOString();

  return {
    generatedAt,
    scope,
    roleScope,
    totalMatchingApplications,
    detailLimit: REPORT_DETAIL_LIMIT,
    detailTruncated: totalMatchingApplications > REPORT_DETAIL_LIMIT,
    metrics,
    breakdowns: normalizeBreakdowns((reportData ?? {}) as RawReportPayload),
    trend: normalizeTrend((reportData ?? {}) as RawReportPayload),
    actions: classifyReportActions(applications, new Date(generatedAt)),
    applications,
  };
}
