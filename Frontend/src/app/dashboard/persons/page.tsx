import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PersonsListClient from "./persons-list-client";
import type { PersonListItem, TagItem } from "@/app/dashboard/management-types";

export default async function PersonsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  /* Fetch persons with position title */
  const { data: rawPersons } = await supabase
    .from("persons")
    .select("id, full_name, email, type, department, current_level, position_id, status, created_at, positions(title)")
    .order("created_at", { ascending: false });

  /* Fetch entity tags for all persons in one query */
  const { data: entityTags } = await supabase
    .from("entity_tags")
    .select("entity_id, tags(id, name, color, created_at)")
    .eq("entity_type", "person");

  /* Fetch group memberships for all persons */
  const { data: memberships } = await supabase
    .from("group_members")
    .select("person_id, groups(name)");

  /* Fetch person skills counts */
  const { data: skillCounts } = await supabase
    .from("person_skills")
    .select("person_id");

  /* Build lookup maps */
  const tagMap = new Map<string, TagItem[]>();
  for (const et of entityTags ?? []) {
    if (!et.tags) continue;
    const tags = tagMap.get(et.entity_id) ?? [];
    tags.push(et.tags as unknown as TagItem);
    tagMap.set(et.entity_id, tags);
  }

  const groupMap = new Map<string, string[]>();
  for (const m of memberships ?? []) {
    const groups = groupMap.get(m.person_id) ?? [];
    if (m.groups) groups.push((m.groups as unknown as { name: string }).name);
    groupMap.set(m.person_id, groups);
  }

  const skillCountMap = new Map<string, number>();
  for (const s of skillCounts ?? []) {
    skillCountMap.set(s.person_id, (skillCountMap.get(s.person_id) ?? 0) + 1);
  }

  /* Enrich persons */
  const persons: PersonListItem[] = (rawPersons ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    type: p.type,
    department: p.department,
    current_level: p.current_level,
    position_id: p.position_id,
    status: p.status ?? "active",
    created_at: p.created_at,
    position_title: (p.positions as unknown as { title: string } | null)?.title ?? null,
    group_names: groupMap.get(p.id) ?? [],
    tags: tagMap.get(p.id) ?? [],
    skills_count: skillCountMap.get(p.id) ?? 0,
  }));

  return <PersonsListClient persons={persons} />;
}
