import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildRecruitmentReportWorkbook,
  type ApplicationRow,
  type DashboardMetrics,
} from "@/lib/export/excel-report";

const MAX_EXPORT_ROWS = 5000;
// MVP has no date/JD filter UI yet — report covers all-time data.
const ALL_TIME_FROM = "2000-01-01T00:00:00Z";

type PersonRow = { full_name: string | null; email: string | null };
type JdRow = { title: string | null; department: string | null };
type ScreeningRow = { final_score: number | null; ai_score: number | null };

// Gemini powers only this report's insight sheet — the rest of the app's
// AI features (jd-parse, cv-extract, ...) still use OpenAI via getAiConfig().
async function fetchAiInsight(metrics: DashboardMetrics): Promise<string | undefined> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return undefined;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      contents: JSON.stringify(metrics),
      config: {
        systemInstruction:
          "Bạn là chuyên gia phân tích tuyển dụng. Dựa trên số liệu JSON được cung cấp, viết 3-5 câu nhận xét ngắn gọn bằng tiếng Việt về xu hướng tuyển dụng hiện tại (điểm mạnh, điểm cần chú ý). Chỉ trả về đoạn văn bản thuần, không markdown, không tiêu đề.",
      },
    });

    return response.text?.trim() || undefined;
  } catch (err) {
    console.error("[report/export] AI insight failed, skipping sheet:", err);
    return undefined;
  }
}

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, isHr } = ctx;
  if (!isAdmin && !isHr) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: metrics, error: metricsError } = await admin.rpc("recruitment_dashboard", {
    from_date: ALL_TIME_FROM,
    to_date: new Date().toISOString(),
    p_jd_id: null,
  });

  if (metricsError) {
    console.error("[report/export] RPC error:", metricsError.message);
    return NextResponse.json({ error: "Failed to load report metrics" }, { status: 500 });
  }

  const { data: applicationRows, error: applicationsError } = await admin
    .from("job_applications")
    .select(`
      created_at, pipeline_status,
      persons!inner(full_name, email),
      job_descriptions(title, department),
      candidate_screenings!fk_current_screening(final_score, ai_score)
    `)
    .order("created_at", { ascending: false })
    .limit(MAX_EXPORT_ROWS);

  if (applicationsError) {
    console.error("[report/export] applications query error:", applicationsError.message);
    return NextResponse.json({ error: "Failed to load applications" }, { status: 500 });
  }

  const applications: ApplicationRow[] = (applicationRows ?? []).map((row) => {
    const person = Array.isArray(row.persons) ? row.persons[0] : (row.persons as PersonRow | null);
    const jd = Array.isArray(row.job_descriptions)
      ? row.job_descriptions[0] ?? null
      : (row.job_descriptions as JdRow | null);
    const screening = Array.isArray(row.candidate_screenings)
      ? row.candidate_screenings[0] ?? null
      : (row.candidate_screenings as ScreeningRow | null);

    return {
      createdAt: row.created_at,
      pipelineStatus: row.pipeline_status,
      candidateName: person?.full_name ?? "",
      candidateEmail: person?.email ?? "",
      jobTitle: jd?.title ?? "",
      department: jd?.department ?? "",
      finalScore: screening?.final_score ?? null,
      aiScore: screening?.ai_score ?? null,
    };
  });

  const dashboardMetrics = metrics as DashboardMetrics;
  const aiInsight = await fetchAiInsight(dashboardMetrics);

  const workbook = await buildRecruitmentReportWorkbook({
    metrics: dashboardMetrics,
    applications,
    aiInsight,
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `bao-cao-tuyen-dung-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
