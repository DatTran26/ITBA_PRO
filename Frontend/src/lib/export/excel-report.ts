import ExcelJS from "exceljs";
import {
  getStatusLabel,
  percentage,
  PIPELINE_STATUSES,
  type ReportAiInsight,
  type ReportSnapshot,
} from "../recruitment/report";

const HEADER_COLOR = "FF7C8FFF";
const BORDER_COLOR = "FFD9E0EC";

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_COLOR } };
  row.alignment = { vertical: "middle", wrapText: true };
  row.height = 24;
}

function styleTitle(row: ExcelJS.Row, title: string) {
  row.getCell(1).value = title;
  row.font = { bold: true, size: 14, color: { argb: "FF1B253B" } };
  row.height = 26;
}

function addThinBorders(sheet: ExcelJS.Worksheet, fromRow: number, toRow: number, toColumn: number) {
  for (let rowNumber = fromRow; rowNumber <= toRow; rowNumber += 1) {
    for (let columnNumber = 1; columnNumber <= toColumn; columnNumber += 1) {
      sheet.getCell(rowNumber, columnNumber).border = {
        top: { style: "thin", color: { argb: BORDER_COLOR } },
        left: { style: "thin", color: { argb: BORDER_COLOR } },
        bottom: { style: "thin", color: { argb: BORDER_COLOR } },
        right: { style: "thin", color: { argb: BORDER_COLOR } },
      };
    }
  }
}

function excelSafeText(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function dateValue(value: string | null): Date | string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date;
}

function applyDateFormat(sheet: ExcelJS.Worksheet, column: number) {
  sheet.getColumn(column).numFmt = "dd/mm/yyyy hh:mm";
}

function addOverviewSheet(workbook: ExcelJS.Workbook, snapshot: ReportSnapshot) {
  const sheet = workbook.addWorksheet("Tổng quan");
  sheet.getColumn(1).width = 38;
  sheet.getColumn(2).width = 28;
  sheet.getColumn(3).width = 72;

  styleTitle(sheet.addRow([]), "BÁO CÁO TUYỂN DỤNG");
  sheet.mergeCells("A1:C1");
  sheet.addRow(["Kỳ báo cáo", `${snapshot.scope.from.slice(0, 10)} → ${snapshot.scope.to.slice(0, 10)}`]);
  sheet.addRow(["Bộ lọc JD", snapshot.scope.jdId ?? "Tất cả JD"]);
  sheet.addRow(["Bộ lọc phòng ban", snapshot.scope.department ?? "Tất cả phòng ban"]);
  sheet.addRow(["Phạm vi quyền", snapshot.roleScope === "own" ? "Hồ sơ do người dùng tạo" : "Toàn bộ recruitment"]);
  sheet.addRow(["Tạo lúc", dateValue(snapshot.generatedAt)]);
  sheet.addRow(["Tổng số bản ghi khớp", snapshot.totalMatchingApplications]);
  sheet.addRow(["Chi tiết xuất", `${snapshot.applications.length}/${snapshot.detailLimit} dòng`]);
  sheet.addRow([
    "Cảnh báo chi tiết",
    snapshot.detailTruncated ? "Chi tiết bị giới hạn ở 5.000 dòng" : "Đã xuất toàn bộ chi tiết khớp",
  ]);
  sheet.addRow([]);

  const header = sheet.addRow(["Chỉ số", "Giá trị", "Định nghĩa"]);
  styleHeaderRow(header);
  const { metrics } = snapshot;
  sheet.addRows([
    ["Tổng applications", metrics.totalApplications, "Số application được tạo trong kỳ và phạm vi đã chọn."],
    ["Tổng CV", metrics.totalCvsUploaded, "Số CV khác nhau được liên kết với application trong phạm vi."],
    ["Đã sàng lọc", metrics.screenedApplications, "Application đang ở hoặc đã đi qua stage SCREENED."],
    ["Đã phỏng vấn", metrics.interviewedApplications, "Application đang ở hoặc đã đi qua stage INTERVIEWED."],
    ["Đã onboard", metrics.onboardedApplications, "Application có trạng thái ONBOARDED."],
    ["Điểm AI trung bình", metrics.avgAiScore, "Trung bình điểm AI của current screening có dữ liệu."],
    ["Tỷ lệ đạt phỏng vấn (%)", metrics.passRate, "Số đã đạt / số đã tới stage phỏng vấn, theo current status."],
    ["Tỷ lệ chấp nhận offer (%)", metrics.offerAcceptanceRate, "Accepted hoặc onboarded / offer đã gửi, theo current status."],
    ["Thời gian tuyển dụng TB (ngày)", metrics.avgTimeToHireDays ?? "—", "Từ ngày tạo application đến onboarded; dùng updated_at nếu thiếu history."],
    ["Thời gian tuyển dụng median (ngày)", metrics.medianTimeToHireDays ?? "—", "Median của các application đã onboarded."],
    ["CV đang chờ xử lý", metrics.processingQueue, "CV PENDING hoặc PROCESSING gắn với application trong phạm vi."],
  ]);
  addThinBorders(sheet, header.number, sheet.lastRow?.number ?? header.number, 3);
  sheet.getCell("B6").numFmt = "dd/mm/yyyy hh:mm";
}

