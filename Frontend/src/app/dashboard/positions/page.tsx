import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PositionsListClient from "./positions-list-client";
import type { PositionListItem, TagItem } from "@/app/dashboard/management-types";

export default async function PositionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  /* Fetch positions with skill requirement counts */
  const { data: rawPositions } = await supabase
    .from("positions")
    .select("id, title, department, target_level, status, created_at, position_skill_requirements(count)")
    .order("created_at", { ascending: false });

  /* Count assigned persons per position */
  const { data: personAssignments } = await supabase
    .from("persons")
    .select("position_id");

  /* Fetch entity tags for all positions */
  const { data: entityTags } = await supabase
    .from("entity_tags")
    .select("entity_id, tags(id, name, color, created_at)")
    .eq("entity_type", "position");

  /* Build lookup maps */
  const personCountMap = new Map<string, number>();
  for (const p of personAssignments ?? []) {
    if (p.position_id) {
      personCountMap.set(p.position_id, (personCountMap.get(p.position_id) ?? 0) + 1);
    }
  }

  const tagMap = new Map<string, TagItem[]>();
  for (const et of entityTags ?? []) {
    if (!et.tags) continue;
    const tags = tagMap.get(et.entity_id) ?? [];
    tags.push(et.tags as unknown as TagItem);
    tagMap.set(et.entity_id, tags);
  }

  /* Enrich positions */
  const positions: PositionListItem[] = (rawPositions ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    department: p.department,
    target_level: p.target_level,
    status: p.status ?? "active",
    position_skill_requirements: p.position_skill_requirements,
    created_at: p.created_at,
    assigned_persons_count: personCountMap.get(p.id) ?? 0,
    tags: tagMap.get(p.id) ?? [],
  }));

  return <PositionsListClient positions={positions} />;
}
