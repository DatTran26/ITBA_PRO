import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateQuestionsFromTopicsBatch } from "./question-generator.ts";
import type { TopicInput } from "./question-generator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// deno-lint-ignore no-explicit-any
declare const EdgeRuntime: { waitUntil: (p: Promise<unknown>) => void } | undefined;

async function runGeneration(
  supabase: ReturnType<typeof createClient>,
  documentId: string,
  jobId: string,
  approvedTopicIds: string[],
  perTopicCounts?: Record<string, number>,
  levelRatio?: { junior: number; middle: number; senior: number },
  questionTypes?: string[],
) {
  try {
    const { data: topics, error: topicsErr } = await supabase
      .from("document_topics")
      .select("id, title, summary, key_points")
      .in("id", approvedTopicIds)
      .eq("document_id", documentId)
      .eq("is_approved", true);

    if (topicsErr || !topics?.length) throw new Error("No approved topics found");

    const { data: docSource } = await supabase
      .from("document_sources")
      .select("extracted_text")
      .eq("id", documentId)
      .single();
    const documentText: string | null = (docSource as { extracted_text?: string } | null)?.extracted_text ?? null;
    if (!documentText?.trim()) {
      throw new Error("No extracted document text found. Please re-run topic extraction for this file.");
    }

    const { data: aiSettings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["openai_api_key", "ai_model"]);

    const aiMap = new Map(
      (aiSettings ?? []).map((s: { key: string; value: unknown }) => [s.key, s.value as string]),
    );
    const openaiApiKey = aiMap.get("openai_api_key") || Deno.env.get("OPENAI_API_KEY") || "";
    const aiModel = aiMap.get("ai_model") || Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";

    if (!openaiApiKey) throw new Error("OpenAI API key not configured");

    const allQuestions = await generateQuestionsFromTopicsBatch(
      topics as TopicInput[],
      openaiApiKey,
      aiModel,
      documentText,
      perTopicCounts,
      levelRatio,
      questionTypes,
    );

    // Post-Validation & Normalization
    const topicTitleMap = new Map(topics.map((t) => [t.title.toLowerCase().trim(), t.id]));
    const topicIdMap = new Map(topics.map((t) => [t.id, t]));

    const validTypes = questionTypes ? new Set(questionTypes) : null;
    const groupedQuestions = new Map<string, typeof allQuestions>();
    topics.forEach((t) => groupedQuestions.set(t.id, []));

    for (const q of allQuestions) {
      // 1. Whitelist type filter
      if (validTypes && q.question_type && !validTypes.has(q.question_type)) {
        continue;
      }

      // 2. Topic fuzzy-matching
      const tag = (q.topic_tag || "").toLowerCase().trim();
      let matchedTopicId = topicTitleMap.get(tag);
      if (!matchedTopicId) {
        for (const [title, id] of topicTitleMap.entries()) {
          if (title.includes(tag) || tag.includes(title)) {
            matchedTopicId = id;
            break;
          }
        }
      }
      // Fallback to first approved topic to avoid throwing away valuable questions
      if (!matchedTopicId && topics.length > 0) {
        matchedTopicId = topics[0].id;
      }

      if (matchedTopicId) {
        // Enforce difficulty level normalization to be junior/middle/senior
        const lvl = (q.level || "junior").toLowerCase().trim();
        q.level = ["junior", "middle", "senior"].includes(lvl) ? lvl : "junior";

        // Normalize topic_tag to exactly match canonical database title
        const topicObj = topicIdMap.get(matchedTopicId);
        if (topicObj) {
          q.topic_tag = topicObj.title;
        }

        groupedQuestions.get(matchedTopicId)!.push(q);
      }
    }

    // 3. Trim per-topic counts and compute shortages
    const finalQuestions: typeof allQuestions = [];
    const shortage: Array<{ topicId: string; topicTitle: string; requested: number; received: number; missing: number }> = [];

    for (const topic of topics) {
      const requested = perTopicCounts?.[topic.id] ?? 5;
      const qs = groupedQuestions.get(topic.id) || [];
      const received = qs.length;

      // Trim extras
      const trimmed = qs.slice(0, requested);
      finalQuestions.push(...trimmed);

      if (received < requested) {
        shortage.push({
          topicId: topic.id,
          topicTitle: topic.title,
          requested,
          received,
          missing: requested - received,
        });
      }
    }

    const now = new Date().toISOString();
    await Promise.all([
      supabase
        .from("document_jobs")
        .update({
          status: "done",
          result_json: {
            questions: finalQuestions,
            shortage: shortage.length > 0 ? shortage : null,
          },
          updated_at: now,
        })
        .eq("id", jobId),
      supabase.from("document_sources").update({ status: "done" }).eq("id", documentId),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate-questions-from-doc] Background error:", message);
    await Promise.all([
      supabase
        .from("document_sources")
        .update({ status: "failed" })
        .eq("id", documentId),
      supabase
        .from("document_jobs")
        .update({ status: "failed", error_message: message })
        .eq("id", jobId),
    ]);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  try {
    const body = await req.json() as {
      documentId: string;
      approvedTopicIds: string[];
      perTopicCounts?: Record<string, number>;
      levelRatio?: { junior: number; middle: number; senior: number };
      questionTypes?: string[];
    };

    const documentId = body.documentId;
    const approvedTopicIds: string[] = body.approvedTopicIds ?? [];
    const perTopicCounts = body.perTopicCounts;
    const levelRatio = body.levelRatio;
    const questionTypes = body.questionTypes;

    if (!documentId || approvedTopicIds.length === 0) {
      return new Response(JSON.stringify({ error: "Missing documentId or approvedTopicIds" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: job, error: jobErr } = await supabase
      .from("document_jobs")
      .insert({ document_source_id: documentId, job_type: "generate_questions", status: "processing" })
      .select("id")
      .single();

    if (jobErr || !job?.id) {
      const msg = `Failed to create generation job: ${jobErr?.message ?? "unknown error"}`;
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const jobId = job.id as string;

    await supabase
      .from("document_sources")
      .update({ status: "generating_questions" })
      .eq("id", documentId);

    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      EdgeRuntime.waitUntil(
        runGeneration(supabase, documentId, jobId, approvedTopicIds, perTopicCounts, levelRatio, questionTypes),
      );
    } else {
      setTimeout(() => {
        runGeneration(supabase, documentId, jobId, approvedTopicIds, perTopicCounts, levelRatio, questionTypes)
          .catch((e) => console.error("[generate-questions-from-doc] Unhandled:", e));
      }, 0);
    }

    return new Response(
      JSON.stringify({ success: true, queued: true, jobId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate-questions-from-doc] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
