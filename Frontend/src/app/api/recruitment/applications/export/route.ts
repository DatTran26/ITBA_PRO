import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { generateCsv, type ExportColumn } from "@/lib/export/csv-export";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ParseStatus, PipelineStatus } from "@/types/recruitment";

const MAX_EXPORT_ROWS = 5000;

const APPLICATION_COLUMNS: ExportColumn[] = [
  { key: "created_at", header: "Created At", format: (value) => value ? new Date(value as string).toISOString() : "" },
  { key: "pipeline_status", header: "Pipeline Status" },
  { key: "candidate_name", header: "Candidate Name" },
  { key: "candidate_email", header: "Candidate Email" },
  { key: "candidate_phone", header: "Candidate Phone" },
  { key: "job_title", header: "JD Title" },
  { key: "department", header: "Department" },
  { key: "cv_status", header: "CV Status" },
  { key: "cv_filename", header: "CV Filename" },
  { key: "final_score", header: "Final Score" },
  { key: "ai_score", header: "AI Score" },
  { key: "screening_summary", header: "Screening Summary" },
];

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, isHr, isInterviewer } = ctx;
  if (!isAdmin && !isHr && !isInterviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") as PipelineStatus | null;
  const jdId = searchParams.get("jdId");
  const minScore = searchParams.get("minScore");
  const maxScore = searchParams.get("maxScore");
  const cvStatus = searchParams.get("cvStatus") as ParseStatus | null;
  const createdFrom = searchParams.get("createdFrom");
  const createdTo = searchParams.get("createdTo");
  const q = searchParams.get("q");

  const admin = createAdminClient();
  const cvSelect = cvStatus
    ? "candidate_cvs!inner(id, parse_status, original_filename)"
    : "candidate_cvs(id, parse_status, original_filename)";
  const screeningSelect = minScore || maxScore
    ? "candidate_screenings!fk_current_screening!inner"
    : "candidate_screenings!fk_current_screening";

  let query = admin
    .from("job_applications")
    .select(`
      id, pipeline_status, created_at,
      persons!inner(full_name, email, phone),
      job_descriptions(title, department),
      ${cvSelect},
      ${screeningSelect}(final_score, ai_score, summary)
    `)
    .order("created_at", { ascending: false })
    .limit(MAX_EXPORT_ROWS);

  if (status) {
    query = query.eq("pipeline_status", status);
  }

  if (jdId) {
    query = query.eq("job_description_id", jdId);
  }

  if (cvStatus) {
    query = query.eq("candidate_cvs.parse_status", cvStatus);
  }

  if (createdFrom) {
    const from = new Date(createdFrom);
    if (!isNaN(from.getTime())) {
      query = query.gte("created_at", from.toISOString());
    }
  }

  if (createdTo) {
    const to = new Date(createdTo);
    if (!isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      query = query.lte("created_at", to.toISOString());
    }
  }

  if (minScore) {
    const min = parseFloat(minScore);
    if (!isNaN(min)) {
      query = query.gte("candidate_screenings.final_score", min);
    }
  }

  if (maxScore) {
    const max = parseFloat(maxScore);
    if (!isNaN(max)) {
      query = query.lte("candidate_screenings.final_score", max);
    }
  }

  if (q) {
    const term = `%${q}%`;
    query = query.or(`full_name.ilike.${term},email.ilike.${term}`, { referencedTable: "persons" });
  }

  const { data, error } = await query;

  if (error) {
    console.error("[applications export GET]", error);
    return NextResponse.json({ error: "Failed to export applications" }, { status: 500 });
  }

  type PersonRow = { full_name: string | null; email: string | null; phone: string | null };
  type JdRow = { title: string | null; department: string | null };
  type CvRow = { parse_status: string | null; original_filename: string | null };
  type ScreeningRow = { final_score: number | null; ai_score: number | null; summary: string | null };

  const rows = (data ?? []).map((row) => {
    const person = Array.isArray(row.persons) ? row.persons[0] : row.persons as PersonRow | null;
    const jd = Array.isArray(row.job_descriptions)
      ? row.job_descriptions[0] ?? null
      : row.job_descriptions as JdRow | null;
    const cv = Array.isArray(row.candidate_cvs)
      ? row.candidate_cvs[0] ?? null
      : row.candidate_cvs as CvRow | null;
    const screening = Array.isArray(row.candidate_screenings)
      ? row.candidate_screenings[0] ?? null
      : row.candidate_screenings as ScreeningRow | null;

    return {
      created_at: row.created_at,
      pipeline_status: row.pipeline_status,
      candidate_name: person?.full_name ?? "",
      candidate_email: person?.email ?? "",
      candidate_phone: person?.phone ?? "",
      job_title: jd?.title ?? "",
      department: jd?.department ?? "",
      cv_status: cv?.parse_status ?? "",
      cv_filename: cv?.original_filename ?? "",
      final_score: screening?.final_score ?? "",
      ai_score: screening?.ai_score ?? "",
      screening_summary: screening?.summary ?? "",
    };
  });

  const csvContent = generateCsv(APPLICATION_COLUMNS, rows as Record<string, unknown>[]);
  const filename = `recruitment-applications-export-${Date.now()}.csv`;

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
