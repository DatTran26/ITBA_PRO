import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractText } from "@/lib/cv-extractor";
import { OpenAIScorer } from "@/lib/cv-scorer";
import { getAiConfig } from "@/lib/get-ai-config";

export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { id } = await params;

  if (!ctx.isHr && !ctx.isInterviewer && !ctx.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  let cvId: string | undefined;

  try {
    // 1. Fetch application
    const { data: application, error: appError } = await admin
      .from("job_applications")
      .select("cv_id, job_description_id, person_id, pipeline_status")
      .eq("id", id)
      .maybeSingle();

    if (appError) throw new Error(appError.message);
    if (!application || !application.cv_id) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    cvId = application.cv_id;

    // 2. Fetch CV record
    const { data: cv, error: cvError } = await admin
      .from("candidate_cvs")
      .select("id, parse_status, retry_count, storage_path, original_filename, mime_type")
      .eq("id", application.cv_id)
      .maybeSingle();

    if (cvError) throw new Error(cvError.message);
    if (!cv) return NextResponse.json({ error: "CV not found" }, { status: 404 });

    if (cv.parse_status === "COMPLETED") {
      return NextResponse.json({ error: "CV already processed successfully" }, { status: 422 });
    }

    const newRetryCount = (cv.retry_count ?? 0) + 1;

    // 3. Set PROCESSING
    await admin
      .from("candidate_cvs")
      .update({
        parse_status: "PROCESSING",
        retry_count: newRetryCount,
        last_error: null,
        processing_started_at: new Date().toISOString(),
      })
      .eq("id", cv.id);

    // 4. Fetch JD text and threshold — JD is REQUIRED
    if (!application.job_description_id) {
      return NextResponse.json(
        { error: "Job Description is required for CV Analysis. Please assign a JD first." },
        { status: 422 }
      );
    }

    const { data: jd } = await admin
      .from("job_descriptions")
      .select("full_text, auto_reject_threshold")
      .eq("id", application.job_description_id)
      .single();

    if (!jd || !jd.full_text) {
      return NextResponse.json(
        { error: "Job Description not found or empty." },
        { status: 422 }
      );
    }

    const jdText = jd.full_text;
    const jdThreshold: number | null = jd.auto_reject_threshold;

    // 5. Resolve global threshold if JD doesn't override
    let globalThreshold = 40;
    if (jdThreshold === null) {
      const { data: settingRow } = await admin
        .from("system_settings")
        .select("value")
        .eq("key", "recruitment.auto_reject_threshold")
        .single();
      if (settingRow?.value && typeof settingRow.value === "object") {
        const val = (settingRow.value as Record<string, unknown>).threshold;
        if (typeof val === "number") globalThreshold = val;
      }
    }
    const threshold = jdThreshold ?? globalThreshold;

    // 6. Get AI config
    const { apiKey: openaiApiKey, model: aiModel } = await getAiConfig();

    // 7. Download CV file from storage
    const { data: fileData, error: fileErr } = await admin.storage
      .from("candidate-cvs")
      .download(cv.storage_path);

    if (fileErr || !fileData) throw new Error("Failed to download CV from storage");

    const fileBytes = new Uint8Array(await fileData.arrayBuffer());

    // 8. Extract text once, then run scoring + info extraction in parallel
    const cvText = await extractText(fileBytes, cv.mime_type, cv.original_filename, openaiApiKey);

    let tokensIn = 0;
    let tokensOut = 0;

    const scorer = new OpenAIScorer(openaiApiKey, aiModel, (ti, to) => {
      tokensIn = ti;
      tokensOut = to;
    });

    // Task A: Score CV against JD using extracted text
    const scoreTask = scorer.score(cvText, jdText);

    // Task B: Extract structured CV info from extracted text
    const parsedInfoTask = (async () => {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: aiModel,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: `You are an expert CV/resume parser. Extract ALL core information from the provided CV text.
Return ONLY valid JSON (no markdown, no explanation):
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+84 xxx xxx xxx",
  "summary": "Brief professional summary in 2-3 sentences",
  "skills": ["skill1", "skill2"],
  "education": [{"school": "University", "degree": "Degree", "gpa": "3.72/4.0", "year": "2023-2026"}],
  "experience": [{"company": "Company", "role": "Title", "period": "Jan 2023 - Present", "highlights": ["achievement1"]}],
  "certifications": ["Cert 1"],
  "languages": ["Vietnamese (Native)", "English (B1)"],
  "links": {"github": "url", "linkedin": "url", "portfolio": "url"}
}
Use empty string or empty array if not found. Keep values concise.`,
              },
              {
                role: "user",
                content: `Extract all core information from this CV:\n\n${cvText}`,
              },
            ],
          }),
        });

        if (!res.ok) return null;
        const json = await res.json();
        const raw = json.choices?.[0]?.message?.content?.trim() ?? "{}";
        return JSON.parse(raw);
      } catch (e) {
        console.warn("[cv-analysis] parsedInfo extraction failed:", e);
        return null;
      }
    })();

    // Wait for both to complete
    const [result, parsedInfo] = await Promise.all([scoreTask, parsedInfoTask]);

    // 9. Insert candidate_screenings
    const { data: screening, error: screenErr } = await admin
      .from("candidate_screenings")
      .insert({
        job_application_id: id,
        ai_score: result.ai_score,
        final_score: result.ai_score,
        skill_match_score: result.skill_match_score,
        experience_match_score: result.experience_match_score,
        domain_match_score: result.domain_match_score,
        education_match_score: result.education_match_score,
        culture_fit_score: result.culture_fit_score,
        strengths_json: result.strengths,
        weaknesses_json: result.weaknesses,
        summary: result.summary,
        recommendation: result.recommendation,
        key_highlights: result.key_highlights,
        missing_requirements: result.missing_requirements,
        parsed_cv_json: result.parsed_cv,
        ai_provider: result.ai_provider,
        ai_model: result.ai_model,
        prompt_version: result.prompt_version,
      })
      .select("id")
      .single();

    if (screenErr || !screening) throw new Error("Failed to insert screening: " + screenErr?.message);

    // 10. Always SCREENED — AI score is advisory; humans decide REJECTED.
    const fromStatus = application.pipeline_status;
    const nextStatus = fromStatus === "NEW" ? "SCREENED" : fromStatus;
    const belowThreshold = result.ai_score < threshold;

    // 11. Update job_applications
    await admin
      .from("job_applications")
      .update({
        current_screening_id: screening.id,
        pipeline_status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    // 12. Insert status history
    await admin.from("candidate_status_history").insert({
      job_application_id: id,
      from_status: fromStatus,
      to_status: nextStatus,
      note: `AI screening completed. Score: ${result.ai_score} (review threshold ${threshold}${belowThreshold ? "; below threshold — human review required" : ""}). Not auto-rejected.`,
    });

    // 13. Log ai_usage
    if (tokensIn > 0 || tokensOut > 0) {
      const { data: adminUser } = await admin
        .from("users")
        .select("id")
        .eq("role", "admin")
        .limit(1)
        .single();

      if (adminUser) {
        await admin.from("ai_usage").insert({
          user_id: ctx.userId ?? adminUser.id,
          feature: "cv_screening",
          model: aiModel,
          tokens_in: tokensIn,
          tokens_out: tokensOut,
          cost_estimate: (tokensIn / 1000) * 0.0025 + (tokensOut / 1000) * 0.01,
          metadata: { application_id: id, cv_id: cv.id },
        });
      }
    }

    // 14. Set COMPLETED + save parsed_info
    await admin
      .from("candidate_cvs")
      .update({
        parse_status: "COMPLETED",
        parsed_info: parsedInfo,
        processing_finished_at: new Date().toISOString(),
      })
      .eq("id", cv.id);

    return NextResponse.json({
      success: true,
      message: "CV Analysis completed",
      screeningId: screening.id,
      pipelineStatus: nextStatus,
      aiScore: result.ai_score,
      belowReviewThreshold: belowThreshold,
      recommendation: result.recommendation,
      cvId: cv.id,
      retryCount: newRetryCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[cv-analysis] Error:", message);

    // Set FAILED on CV if we know the CV ID
    if (cvId) {
      await admin
        .from("candidate_cvs")
        .update({
          parse_status: "FAILED",
          last_error: message,
          processing_finished_at: new Date().toISOString(),
        })
        .eq("id", cvId);
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
