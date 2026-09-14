import { describe, expect, it } from "vitest";
import { buildRecruitmentReportWorkbook } from "./excel-report";
import type { ReportSnapshot } from "../recruitment/report";

function snapshot(overrides: Partial<ReportSnapshot> = {}): ReportSnapshot {
  return {
    generatedAt: "2026-09-14T03:00:00.000Z",
    scope: {
      from: "2026-09-01T00:00:00+07:00",
      to: "2026-09-14T23:59:59.999+07:00",
      jdId: null,
      department: null,
    },
    roleScope: "all",
    totalMatchingApplications: 1,
    detailLimit: 5000,
    detailTruncated: false,
    metrics: {
      totalApplications: 1,
      totalCvsUploaded: 1,
      screenedApplications: 1,
      interviewedApplications: 0,
      onboardedApplications: 0,
      byStatus: { NEW: 1 },
      avgAiScore: 72.5,
      passRate: 0,
      offerAcceptanceRate: 0,
      avgTimeToHireDays: null,
      medianTimeToHireDays: null,
      processingQueue: 0,
    },
    breakdowns: [],
    trend: [],
    actions: [],
    applications: [],
    ...overrides,
  };
}

describe("recruitment report workbook", () => {
  it("creates the five base sheets in the management-report order", async () => {
    const workbook = await buildRecruitmentReportWorkbook(snapshot());
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "Tổng quan",
      "Pipeline hiện tại",
      "Theo JD & phòng ban",
      "Cần hành động",
      "Chi tiết ứng viên",
    ]);
  });

  it("adds AI evidence and preserves truncation metadata", async () => {
    const workbook = await buildRecruitmentReportWorkbook(
      snapshot({ totalMatchingApplications: 6000, detailTruncated: true }),
      {
        text: "Tỷ lệ hồ sơ cần rà soát đang cao.",
        model: "gemini-test",
        generatedAt: "2026-09-14T03:01:00.000Z",
        evidence: { "Tổng applications": 6000 },
      },
    );

    expect(workbook.worksheets.map((sheet) => sheet.name)).toHaveLength(6);
    expect(workbook.getWorksheet("Nhận xét AI")).toBeDefined();
    expect(workbook.getWorksheet("Chi tiết ứng viên")?.views[0]).toMatchObject({ state: "frozen", ySplit: 1 });
    expect(workbook.getWorksheet("Tổng quan")?.getCell("B7").value).toBe(6000);
    expect(workbook.getWorksheet("Tổng quan")?.getCell("B8").value).toBe("0/5000 dòng");
    expect(workbook.getWorksheet("Tổng quan")?.getCell("B9").value).toBe("Chi tiết bị giới hạn ở 5.000 dòng");
  });

  it("creates valid base sheets for empty data", async () => {
    const workbook = await buildRecruitmentReportWorkbook(
      snapshot({ totalMatchingApplications: 0, metrics: { ...snapshot().metrics, totalApplications: 0 } }),
    );
    expect(workbook.getWorksheet("Chi tiết ứng viên")?.getCell("D2").value).toBe("Không có dữ liệu trong phạm vi đã chọn.");
  });
});
