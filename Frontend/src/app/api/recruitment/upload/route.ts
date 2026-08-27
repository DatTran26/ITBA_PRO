import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE = 10_485_760;

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  if (!ctx.isHr && !ctx.isInterviewer && !ctx.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let storagePath: string | null = null;
  const admin = createAdminClient();

  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const jobDescriptionId = form.get("jobDescriptionId") as string | null;
    const candidateName = form.get("candidateName") as string | null;
    const candidateEmail = form.get("candidateEmail") as string | null;

    if (!file || !candidateName) {
      return NextResponse.json({ error: "file and candidateName are required" }, { status: 400 });
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only PDF and DOCX are allowed." }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit." }, { status: 400 });
    }

    // Upload to storage
    const bytes = await file.arrayBuffer();
    storagePath = `${ctx.userId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await admin.storage
      .from("candidate-cvs")
      .upload(storagePath, bytes, { contentType: file.type });

    if (uploadError) {
      return NextResponse.json({ error: "Storage upload failed", detail: uploadError.message }, { status: 500 });
    }

    // Upsert person
    let personId: string;
    if (candidateEmail) {
      const { data: existing } = await admin
        .from("persons")
        .select("id")
        .eq("email", candidateEmail)
        .maybeSingle();

      if (existing) {
        personId = existing.id;
      } else {
        const { data: newPerson, error: personError } = await admin
          .from("persons")
          .insert({ full_name: candidateName, email: candidateEmail, source: "recruitment", type: "candidate", status: "active", created_by: ctx.userId })
          .select("id")
          .single();
        if (personError || !newPerson) throw new Error(personError?.message ?? "Failed to create person");
        personId = newPerson.id;
      }
    } else {
      const { data: newPerson, error: personError } = await admin
        .from("persons")
        .insert({ full_name: candidateName, email: null, source: "recruitment", type: "candidate", status: "active", created_by: ctx.userId })
        .select("id")
        .single();
      if (personError || !newPerson) throw new Error(personError?.message ?? "Failed to create person");
      personId = newPerson.id;
    }

    // Insert candidate_cvs
    const { data: cvRow, error: cvError } = await admin
      .from("candidate_cvs")
      .insert({
        person_id: personId,
        storage_path: storagePath,
        original_filename: file.name,
        mime_type: file.type,
        parse_status: "PENDING",
        uploaded_by: ctx.userId,
      })
      .select("id")
      .single();
    if (cvError || !cvRow) throw new Error(cvError?.message ?? "Failed to insert CV");
    const cvId = cvRow.id;

    // Insert job_applications
    const { data: appRow, error: appError } = await admin
      .from("job_applications")
      .insert({
        person_id: personId,
        job_description_id: jobDescriptionId ?? null,
        cv_id: cvId,
        pipeline_status: "NEW",
        created_by: ctx.userId,
      })
      .select("id")
      .single();
    if (appError || !appRow) throw new Error(appError?.message ?? "Failed to insert application");
    const applicationId = appRow.id;

    // Insert candidate_status_history
    const { error: historyError } = await admin.from("candidate_status_history").insert({
      job_application_id: applicationId,
      from_status: null,
      to_status: "NEW",
      changed_by: ctx.userId,
    });
    if (historyError) throw new Error(historyError.message);

    // CV analysis is triggered client-side when the user lands on /cv-analyze page.
    // The cv-analyze page auto-triggers POST /cv-analysis when parseStatus === "PENDING".
    return NextResponse.json({ applicationId, cvId, personId }, { status: 202 });
  } catch (err) {
    // Best-effort storage cleanup if upload succeeded but DB failed
    if (storagePath) {
      await admin.storage.from("candidate-cvs").remove([storagePath]).catch(() => null);
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
