import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import {
  isReportRole,
  normalizeReportScope,
  type ReportAiInsight,
  type ReportSnapshot,
} from "@/lib/recruitment/report";
import { loadRecruitmentReport, ReportDataError } from "@/lib/recruitment/report-data";
import { buildRecruitmentReportWorkbook } from "@/lib/export/excel-report";

const AI_TIMEOUT_MS = 6000;

function buildAiEvidence(snapshot: ReportSnapshot): ReportAiInsight["evidence"] {
  return {
    "Tổng applications": snapshot.metrics.totalApplications,
    "Tổng CV": snapshot.metrics.totalCvsUploaded,
    "Đã sàng lọc": snapshot.metrics.screenedApplications,
    "Đã phỏng vấn": snapshot.metrics.interviewedApplications,
    "Đã onboard": snapshot.metrics.onboardedApplications,
    "Tỷ lệ đạt phỏng vấn (%)": snapshot.metrics.passRate,
    "Tỷ lệ chấp nhận offer (%)": snapshot.metrics.offerAcceptanceRate,
    "Thời gian tuyển dụng trung bình (ngày)": snapshot.metrics.avgTimeToHireDays,
    "Hồ sơ cần xử lý": snapshot.actions.length,
  };
}

async function fetchAiInsight(snapshot: ReportSnapshot): Promise<ReportAiInsight | undefined> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return undefined;

  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const evidence = buildAiEvidence(snapshot);
  const request = async () => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: JSON.stringify({
        metrics: snapshot.metrics,
        breakdowns: snapshot.breakdowns,
        trend: snapshot.trend,
        evidence,
      }),
      config: {
        systemInstruction:
          "Bạn là chuyên gia phân tích tuyển dụng. Viết 3-5 câu tiếng Việt, chỉ sử dụng số liệu được cung cấp. Mỗi nhận xét phải nêu rõ tên KPI hoặc JD và giá trị làm căn cứ. Chỉ trả về văn bản thuần, đánh dấu đây là nhận xét tham khảo, không kết luận Pass/Fail hay quyết định tuyển dụng.",
      },
    });
    const text = response.text?.trim();
    if (!text) return undefined;
    return {
      text,
      model,
      generatedAt: new Date().toISOString(),
      evidence,
    } satisfies ReportAiInsight;
  };

  try {
    return await Promise.race([
      request(),
      new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), AI_TIMEOUT_MS)),
    ]);
  } catch (error) {
    console.error("[recruitment/report/export] AI insight skipped:", error);
    return undefined;
  }
}

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!isReportRole(ctx)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = normalizeReportScope(req.nextUrl.searchParams);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const snapshot = await loadRecruitmentReport(parsed.scope, ctx);
    const aiInsight = await fetchAiInsight(snapshot);
    const workbook = await buildRecruitmentReportWorkbook(snapshot, aiInsight);
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `bao-cao-tuyen-dung-${parsed.scope.to.slice(0, 10)}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof ReportDataError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("[recruitment/report/export] unexpected error:", error);
    return NextResponse.json({ error: "Không thể xuất báo cáo tuyển dụng." }, { status: 500 });
  }
}
