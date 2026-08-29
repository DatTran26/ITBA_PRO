import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PositionDetailClient from "./position-detail-client";
import type { PositionDetail } from "@/app/dashboard/management-types";

export default async function PositionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  /* Parallel queries */
  const [posRes, skillsRes, personsRes, notesRes, tagsRes, activityRes] = await Promise.all([
    supabase
      .from("positions")
      .select("*, position_skill_requirements(id, skill_id, required_level, is_mandatory, checklist_order, skills(name, category))")
      .eq("id", id)
      .single(),
    supabase.from("skills").select("id, name, category").order("name"),
    supabase
      .from("persons")
      .select("id, full_name, email, type, current_level, status, position_id")
      .eq("position_id", id),
    supabase
      .from("notes")
      .select("*, users(name, email)")
      .eq("entity_type", "position")
      .eq("entity_id", id)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("entity_tags")
      .select("id, tag_id, entity_type, entity_id, tags(id, name, color, created_at)")
      .eq("entity_type", "position")
      .eq("entity_id", id),
    supabase
      .from("activity_logs")
      .select("*, users(name, email)")
      .eq("entity_type", "position")
      .eq("entity_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (!posRes.data) notFound();

  return (
    <PositionDetailClient
      position={posRes.data as unknown as PositionDetail}
      availableSkills={skillsRes.data ?? []}
      assignedPersons={personsRes.data ?? []}
      entityTags={(tagsRes.data ?? []) as unknown as import("@/app/dashboard/management-types").EntityTagItem[]}
      activityLogs={activityRes.data ?? []}
    />
  );
}
