import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractTextFromFile, extractTextFromUrl } from "./text-extractor.ts";
import { extractTopics } from "./topic-extractor.ts";

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

  let documentId: string | undefined;

  try {
    const body = await req.json() as { documentId: string; preExtractedText?: string };
    documentId = body.documentId;

    if (!documentId) {
      return new Response(JSON.stringify({ error: "Missing documentId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch document
    const { data: doc, error: docErr } = await supabase
      .from("document_sources")
      .select("id, file_name, file_url, format, source_url, status, document_id")
      .eq("id", documentId)
      .single();

    if (docErr || !doc) throw new Error("Document not found");

    if (doc.status === "extracting_topics") {
      return new Response(JSON.stringify({ skipped: true, status: doc.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as extracting
    await supabase
      .from("document_sources")
      .update({ status: "extracting_topics" })
      .eq("id", documentId);

    // Fetch AI key + model
    const { data: aiSettings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["openai_api_key", "ai_model"]);

    const aiMap = new Map(
      (aiSettings ?? []).map((s: { key: string; value: unknown }) => [s.key, s.value as string])
    );
    const openaiApiKey = aiMap.get("openai_api_key") || Deno.env.get("OPENAI_API_KEY") || "";
    // Topic extraction uses the configured analysis model (PDF text extraction stays gpt-4o, see text-extractor.ts)
    const aiModel = aiMap.get("ai_model") || Deno.env.get("OPENAI_MODEL") || "gpt-4o";
    if (!openaiApiKey) throw new Error("OpenAI API key not configured");

    // Extract text — prefer pre-extracted sources to avoid re-downloading
    let text: string | null = body.preExtractedText ?? null;

    if (!text && doc.document_id) {
      const { data: libDoc } = await supabase
        .from("documents")
        .select("extracted_text")
        .eq("id", doc.document_id)
        .single();
      text = libDoc?.extracted_text ?? null;
    }

    if (!text) {
      if (doc.format === "url") {
        if (!doc.source_url) throw new Error("source_url missing for url-type document");
        text = await extractTextFromUrl(doc.source_url);
      } else {
        if (!doc.file_url) throw new Error("file_url missing for file-type document");

        const { data: signedData, error: signErr } = await supabase.storage
          .from("document-sources")
          .createSignedUrl(doc.file_url, 300);

        if (signErr || !signedData?.signedUrl) throw new Error("Failed to generate signed URL");

        const fileRes = await fetch(signedData.signedUrl);
        if (!fileRes.ok) throw new Error(`Failed to download file: ${fileRes.status}`);

        const bytes = new Uint8Array(await fileRes.arrayBuffer());
        text = await extractTextFromFile(bytes, doc.format, doc.file_name ?? "document", openaiApiKey);
      }
    }

    if (!text?.trim()) throw new Error("No text could be extracted from the document");

    // Persist extracted text so Phase 2 can include it in question generation prompts
    await supabase
      .from("document_sources")
      .update({ extracted_text: text })
      .eq("id", documentId);

    // Extract topics via AI
    const topics = await extractTopics(text!, openaiApiKey, aiModel);

    if (topics.length === 0) throw new Error("No topics could be extracted from the document");

    // Delete any previously extracted topics for this document
    await supabase.from("document_topics").delete().eq("document_id", documentId);

    // Insert topics
    const topicRows = topics.map((t, i) => ({
      document_id: documentId,
      title: t.title,
      summary: t.summary ?? null,
      key_points: t.key_points ?? [],
      order_index: i,
      is_approved: true,
    }));

    const { error: insertErr } = await supabase.from("document_topics").insert(topicRows);
    if (insertErr) throw new Error(`Failed to insert topics: ${insertErr.message}`);

    // Mark done
    await supabase
      .from("document_sources")
      .update({ status: "topics_ready", topics_extracted_at: new Date().toISOString() })
      .eq("id", documentId);

    return new Response(
      JSON.stringify({ success: true, topicCount: topics.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[extract-document-topics] Error:", message);

    if (documentId) {
      await Promise.all([
        supabase
          .from("document_sources")
          .update({ status: "failed" })
          .eq("id", documentId),
        supabase
          .from("document_jobs")
          .insert({
            document_source_id: documentId,
            job_type: "extract_topics",
            status: "failed",
            error_message: message,
          }),
      ]);
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
