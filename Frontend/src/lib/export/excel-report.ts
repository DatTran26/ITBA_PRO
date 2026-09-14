import ExcelJS from "exceljs";

// Vietnamese labels for pipeline_status. Mirrors STAGE_CONFIG in
// components/recruitment/stage-funnel.tsx (extended with the 4 statuses
// that funnel view skips) — keep both in sync when adding a new status.
const STAGE_LABELS: Record<string, string> = {
  NEW: "Hồ Sơ Mới",
  SCREENED: "Đã Sàng Lọc",
  REJECTED: "Đã Từ Chối",
  SHORTLISTED: "Tiềm Năng",
  INTERVIEW_SCHEDULED: "Lên Lịch PV",
  INTERVIEWED: "Đã Phỏng Vấn",
  PASSED: "Vượt Qua PV",
  FAILED: "Không Đạt PV",
  OFFERED: "Gửi Offer",
  ACCEPTED: "Đã Chấp Nhận Offer",
  OFFER_REJECTED: "Từ Chối Offer",
  ONBOARDED: "Đã Gia Nhập",
};

export interface DashboardMetrics {
  totalCvsUploaded: number;
  byStatus: Record<string, number>;
  avgAiScore: number;
  passRate: number;
  offerAcceptanceRate: number;
  processingQueue: number;
}

export interface ApplicationRow {
  createdAt: string | null;
  pipelineStatus: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  department: string;
  finalScore: number | null;
  aiScore: number | null;
}

export interface RecruitmentReportData {
  metrics: DashboardMetrics;
  applications: ApplicationRow[];
  aiInsight?: string;
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C8FFF" } };
  row.alignment = { vertical: "middle" };
}

function addOverviewSheet(workbook: ExcelJS.Workbook, metrics: DashboardMetrics) {
  const sheet = workbook.addWorksheet("Tổng quan");
  sheet.columns = [{ header: "Chỉ số", key: "label", width: 32 }, { header: "Giá trị", key: "value", width: 18 }];
  styleHeaderRow(sheet.getRow(1));
  sheet.addRows([
    { label: "Tổng số CV đã tải lên", value: metrics.totalCvsUploaded },
    { label: "Điểm AI trung bình", value: metrics.avgAiScore },
    { label: "Tỷ lệ đạt phỏng vấn (%)", value: metrics.passRate },
    { label: "Tỷ lệ chấp nhận offer (%)", value: metrics.offerAcceptanceRate },
    { label: "CV đang chờ xử lý", value: metrics.processingQueue },
  ]);
}

function addPipelineSheet(workbook: ExcelJS.Workbook, byStatus: Record<string, number>) {
  const sheet = workbook.addWorksheet("Pipeline theo trạng thái");
  sheet.columns = [{ header: "Giai đoạn", key: "stage", width: 28 }, { header: "Số lượng", key: "count", width: 14 }];
  styleHeaderRow(sheet.getRow(1));
  sheet.addRows(
    // jsonb_object_agg in the RPC returns null (not {}) when there are no applications yet.
    Object.entries(byStatus ?? {}).map(([stage, count]) => ({ stage: STAGE_LABELS[stage] ?? stage, count }))
  );
}

function addApplicationsSheet(workbook: ExcelJS.Workbook, applications: ApplicationRow[]) {
  const sheet = workbook.addWorksheet("Danh sách ứng viên");
  sheet.columns = [
    { header: "Ngày ứng tuyển", key: "createdAt", width: 20 },
    { header: "Họ tên", key: "candidateName", width: 24 },
    { header: "Email", key: "candidateEmail", width: 28 },
    { header: "Vị trí", key: "jobTitle", width: 24 },
    { header: "Phòng ban", key: "department", width: 20 },
    { header: "Trạng thái", key: "pipelineStatus", width: 22 },
    { header: "Điểm cuối", key: "finalScore", width: 12 },
    { header: "Điểm AI", key: "aiScore", width: 12 },
  ];
  styleHeaderRow(sheet.getRow(1));
  sheet.addRows(
    applications.map((row) => ({
      ...row,
      createdAt: row.createdAt ? new Date(row.createdAt).toLocaleString("vi-VN") : "",
      pipelineStatus: STAGE_LABELS[row.pipelineStatus] ?? row.pipelineStatus,
    }))
  );
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

function addInsightSheet(workbook: ExcelJS.Workbook, insight: string) {
  const sheet = workbook.addWorksheet("Nhận xét AI");
  sheet.getColumn(1).width = 100;
  const cell = sheet.getCell("A1");
  cell.value = insight;
  cell.alignment = { wrapText: true, vertical: "top" };
}

export async function buildRecruitmentReportWorkbook(data: RecruitmentReportData): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "down-town";
  workbook.created = new Date();

  addOverviewSheet(workbook, data.metrics);
  addPipelineSheet(workbook, data.metrics.byStatus);
  addApplicationsSheet(workbook, data.applications);
  if (data.aiInsight) addInsightSheet(workbook, data.aiInsight);

  return workbook;
}
