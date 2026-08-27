import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ParseStatus, PipelineStatus } from "@/types/recruitment";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, isHr, isInterviewer } = ctx;
  if (!isAdmin && !isHr && !isInterviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
  );
  const offset = (page - 1) * pageSize;

  const status = searchParams.get("status") as PipelineStatus | null;
  const jdId = searchParams.get("jdId");
  const skillId = searchParams.get("skillId");
  const minScore = searchParams.get("minScore");
  const maxScore = searchParams.get("maxScore");
  const cvStatus = searchParams.get("cvStatus") as ParseStatus | null;
  const createdFrom = searchParams.get("createdFrom");
  const createdTo = searchParams.get("createdTo");
  const q = searchParams.get("q");

  const admin = createAdminClient();

  // Skill filter: resolve JD IDs whose position requires this skill
  let skillJdIds: string[] | null = null;
  if (skillId) {
    const { data: reqs } = await admin
      .from("position_skill_requirements")
      .select("position_id")
      .eq("skill_id", skillId);
    const positionIds = (reqs ?? []).map((r: { position_id: string }) => r.position_id);
    if (positionIds.length === 0) {
      return NextResponse.json({ applications: [], total: 0, page, pageSize });
    }
    const { data: jds } = await admin
      .from("job_descriptions")
      .select("id")
      .in("position_id", positionIds);
    skillJdIds = (jds ?? []).map((jd: { id: string }) => jd.id);
    if (skillJdIds.length === 0) {
      return NextResponse.json({ applications: [], total: 0, page, pageSize });
    }
  }

  const cvSelect = cvStatus
    ? "candidate_cvs!inner(id, parse_status, original_filename)"
    : "candidate_cvs(id, parse_status, original_filename)";
  const screeningSelect = minScore || maxScore
    ? "candidate_screenings!fk_current_screening!inner"
    : "candidate_screenings!fk_current_screening";

  let query = admin
    .from("job_applications")
    .select(
      `
      id, pipeline_status, created_at, created_by,
      persons!inner(id, full_name, email, phone, results(score, total_questions, status)),
      job_descriptions(id, title, department),
      ${cvSelect},
      ${screeningSelect}(id, final_score, ai_score, is_overridden, strengths_json, weaknesses_json, summary)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (status) {
    query = query.eq("pipeline_status", status);
  }

  if (jdId) {
    query = query.eq("job_description_id", jdId);
  }

  if (skillJdIds !== null) {
    query = query.in("job_description_id", skillJdIds);
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

  const { data, count, error } = await query;

  if (error) {
    console.error("[applications GET]", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }

  type ResultRow = { score: number | null; total_questions: number | null; status: string | null };
  type PersonRow = { id: string; full_name: string; email: string; phone: string | null; results: ResultRow[] | ResultRow | null };
  type JdRow = { id: string; title: string; department: string | null };
  type CvRow = { id: string; parse_status: string; original_filename: string };
  type ScreeningRow = {
    id: string;
    final_score: number | null;
    ai_score: number | null;
    is_overridden: boolean;
    strengths_json: string[] | null;
    weaknesses_json: string[] | null;
    summary: string | null;
  };

  const applications = (data ?? []).map((row) => {
    const person = Array.isArray(row.persons) ? row.persons[0] : row.persons as PersonRow;
    const jd = Array.isArray(row.job_descriptions)
      ? row.job_descriptions[0] ?? null
      : (row.job_descriptions as JdRow | null);
    const cv = Array.isArray(row.candidate_cvs)
      ? row.candidate_cvs[0] ?? null
      : (row.candidate_cvs as CvRow | null);
    const screening = Array.isArray(row.candidate_screenings)
      ? row.candidate_screenings[0] ?? null
      : (row.candidate_screenings as ScreeningRow | null);

    const testResults = Array.isArray(person?.results) ? person.results : (person?.results ? [person.results] : []);

    return {
      id: row.id,
      pipelineStatus: row.pipeline_status,
      createdAt: row.created_at,
      person: person
        ? {
          id: person.id,
          fullName: person.full_name,
          email: person.email,
          phone: person.phone,
          testResults: testResults.map(r => ({
            score: r.score,
            total: r.total_questions,
            status: r.status
          }))
        }
        : null,
      jobDescription: jd
        ? { id: jd.id, title: jd.title, department: jd.department }
        : null,
      cv: cv
        ? { id: cv.id, parseStatus: cv.parse_status, originalFilename: cv.original_filename }
        : null,
      screening: screening
        ? {
          id: screening.id,
          finalScore: screening.final_score,
          aiScore: screening.ai_score,
          isOverridden: screening.is_overridden,
          strengths: screening.strengths_json,
          weaknesses: screening.weaknesses_json,
          summary: screening.summary,
        }
        : null,
    };
  });

  return NextResponse.json({
    applications,
    total: count ?? 0,
    page,
    pageSize,
  });
}
