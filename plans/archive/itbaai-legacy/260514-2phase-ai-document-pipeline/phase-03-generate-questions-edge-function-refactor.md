---
phase: 3
title: "Generate Questions Edge Function Refactor"
status: pending
priority: P1
effort: "2h"
dependencies: [1, 2]
---

# Phase 3: Generate Questions Edge Function Refactor

## Overview

Refactor `generate-questions-from-doc` edge function to operate on **approved topics** from DB instead of raw document text. Input changes from `{ jobId }` to `{ documentId, approvedTopicIds: string[] }`. For each approved topic, call OpenAI to generate up to 15 MCQ questions with `topic_tag = topic.title`. Stores results in `document_jobs.result_json` and sets `document_sources.status = "done"`.

## Requirements

- Functional:
  - Input: `{ documentId: string, approvedTopicIds: string[] }`
  - Fetch approved topics rows from `document_topics` WHERE `id IN (approvedTopicIds)` AND `is_approved = true`
  - For each topic: call OpenAI to generate up to 15 MCQ questions
  - Each question: `{ question_text, option_a/b/c/d, correct_answer, explanation, level, topic_tag: topic.title }`
  - Create new `document_jobs` row (type `"generate_questions"`) at start, update on finish
  - Set `document_sources.status = "generating_questions"` at start, `"done"` on success, `"failed"` on error
  - Return `{ success: true, questionCount, jobId }` on success
- Non-functional:
  - Deno runtime — no Node.js APIs
  - Process topics sequentially (avoid rate limit spikes)
  - Max 15 questions per topic (`MAX_QUESTIONS_PER_TOPIC = 15`)
  - Use `response_format: { type: "json_object" }` — prompt must contain the word "json"

## Architecture

```
Client → POST /api/document-sources/[id]/generate-questions { approvedTopicIds[] }
  → invoke edge fn: supabase.functions.invoke("generate-questions-from-doc", { documentId, approvedTopicIds })
  → index.ts
      → fetch topics from document_topics WHERE id IN approvedTopicIds AND is_approved = true
      → set document_sources.status = "generating_questions"
      → create document_jobs row (status = "processing")
      → for each topic → generateQuestionsFromTopic(topic) → AiQuestion[]
      → flatten all questions
      → update document_jobs.result_json, status = "done"
      → set document_sources.status = "done"
```

## Related Code Files

- Modify: `supabase/functions/generate-questions-from-doc/index.ts`
- Modify: `supabase/functions/generate-questions-from-doc/question-generator.ts`
- Read (context): `supabase/functions/generate-questions-from-doc/text-extractor.ts`

## Implementation Steps

1. **Modify `question-generator.ts`** — add new `generateQuestionsFromTopic` function:

```typescript
export interface DocumentTopic {
  id: string;
  title: string;
  summary: string | null;
  key_points: string[];
}

const MAX_QUESTIONS_PER_TOPIC = 15;

export async function generateQuestionsFromTopic(
  topic: DocumentTopic,
  apiKey: string,
  model: string,
): Promise<AiQuestion[]> {
  const keyPointsText = topic.key_points.length > 0
    ? `\nKey points:\n${topic.key_points.map(kp => `- ${kp}`).join("\n")}`
    : "";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert technical interviewer. Generate up to ${MAX_QUESTIONS_PER_TOPIC} multiple-choice questions for IT interview preparation.
Return JSON: { "questions": [ { "question_text": string, "option_a": string, "option_b": string, "option_c": string, "option_d": string, "correct_answer": "a"|"b"|"c"|"d", "explanation": string, "level": "junior"|"middle"|"senior" } ] }`,
        },
        {
          role: "user",
          content: `Topic: ${topic.title}\n${topic.summary ?? ""}${keyPointsText}\n\nGenerate interview questions for this topic.`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error: ${await res.text()}`);
  const data = await res.json() as { choices: { message: { content: string } }[] };
  const parsed = JSON.parse(data.choices[0].message.content) as { questions?: AiQuestion[] };
  return (parsed.questions ?? []).map(q => ({ ...q, topic_tag: topic.title }));
}
```

2. **Modify `index.ts`** — replace `jobId`-based input with `documentId + approvedTopicIds`:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateQuestionsFromTopic } from "./question-generator.ts";
import type { AiQuestion, DocumentTopic } from "./question-generator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  let documentId: string | undefined;

  try {
    const body = await req.json() as { documentId: string; approvedTopicIds: string[] };
    documentId = body.documentId;
    const approvedTopicIds: string[] = body.approvedTopicIds ?? [];

    if (!documentId || approvedTopicIds.length === 0) {
      return new Response(JSON.stringify({ error: "Missing documentId or approvedTopicIds" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch approved topics
    const { data: topics, error: topicsErr } = await supabase
      .from("document_topics")
      .select("id, title, summary, key_points")
      .in("id", approvedTopicIds)
      .eq("is_approved", true);

    if (topicsErr || !topics?.length) throw new Error("No approved topics found");

    // Fetch AI config
    const { data: aiSettings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["openai_api_key", "ai_model"]);

    const aiMap = new Map(
      (aiSettings ?? []).map((s: { key: string; value: unknown }) => [s.key, s.value as string])
    );
    const openaiApiKey = aiMap.get("openai_api_key") || Deno.env.get("OPENAI_API_KEY") || "";
    const aiModel = aiMap.get("ai_model") || Deno.env.get("OPENAI_MODEL") || "gpt-4o";

    if (!openaiApiKey) throw new Error("OpenAI API key not configured");

    // Create document_jobs row
    const { data: job } = await supabase
      .from("document_jobs")
      .insert({ document_source_id: documentId, job_type: "generate_questions", status: "processing" })
      .select("id")
      .single();

    const jobId = job?.id;

    // Mark status
    await supabase.from("document_sources")
      .update({ status: "generating_questions" })
      .eq("id", documentId);

    // Generate per topic (sequential to avoid rate limits)
    const allQuestions: AiQuestion[] = [];
    for (const topic of topics as DocumentTopic[]) {
      const questions = await generateQuestionsFromTopic(topic, openaiApiKey, aiModel);
      allQuestions.push(...questions);
    }

    const now = new Date().toISOString();
    await Promise.all([
      jobId
        ? supabase.from("document_jobs").update({ status: "done", result_json: allQuestions, updated_at: now }).eq("id", jobId)
        : Promise.resolve(),
      supabase.from("document_sources").update({ status: "done" }).eq("id", documentId),
    ]);

    return new Response(
      JSON.stringify({ success: true, questionCount: allQuestions.length, jobId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate-questions-from-doc] Error:", message);
    if (documentId) {
      await supabase.from("document_sources").update({ status: "failed" }).eq("id", documentId);
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

3. Deploy: `supabase functions deploy generate-questions-from-doc`

## Success Criteria

- [ ] Edge function accepts `{ documentId, approvedTopicIds[] }` input
- [ ] Fetches only `is_approved = true` topics from `document_topics`
- [ ] Each generated question has `topic_tag = topic.title`
- [ ] Max 15 questions per topic enforced
- [ ] `document_jobs` row created with `result_json` containing all questions
- [ ] `document_sources.status` transitions: `topics_ready → generating_questions → done | failed`
- [ ] Old `jobId`-based flow removed (breaking change — no backward compat needed)

## Risk Assessment

- **Breaking change**: Existing callers using `{ jobId }` input will break. Only invoked from API route (Phase 4) which we fully control — safe.
- **Sequential per-topic generation** adds latency (~3-8s per topic). For 10 topics = 30-80s — acceptable for leader-triggered flow.
- `document_jobs` table must already exist — verify schema before deploy.
