import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { logActivity } from "@/lib/crm/log-activity";

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin } = ctx;

  if (!isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  let body: { source_id?: string; target_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { source_id, target_id } = body;
  if (!source_id || !target_id) {
    return NextResponse.json({ error: "source_id and target_id are required" }, { status: 400 });
  }
  if (source_id === target_id) {
    return NextResponse.json({ error: "source_id and target_id must be different" }, { status: 400 });
  }

  try {
    /* 1. Migrate position_skill_requirements — skip conflicts (same position+target already exists) */
    const { data: existingPosReqs } = await supabase
      .from("position_skill_requirements")
      .select("position_id")
      .eq("skill_id", target_id);

    const conflictPositions = new Set((existingPosReqs ?? []).map((r) => r.position_id));

    const { data: sourcePosReqs } = await supabase
      .from("position_skill_requirements")
      .select("id, position_id")
      .eq("skill_id", source_id);

    const posReqsToUpdate = (sourcePosReqs ?? [])
      .filter((r) => !conflictPositions.has(r.position_id))
      .map((r) => r.id);

    if (posReqsToUpdate.length > 0) {
      const { error: posErr } = await supabase
        .from("position_skill_requirements")
        .update({ skill_id: target_id })
        .in("id", posReqsToUpdate);
      if (posErr) throw new Error(`Failed to migrate position requirements: ${posErr.message}`);
    }

    /* 2. Migrate person_skills — skip conflicts (same person+target already exists) */
    const { data: existingPersonSkills } = await supabase
      .from("person_skills")
      .select("person_id")
      .eq("skill_id", target_id);

    const conflictPersons = new Set((existingPersonSkills ?? []).map((r) => r.person_id));

    const { data: sourcePersonSkills } = await supabase
      .from("person_skills")
      .select("id, person_id")
      .eq("skill_id", source_id);

    const personSkillsToUpdate = (sourcePersonSkills ?? [])
      .filter((r) => !conflictPersons.has(r.person_id))
      .map((r) => r.id);

    if (personSkillsToUpdate.length > 0) {
      const { error: personErr } = await supabase
        .from("person_skills")
        .update({ skill_id: target_id })
        .in("id", personSkillsToUpdate);
      if (personErr) throw new Error(`Failed to migrate person skills: ${personErr.message}`);
    }

    /* 3. Delete source skill (cascades remaining conflict rows) */
    const { error: deleteErr } = await supabase
      .from("skills")
      .delete()
      .eq("id", source_id);
    if (deleteErr) throw new Error(`Failed to delete source skill: ${deleteErr.message}`);

    /* 4. Log activity */
    logActivity(supabase, userId, "skill", target_id, "skill_merged", {
      source_id,
      migrated_position_reqs: posReqsToUpdate.length,
      migrated_person_skills: personSkillsToUpdate.length,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
