import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const admin = createAdminClient();

  try {
    const [
      appResult,
      historyResult,
      notesResult,
      interviewsResult,
    ] = await Promise.all([
      admin
        .from("job_applications")
        .select("id, pipeline_status, created_at, created_by, person_id, job_description_id, cv_id, current_screening_id")
        .eq("id", id)
        .single(),
      admin
        .from("candidate_status_history")
        .select("id, from_status, to_status, changed_by, changed_at, note")
        .eq("job_application_id", id)
        .order("changed_at", { ascending: false }),
      admin
        .from("notes")
        .select("*")
        .eq("entity_type", "job_application")
        .eq("entity_id", id)
        .order("created_at", { ascending: false }),
      admin
        .from("interview_schedules")
        .select("*")
        .eq("job_application_id", id),
    ]);

    if (appResult.error || !appResult.data) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const app = appResult.data;

    const [personResult, jdResult, cvResult, screeningResult] = await Promise.all([
      admin
        .from("persons")
        .select("id, full_name, email, type, source, status")
        .eq("id", app.person_id)
        .single(),
      app.job_description_id
        ? admin
          .from("job_descriptions")
          .select("id, title, role_key, department, full_text, auto_reject_threshold")
          .eq("id", app.job_description_id)
          .single()
        : Promise.resolve({ data: null, error: null }),
      app.cv_id
        ? admin
          .from("candidate_cvs")
          .select("id, parse_status, original_filename, mime_type, retry_count")
          .eq("id", app.cv_id)
          .single()
        : Promise.resolve({ data: null, error: null }),
      app.current_screening_id
        ? admin
          .from("candidate_screenings")
          .select("id, ai_score, final_score, skill_match_score, experience_match_score, domain_match_score, education_match_score, culture_fit_score, strengths_json, weaknesses_json, summary, recommendation, key_highlights, missing_requirements, parsed_cv_json, is_overridden, override_reason, overridden_at, screened_at")
          .eq("id", app.current_screening_id)
          .single()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const person = personResult.data;
    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    const jd = jdResult.data;
    const cv = cvResult.data;
    const screening = screeningResult.data;

    const history = (historyResult.data ?? []).map((h) => ({
      id: h.id,
      fromStatus: h.from_status,
      toStatus: h.to_status,
      changedBy: h.changed_by,
      changedAt: h.changed_at,
      note: h.note,
    }));

    return NextResponse.json({
      application: {
        id: app.id,
        pipelineStatus: app.pipeline_status,
        createdAt: app.created_at,
        createdBy: app.created_by,
      },
      person: {
        id: person.id,
        fullName: person.full_name,
        email: person.email,
        type: person.type,
        source: person.source,
      },
      jobDescription: jd ?? null,
      cv: cv
        ? {
          id: cv.id,
          parseStatus: cv.parse_status,
          originalFilename: cv.original_filename,
          mimeType: cv.mime_type,
          retryCount: cv.retry_count,
        }
        : null,
      screening: screening
        ? {
          id: screening.id,
          aiScore: screening.ai_score,
          finalScore: screening.final_score,
          skillMatchScore: screening.skill_match_score,
          experienceMatchScore: screening.experience_match_score,
          domainMatchScore: screening.domain_match_score,
          educationMatchScore: screening.education_match_score ?? null,
          cultureFitScore: screening.culture_fit_score ?? null,
          strengthsJson: screening.strengths_json,
          weaknessesJson: screening.weaknesses_json,
          summary: screening.summary ?? null,
          recommendation: screening.recommendation ?? null,
          keyHighlights: screening.key_highlights ?? null,
          missingRequirements: screening.missing_requirements ?? null,
          parsedCvJson: screening.parsed_cv_json ?? null,
          isOverridden: screening.is_overridden,
          overrideReason: screening.override_reason,
          overriddenAt: screening.overridden_at,
          screenedAt: screening.screened_at,
        }
        : null,
      history,
      notes: notesResult.data ?? [],
      interviews: interviewsResult.data ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
