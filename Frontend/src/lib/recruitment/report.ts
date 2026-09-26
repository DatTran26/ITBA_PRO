import type { ParseStatus } from "@/types/recruitment";

export const REPORT_TIME_ZONE = "Asia/Ho_Chi_Minh";
export const REPORT_TIMEZONE_OFFSET = "+07:00";
export const REPORT_DETAIL_LIMIT = 5000;
export const REPORT_STALE_DAYS = 7;

export const PIPELINE_STATUSES = [
  "NEW",
  "SCREENED",
  "REJECTED",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEWED",
  "PASSED",
  "FAILED",
  "OFFERED",
  "ACCEPTED",
  "OFFER_REJECTED",
  "ONBOARDED",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  NEW: "Hồ sơ mới",
  SCREENED: "Đã sàng lọc",
  REJECTED: "Đã từ chối",
  SHORTLISTED: "Tiềm năng",
  INTERVIEW_SCHEDULED: "Đã lên lịch phỏng vấn",
  INTERVIEWED: "Đã phỏng vấn",
  PASSED: "Vượt qua phỏng vấn",
  FAILED: "Không đạt phỏng vấn",
  OFFERED: "Đã gửi offer",
  ACCEPTED: "Đã chấp nhận offer",
  OFFER_REJECTED: "Từ chối offer",
  ONBOARDED: "Đã onboard",
};

const ACTIVE_STAGES = new Set([
  "NEW",
  "SCREENED",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEWED",
  "OFFERED",
]);

export interface ReportScope {
  from: string;
  to: string;
  jdId: string | null;
  department: string | null;
}

export interface ReportMetrics {
  totalApplications: number;
  totalCvsUploaded: number;
  screenedApplications: number;
  interviewedApplications: number;
  onboardedApplications: number;
  byStatus: Record<string, number>;
  avgAiScore: number;
  passRate: number;
  offerAcceptanceRate: number;
  avgTimeToHireDays: number | null;
  medianTimeToHireDays: number | null;
  processingQueue: number;
}

export interface ReportBreakdown {
  jobDescriptionId: string | null;
  jobTitle: string;
  department: string;
  applications: number;
  screened: number;
  interviewed: number;
  onboarded: number;
  passRate: number;
  offerAcceptanceRate: number;
  avgTimeToHireDays: number | null;
}

export interface ReportTrend {
  month: string;
  applications: number;
  screened: number;
  interviewed: number;
  onboarded: number;
}

export interface ReportApplication {
  id: string;
  createdAt: string;
  updatedAt: string;
  pipelineStatus: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  department: string;
  finalScore: number | null;
  aiScore: number | null;
  cvStatus: ParseStatus | null;
  createdBy: string | null;
  lastStatusChangeAt: string | null;
  interviewSchedules: Array<{
    scheduledAt: string;
    status: string;
    result: string | null;
    submittedAt: string | null;
  }>;
}

export type ReportActionType =
  | "STALE"
  | "CV_PROCESSING"
  | "CV_FAILED"
  | "INTERVIEW_RESULT"
  | "OFFER_RESPONSE";

export interface ReportAction {
  type: ReportActionType;
  priority: "HIGH" | "MEDIUM";
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  pipelineStatus: string;
  ageDays: number;
  nextAction: string;
}

export interface ReportAiInsight {
  text: string;
  model: string;
  generatedAt: string;
  evidence: Record<string, string | number | null>;
}

export interface ReportSnapshot {
  generatedAt: string;
  scope: ReportScope;
  roleScope: "all" | "own";
  totalMatchingApplications: number;
  detailLimit: number;
  detailTruncated: boolean;
  metrics: ReportMetrics;
  breakdowns: ReportBreakdown[];
  trend: ReportTrend[];
  actions: ReportAction[];
  applications: ReportApplication[];
}

export interface ReportRoleContext {
  isAdmin: boolean;
  isHr: boolean;
}

type ScopeResult =
  | { ok: true; scope: ReportScope }
  | { ok: false; error: string };

function getLocalDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function formatDateOnly(date: Date): string {
  const { year, month, day } = getLocalDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function shiftDateOnly(dateOnly: string, days: number): string {
  const date = new Date(`${dateOnly}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function dateOnlyToRangeValue(dateOnly: string, endOfDay: boolean): string {
  return `${dateOnly}T${endOfDay ? "23:59:59.999" : "00:00:00"}${REPORT_TIMEZONE_OFFSET}`;
}

export function normalizeReportScope(
  searchParams: URLSearchParams,
  now = new Date(),
): ScopeResult {
  const today = formatDateOnly(now);
  const fromDate = searchParams.get("from")?.trim() || shiftDateOnly(today, -29);
  const toDate = searchParams.get("to")?.trim() || today;

  if (!isValidDateOnly(fromDate) || !isValidDateOnly(toDate)) {
    return { ok: false, error: "Khoảng thời gian không hợp lệ." };
  }

  const fromUtc = new Date(`${fromDate}T00:00:00Z`).getTime();
  const toUtc = new Date(`${toDate}T00:00:00Z`).getTime();
  const durationDays = Math.round((toUtc - fromUtc) / 86_400_000) + 1;

  if (durationDays <= 0) {
    return { ok: false, error: "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc." };
  }
  if (durationDays > 731) {
    return { ok: false, error: "Khoảng thời gian báo cáo không được vượt quá 2 năm." };
  }

  const jdId = searchParams.get("jd_id")?.trim() || null;
  const department = searchParams.get("department")?.trim() || null;

  if (jdId && !isUuid(jdId)) {
    return { ok: false, error: "Job description không hợp lệ." };
  }
  if (department && department.length > 120) {
    return { ok: false, error: "Tên phòng ban quá dài." };
  }

  return {
    ok: true,
    scope: {
      from: dateOnlyToRangeValue(fromDate, false),
      to: dateOnlyToRangeValue(toDate, true),
      jdId,
      department,
    },
  };
}

export function formatReportQuery(scope: ReportScope): string {
  const params = new URLSearchParams({
    from: scope.from.slice(0, 10),
    to: scope.to.slice(0, 10),
  });
  if (scope.jdId) params.set("jd_id", scope.jdId);
  if (scope.department) params.set("department", scope.department);
  return params.toString();
}

export function percentage(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export function isReportRole(ctx: ReportRoleContext): boolean {
  return ctx.isAdmin || ctx.isHr;
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function ageInDays(application: ReportApplication, now: Date): number {
  const reference = new Date(application.lastStatusChangeAt ?? application.updatedAt ?? application.createdAt);
  const age = Math.floor((now.getTime() - reference.getTime()) / 86_400_000);
  return Math.max(0, Number.isFinite(age) ? age : 0);
}

function addAction(
  actions: ReportAction[],
  application: ReportApplication,
  type: ReportActionType,
  priority: "HIGH" | "MEDIUM",
  nextAction: string,
  ageDays: number,
) {
  actions.push({
    type,
    priority,
    applicationId: application.id,
    candidateName: application.candidateName,
    jobTitle: application.jobTitle,
    pipelineStatus: application.pipelineStatus,
    ageDays,
    nextAction,
  });
}

export function classifyReportActions(
  applications: ReportApplication[],
  now = new Date(),
): ReportAction[] {
  const actions: ReportAction[] = [];

  for (const application of applications) {
    const ageDays = ageInDays(application, now);

    if (application.cvStatus === "FAILED") {
      addAction(actions, application, "CV_FAILED", "HIGH", "Kiểm tra lỗi và chạy lại xử lý CV.", ageDays);
    } else if (application.cvStatus === "PENDING" || application.cvStatus === "PROCESSING") {
      addAction(actions, application, "CV_PROCESSING", "MEDIUM", "Theo dõi hoặc xử lý lại CV đang chờ.", ageDays);
    }

    const unresolvedInterview = application.interviewSchedules.some(
      (schedule) => schedule.status !== "cancelled" && !schedule.result,
    );
    if (unresolvedInterview) {
      addAction(actions, application, "INTERVIEW_RESULT", "HIGH", "Hoàn tất và lưu kết quả phỏng vấn.", ageDays);
    }

    if (application.pipelineStatus === "OFFERED") {
      addAction(actions, application, "OFFER_RESPONSE", "HIGH", "Theo dõi phản hồi offer của ứng viên.", ageDays);
    }

    if (ACTIVE_STAGES.has(application.pipelineStatus) && ageDays >= REPORT_STALE_DAYS) {
      addAction(actions, application, "STALE", "MEDIUM", "Rà soát hồ sơ và cập nhật bước tiếp theo.", ageDays);
    }
  }

  const priorityOrder = { HIGH: 0, MEDIUM: 1 } as const;
  return actions.sort(
    (left, right) =>
      priorityOrder[left.priority] - priorityOrder[right.priority] || right.ageDays - left.ageDays,
  );
}