function addPipelineSheet(workbook: ExcelJS.Workbook, snapshot: ReportSnapshot) {
  const sheet = workbook.addWorksheet("Pipeline hiện tại");
  sheet.getColumn(1).width = 30;
  sheet.getColumn(2).width = 14;
  sheet.getColumn(3).width = 18;
  sheet.getColumn(4).width = 70;
  styleTitle(sheet.addRow([]), "PIPELINE HIỆN TẠI");
  sheet.mergeCells("A1:D1");
  sheet.addRow(["Lưu ý", "Các số liệu phản ánh trạng thái hiện tại tại thời điểm tạo báo cáo, không phải cohort conversion lịch sử."]);
  sheet.mergeCells("B2:D2");
  const header = sheet.addRow(["Giai đoạn", "Số lượng", "% tổng application", "Diễn giải"]);
  styleHeaderRow(header);
  const total = snapshot.metrics.totalApplications;
  for (const status of PIPELINE_STATUSES) {
    sheet.addRow([
      getStatusLabel(status),
      snapshot.metrics.byStatus[status] ?? 0,
      percentage(snapshot.metrics.byStatus[status] ?? 0, total),
      `Số application hiện đang ở trạng thái ${getStatusLabel(status)}.`,
    ]);
  }
  addThinBorders(sheet, header.number, sheet.lastRow?.number ?? header.number, 4);
  sheet.views = [{ state: "frozen", ySplit: header.number }];
}

function addBreakdownSheet(workbook: ExcelJS.Workbook, snapshot: ReportSnapshot) {
  const sheet = workbook.addWorksheet("Theo JD & phòng ban");
  sheet.getColumn(1).width = 28;
  sheet.getColumn(2).width = 22;
  sheet.getColumn(3).width = 16;
  sheet.getColumn(4).width = 16;
  sheet.getColumn(5).width = 16;
  sheet.getColumn(6).width = 16;
  sheet.getColumn(7).width = 18;
  sheet.getColumn(8).width = 20;
  sheet.getColumn(9).width = 22;

  styleTitle(sheet.addRow([]), "PHÂN TÍCH THEO JD & PHÒNG BAN");
  sheet.mergeCells("A1:I1");
  const header = sheet.addRow([
    "Vị trí",
    "Phòng ban",
    "Applications",
    "Đã sàng lọc",
    "Đã phỏng vấn",
    "Đã onboard",
    "Pass rate (%)",
    "Offer acceptance (%)",
    "TGT tuyển dụng TB (ngày)",
  ]);
  styleHeaderRow(header);
  for (const row of snapshot.breakdowns) {
    sheet.addRow([
      excelSafeText(row.jobTitle),
      excelSafeText(row.department),
      row.applications,
      row.screened,
      row.interviewed,
      row.onboarded,
      row.passRate,
      row.offerAcceptanceRate,
      row.avgTimeToHireDays ?? "—",
    ]);
  }
  addThinBorders(sheet, header.number, sheet.lastRow?.number ?? header.number, 9);

  const trendTitle = sheet.addRow([]);
  styleTitle(trendTitle, "XU HƯỚNG THEO THÁNG");
  sheet.mergeCells(`A${trendTitle.number}:E${trendTitle.number}`);
  const trendHeader = sheet.addRow(["Tháng", "Applications", "Đã sàng lọc", "Đã phỏng vấn", "Đã onboard"]);
  styleHeaderRow(trendHeader);
  for (const row of snapshot.trend) {
    sheet.addRow([row.month, row.applications, row.screened, row.interviewed, row.onboarded]);
  }
  addThinBorders(sheet, trendHeader.number, sheet.lastRow?.number ?? trendHeader.number, 5);
  sheet.views = [{ state: "frozen", ySplit: header.number }];
}

