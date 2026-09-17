import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractText } from "./extract.ts";
import { OpenAIScorer } from "./cv-scorer.ts";
import { resolveAiConfig } from "../_shared/ai-settings.ts";
import { jsonError, requireInternalCaller } from "../_shared/edge-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const caller = await requireInternalCaller(req, supabase, ["hr", "interviewer", "admin", "super_admin"]);
  if (caller instanceof Response) return new Response(caller.body, { status: caller.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let applicationId: string | undefined;
  let cvId: string | undefined;

  try {
    const body = await req.json() as { applicationId: string; cvId: string };
    applicationId = body.applicationId;
    cvId = body.cvId;

    if (!applicationId || !cvId) {
      return new Response(JSON.stringify({ error: "Missing applicationId or cvId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch CV record and verify it belongs to the requested application.
    const { data: cvRecord, error: cvErr } = await supabase
      .from("candidate_cvs")
      .select("storage_path, original_filename, mime_type")
      .eq("id", cvId)
      .single();

    if (cvErr || !cvRecord) throw new Error("CV record not found");

    // Fetch application + JD
    const { data: application, error: appErr } = await supabase
      .from("job_applications")
      .select("id, cv_id, job_description_id, person_id")
      .eq("id", applicationId)
      .single();

    if (appErr || !application) throw new Error("Application not found");
    if (application.cv_id !== cvId) return jsonError("CV does not belong to this application", 403, corsHeaders);

    await supabase
      .from("candidate_cvs")
      .update({ parse_status: "PROCESSING", processing_started_at: new Date().toISOString() })
      .eq("id", cvId);

    // Fetch JD text and threshold
    let jdText = "Không có mô tả công việc.";
    let jdThreshold: number | null = null;

    if (application.job_description_id) {
      const { data: jd } = await supabase
        .from("job_descriptions")
        .select("full_text, auto_reject_threshold")
        .eq("id", application.job_description_id)
        .single();
      if (jd) {
        jdText = jd.full_text;
        jdThreshold = jd.auto_reject_threshold;
      }
    }

    // Resolve global threshold if JD doesn't override
    let globalThreshold = 40;
    if (jdThreshold === null) {
      const { data: settingRow } = await supabase
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

    // Fetch AI config from system_settings
    const { data: aiSettings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["ai_provider", "openai_api_key", "gemini_api_key", "ai_model"]);

    const aiConfig = resolveAiConfig(aiSettings ?? [], Deno.env);

    if (!aiConfig.apiKey) {
      throw new Error("Missing AI API key. Set it in Settings (system_settings).");
    }

    // Download CV bytes from storage
    const { data: fileData, error: fileErr } = await supabase.storage
      .from("candidate-cvs")
      .download(cvRecord.storage_path);

    if (fileErr || !fileData) throw new Error("Failed to download CV from storage");

    const fileBytes = new Uint8Array(await fileData.arrayBuffer());

    // Extract text
    const cvText = await extractText(
      fileBytes,
      cvRecord.mime_type,
      cvRecord.original_filename,
      aiConfig
    );

    // Score CV
    let tokensIn = 0;
    let tokensOut = 0;

    const scorer = new OpenAIScorer(aiConfig, (ti, to) => {
      tokensIn = ti;
      tokensOut = to;
    });

    const result = await scorer.score(cvText, jdText);

    // Insert candidate_screenings
    const { data: screening, error: screenErr } = await supabase
      .from("candidate_screenings")
      .insert({
        job_application_id: applicationId,
        ai_score: result.ai_score,
        final_score: result.ai_score,
        skill_match_score: result.skill_match_score,
        experience_match_score: result.experience_match_score,
        domain_match_score: result.domain_match_score,
        strengths_json: result.strengths,
        weaknesses_json: result.weaknesses,
        parsed_cv_json: result.parsed_cv,
        ai_provider: result.ai_provider,
        ai_model: result.ai_model,
        prompt_version: result.prompt_version,
      })
      .select("id")
      .single();

    if (screenErr || !screening) throw new Error("Failed to insert screening: " + screenErr?.message);

    // Always SCREENED — AI score is advisory; humans decide REJECTED.
    const belowThreshold = result.ai_score < threshold;
    const newStatus = "SCREENED";

    // Update job_applications
    await supabase
      .from("job_applications")
      .update({
        current_screening_id: screening.id,
        pipeline_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    // Insert status history
    await supabase.from("candidate_status_history").insert({
      job_application_id: applicationId,
      from_status: "NEW",
      to_status: newStatus,
      note: `AI screening completed. Score: ${result.ai_score} (review threshold ${threshold}${belowThreshold ? "; below threshold — human review required" : ""}). Not auto-rejected.`,
    });

    // Log ai_usage
    if (tokensIn > 0 || tokensOut > 0) {
      const { data: adminUser } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin")
        .limit(1)
        .single();

      if (adminUser) {
        await supabase.from("ai_usage").insert({
          user_id: caller.id ?? adminUser.id,
          feature: "cv_screening",
          model: aiConfig.model,
          tokens_in: tokensIn,
          tokens_out: tokensOut,
          cost_estimate: (tokensIn / 1000) * 0.0025 + (tokensOut / 1000) * 0.01,
          metadata: { application_id: applicationId, cv_id: cvId },
        });
      }
    }

    // Set COMPLETED
    await supabase
      .from("candidate_cvs")
      .update({
        parse_status: "COMPLETED",
        processing_finished_at: new Date().toISOString(),
      })
      .eq("id", cvId);

    // Broadcast via Realtime (using Postgres channel)
    await supabase.channel(`application:${applicationId}`).send({
      type: "broadcast",
      event: "screening_complete",
      payload: {
        applicationId,
        screeningId: screening.id,
        pipelineStatus: newStatus,
        aiScore: result.ai_score,
      },
    });

    return new Response(
      JSON.stringify({ success: true, screeningId: screening.id, pipelineStatus: newStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cv-processor] Error:", message);

    // Set FAILED
    if (cvId) {
      await supabase
        .from("candidate_cvs")
        .update({
          parse_status: "FAILED",
          last_error: message,
          processing_finished_at: new Date().toISOString(),
        })
        .eq("id", cvId);
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
