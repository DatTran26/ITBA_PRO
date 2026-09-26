import { randomUUID } from "crypto";
import { after, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

const ALLOWED_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

const MAX_SIZE = 10 * 1024 * 1024;

type OcrResponse = {
  text: string;
  status: "success";
};

async function runOcrJob(args: {
  documentId: string;
  jobId: string;
  imageBytes: ArrayBuffer;
  mimeType: string;
  fileName: string;
  storagePath: string;
}) {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  try {
    await Promise.all([
      admin.from("document_sources").update({ status: "processing" }).eq("id", args.documentId),
      admin.from("document_jobs").update({ status: "processing", error_message: null }).eq("id", args.jobId),
    ]);

    const baseUrl = process.env.VISION_OCR_URL?.replace(/\/+$/, "") || "http://localhost:8000";

    const body = new FormData();
    body.append("file", new Blob([args.imageBytes], { type: args.mimeType }), args.fileName);

    const response = await fetch(`${baseUrl}/api/ocr/scan`, {
      method: "POST",
      body,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Vision OCR failed (${response.status}): ${detail}`);
    }

    const result = (await response.json()) as OcrResponse;
    if (result.status !== "success" || typeof result.text !== "string") {
      throw new Error("Vision OCR returned an invalid response");
    }

    const resultJson = {
      job_type: "ocr_scan",
      original_ocr_text: result.text,
      text: result.text,
      file_name: args.fileName,
      mime_type: args.mimeType,
      storage_path: args.storagePath,
      processed_at: now,
    };

    await Promise.all([
      admin
        .from("document_jobs")
        .update({ status: "done", result: resultJson, error_message: null })
        .eq("id", args.jobId),
      admin
        .from("document_sources")
        .update({ status: "done", extracted_text: result.text })
        .eq("id", args.documentId),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "OCR job failed";
    await Promise.all([
      admin.from("document_jobs").update({ status: "failed", error_message: message }).eq("id", args.jobId),
      admin.from("document_sources").update({ status: "failed" }).eq("id", args.documentId),
    ]);
  }
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const format = ALLOWED_MIME[file.type];
  if (!format) {
    return NextResponse.json({ error: "Unsupported file type. Allowed: png, jpg, jpeg, webp" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 413 });
  }

  const imageBytes = await file.arrayBuffer();
  if (imageBytes.byteLength === 0) {
    return NextResponse.json({ error: "Empty file uploaded" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_") || `ocr.${format}`;
  const storagePath = `${userId}/ocr/${Date.now()}_${randomUUID()}_${safeName}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("document-sources")
    .upload(storagePath, imageBytes, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: "Storage upload failed", detail: uploadError.message }, { status: 500 });
  }

  const { data: documentSource, error: documentError } = await admin
    .from("document_sources")
    .insert({
      title: file.name,
      file_name: file.name,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
      source_type: "file",
      status: "pending",
      created_by: userId,
    })
    .select("id")
    .single();

  if (documentError || !documentSource) {
    await admin.storage.from("document-sources").remove([storagePath]).catch(() => null);
    return NextResponse.json({ error: documentError?.message ?? "Document source insert failed" }, { status: 500 });
  }

  const { data: job, error: jobError } = await admin
    .from("document_jobs")
    .insert({
      document_source_id: documentSource.id,
      job_type: "ocr_scan",
      status: "pending",
    })
    .select("id")
    .single();

  if (jobError || !job) {
    await admin.from("document_sources").update({ status: "failed" }).eq("id", documentSource.id);
    return NextResponse.json({ error: jobError?.message ?? "Document job insert failed" }, { status: 500 });
  }

  after(() => runOcrJob({
    documentId: documentSource.id,
    jobId: job.id,
    imageBytes,
    mimeType: file.type,
    fileName: file.name,
    storagePath,
  }));

  return NextResponse.json({ documentId: documentSource.id, jobId: job.id, queued: true }, { status: 202 });
}