function addActionsSheet(workbook: ExcelJS.Workbook, snapshot: ReportSnapshot) {
  const sheet = workbook.addWorksheet("Cần hành động");
  sheet.getColumn(1).width = 14;
  sheet.getColumn(2).width = 22;
  sheet.getColumn(3).width = 24;
  sheet.getColumn(4).width = 28;
  sheet.getColumn(5).width = 28;
  sheet.getColumn(6).width = 20;
  sheet.getColumn(7).width = 12;
  sheet.getColumn(8).width = 48;
  const header = sheet.addRow(["Ưu tiên", "Loại", "Ứng viên", "Vị trí", "Trạng thái", "Application ID", "Tuổi (ngày)", "Đề xuất xử lý"]);
  styleHeaderRow(header);
  for (const action of snapshot.actions) {
    sheet.addRow([
      action.priority,
      action.type,
      excelSafeText(action.candidateName),
      excelSafeText(action.jobTitle),
      getStatusLabel(action.pipelineStatus),
      action.applicationId,
      action.ageDays,
      action.nextAction,
    ]);
  }
  if (snapshot.actions.length === 0) {
    sheet.addRow(["—", "—", "Không có hồ sơ cần hành động trong phạm vi đã chọn."]);
  }
  addThinBorders(sheet, header.number, sheet.lastRow?.number ?? header.number, 8);
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

function addApplicationsSheet(workbook: ExcelJS.Workbook, snapshot: ReportSnapshot) {
  const sheet = workbook.addWorksheet("Chi tiết ứng viên");
  sheet.columns = [
    { header: "Application ID", key: "id", width: 38 },
    { header: "Ngày ứng tuyển", key: "createdAt", width: 20 },
    { header: "Cập nhật gần nhất", key: "updatedAt", width: 20 },
    { header: "Họ tên", key: "candidateName", width: 26 },
    { header: "Email", key: "candidateEmail", width: 32 },
    { header: "Vị trí", key: "jobTitle", width: 26 },
    { header: "Phòng ban", key: "department", width: 22 },
    { header: "Trạng thái", key: "pipelineStatus", width: 26 },
    { header: "Điểm cuối", key: "finalScore", width: 14 },
    { header: "Điểm AI", key: "aiScore", width: 14 },
    { header: "CV status", key: "cvStatus", width: 16 },
    { header: "Link chi tiết", key: "detailUrl", width: 48 },
  ];
  styleHeaderRow(sheet.getRow(1));
  for (const row of snapshot.applications) {
    sheet.addRow({
      id: row.id,
      createdAt: dateValue(row.createdAt),
      updatedAt: dateValue(row.lastStatusChangeAt ?? row.updatedAt),
      candidateName: excelSafeText(row.candidateName),
      candidateEmail: excelSafeText(row.candidateEmail),
      jobTitle: excelSafeText(row.jobTitle),
      department: excelSafeText(row.department),
      pipelineStatus: getStatusLabel(row.pipelineStatus),
      finalScore: row.finalScore ?? "—",
      aiScore: row.aiScore ?? "—",
      cvStatus: row.cvStatus ?? "—",
      detailUrl: `/dashboard/recruitment/${row.id}`,
    });
  }
  if (snapshot.applications.length === 0) {
    sheet.addRow({ candidateName: "Không có dữ liệu trong phạm vi đã chọn." });
  }
  applyDateFormat(sheet, 2);
  applyDateFormat(sheet, 3);
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  addThinBorders(sheet, 1, sheet.lastRow?.number ?? 1, 12);
}

function addInsightSheet(workbook: ExcelJS.Workbook, insight: ReportAiInsight) {
  const sheet = workbook.addWorksheet("Nhận xét AI");
  sheet.getColumn(1).width = 40;
  sheet.getColumn(2).width = 95;
  styleTitle(sheet.addRow([]), "NHẬN XÉT AI — THAM KHẢO");
  sheet.mergeCells("A1:B1");
  sheet.addRow(["Nội dung", insight.text]);
  sheet.getCell("B2").alignment = { wrapText: true, vertical: "top" };
  sheet.getRow(2).height = 72;
  sheet.addRow(["Model", insight.model]);
  sheet.addRow(["Tạo lúc", dateValue(insight.generatedAt)]);
  sheet.addRow(["Nguyên tắc", "AI chỉ nhận xét từ số liệu bên dưới; không thay thế quyết định tuyển dụng hoặc Pass/Fail."]);
  sheet.addRow([]);
  const header = sheet.addRow(["Chỉ số làm bằng chứng", "Giá trị"]);
  styleHeaderRow(header);
  for (const [label, value] of Object.entries(insight.evidence)) {
    sheet.addRow([label, value ?? "—"]);
  }
  addThinBorders(sheet, header.number, sheet.lastRow?.number ?? header.number, 2);
  sheet.getCell("B3").numFmt = "dd/mm/yyyy hh:mm";
  sheet.views = [{ state: "frozen", ySplit: header.number }];
}

export async function buildRecruitmentReportWorkbook(
  snapshot: ReportSnapshot,
  aiInsight?: ReportAiInsight,
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "down-town";
  workbook.created = new Date(snapshot.generatedAt);
  workbook.modified = new Date(snapshot.generatedAt);

  addOverviewSheet(workbook, snapshot);
  addPipelineSheet(workbook, snapshot);
  addBreakdownSheet(workbook, snapshot);
  addActionsSheet(workbook, snapshot);
  addApplicationsSheet(workbook, snapshot);
  if (aiInsight) addInsightSheet(workbook, aiInsight);

  return workbook;
}
