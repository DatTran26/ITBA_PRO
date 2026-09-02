---
phase: 2
title: "Extract Topics Edge Function"
status: pending
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 2: Extract Topics Edge Function

## Overview

Create new Supabase Edge Function `extract-document-topics` that reads a document from storage, extracts it as text, then calls OpenAI to generate structured topics (title + summary + key_points[]), stores results in `document_topics`, and updates `document_sources.status = "topics_ready"`.

## Requirements

- Functional:
  - Input: `{ documentId: string }` in request body
  - Reuse shared `text-extractor.ts` helper from `generate-questions-from-doc`
  - Call OpenAI Chat Completions with structured JSON prompt to extract topics
  - Each topic: `{ title: string, summary: string (2-3 sentences), key_points: string[] }`
  - AI decides number of topics autonomously (no artificial limit)
  - Insert all topics into `document_topics` with sequential `order_index`
  - Set `document_sources.status = "topics_ready"`, `topics_extracted_at = now()`
  - On error: set `document_sources.status = "failed"`
- Non-functional:
  - Deno runtime — no Node.js APIs
  - If document text >100K chars: split into 80K-char chunks, extract per chunk, then deduplicate by title similarity
  - Max topics per chunk: 20 (to avoid prompt blowout)

## Architecture

```
Client → POST /document-sources/{id}/extract-topics (API route)
  → invoke edge fn: supabase.functions.invoke("extract-document-topics", { documentId })
  → extract-document-topics/index.ts
      → fetch document row (storage path, status check)
      → set status = "extracting_topics"
      → read file bytes from Supabase Storage
      → text-extractor.ts → plain text
      → if text > 100K: chunk → extract per chunk → merge & dedup
      → OpenAI prompt → JSON topics[]
      → insert into document_topics
      → set status = "topics_ready", topics_extracted_at = now()
```

## Related Code Files

- Create: `supabase/functions/extract-document-topics/index.ts`
- Create: `supabase/functions/extract-document-topics/topic-extractor.ts`
- Read (for reuse pattern): `supabase/functions/generate-questions-from-doc/index.ts`
- Read (for reuse pattern): `supabase/functions/generate-questions-from-doc/question-generator.ts`

## Implementation Steps

1. Read existing `generate-questions-from-doc/index.ts` to understand boilerplate (auth, CORS, Supabase client init, storage read pattern)

2. Create `supabase/functions/extract-document-topics/index.ts`:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractTopics } from "./topic-extractor.ts";
import { extractText } from "../generate-questions-from-doc/text-extractor.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { documentId } = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    // Fetch document row
    const { data: doc, error: docErr } = await supabase
      .from("document_sources")
      .select("*")
      .eq("id", documentId)
      .single();
    if (docErr || !doc) throw new Error("Document not found");

    // Set extracting status
    await supabase.from("document_sources").update({ status: "extracting_topics" }).eq("id", documentId);

    // Read file from storage
    const { data: fileData, error: fileErr } = await supabase.storage
      .from("documents")
      .download(doc.storage_path);
    if (fileErr || !fileData) throw new Error("File download failed");

    const buffer = await fileData.arrayBuffer();
    const text = await extractText(buffer, doc.file_type);

    // Extract topics (handles chunking internally)
    const topics = await extractTopics(text, Deno.env.get("OPENAI_API_KEY")!);

    // Insert topics
    const rows = topics.map((t, i) => ({
      document_id: documentId,
      title: t.title,
      summary: t.summary,
      key_points: t.key_points,
      order_index: i,
      is_approved: true,
    }));
    await supabase.from("document_topics").insert(rows);

    // Mark done
    await supabase.from("document_sources").update({
      status: "topics_ready",
      topics_extracted_at: new Date().toISOString(),
    }).eq("id", documentId);

    return new Response(JSON.stringify({ success: true, count: topics.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    // Mark failed — best effort
    try {
      const { documentId } = await (req.clone()).json().catch(() => ({}));
      if (documentId) {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await supabase.from("document_sources").update({ status: "failed" }).eq("id", documentId);
      }
    } catch {}
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

3. Create `supabase/functions/extract-document-topics/topic-extractor.ts`:
```typescript
const CHUNK_SIZE = 80_000;
const MAX_TOPICS_PER_CHUNK = 20;

interface Topic {
  title: string;
  summary: string;
  key_points: string[];
}

export async function extractTopics(text: string, openaiKey: string): Promise<Topic[]> {
  if (text.length <= CHUNK_SIZE) {
    return await extractFromChunk(text, openaiKey);
  }
  // Split into chunks, extract per chunk, dedup
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }
  const results = await Promise.all(chunks.map(c => extractFromChunk(c, openaiKey)));
  return deduplicateTopics(results.flat());
}

async function extractFromChunk(text: string, openaiKey: string): Promise<Topic[]> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert document analyst. Extract all distinct topics from the document.
Return JSON: { "topics": [ { "title": string, "summary": string (2-3 sentences explaining the topic), "key_points": string[] (3-7 bullet points) } ] }
Extract as many topics as the document contains. Do not artificially limit. Max ${MAX_TOPICS_PER_CHUNK} per response.`,
        },
        { role: "user", content: `Document:\n\n${text}` },
      ],
    }),
  });
  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
  const json = await response.json();
  const parsed = JSON.parse(json.choices[0].message.content);
  return parsed.topics ?? [];
}

function deduplicateTopics(topics: Topic[]): Topic[] {
  const seen = new Set<string>();
  return topics.filter(t => {
    const key = t.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
```

4. Deploy: `supabase functions deploy extract-document-topics`

## Success Criteria

- [ ] Edge function deploys without error
- [ ] On invocation with valid documentId: topics inserted into `document_topics`
- [ ] `document_sources.status` transitions: pending → extracting_topics → topics_ready
- [ ] `document_sources.topics_extracted_at` set on success
- [ ] On failure: status set to `"failed"`
- [ ] Text >100K chars handled via chunking
- [ ] `is_approved` defaults to `true` for all inserted topics

## Risk Assessment

- `text-extractor.ts` path import assumes it lives in sibling directory `../generate-questions-from-doc/` — verify exact path after reading existing function structure
- OpenAI `response_format: json_object` requires the word "json" in the system prompt — already included
- Deno import map may need `esm.sh` version pins — copy from existing edge function's imports
