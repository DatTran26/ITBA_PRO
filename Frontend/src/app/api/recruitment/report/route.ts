import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { isReportRole, normalizeReportScope } from "@/lib/recruitment/report";
import { loadRecruitmentReport, ReportDataError } from "@/lib/recruitment/report-data";

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
    return NextResponse.json(snapshot, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ReportDataError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("[recruitment/report] unexpected error:", error);
    return NextResponse.json({ error: "Không thể tải báo cáo tuyển dụng." }, { status: 500 });
  }
}
