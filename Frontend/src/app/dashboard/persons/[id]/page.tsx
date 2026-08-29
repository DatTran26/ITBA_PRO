import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PersonDetailClient from "./person-detail-client";
import type { PersonDetail, PersonSkillItem, TagItem, ActivityLogItem, CrmTaskItem } from "@/app/dashboard/management-types";

export default async function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: person } = await supabase
    .from("persons")
    .select("*, positions(title, department)")
    .eq("id", id)
    .single();

  if (!person) notFound();

  /* Parallel fetches for detail tabs */
  const [skillsRes, resultsRes, membershipsRes, tagsRes, activityRes, tasksRes] = await Promise.all([
    supabase.from("person_skills").select("*, skills(name, category)").eq("person_id", id),
    supabase.from("results").select("id, score, total_questions, status, submitted_at, tests(title, job_role)").eq("person_id", id).order("submitted_at", { ascending: false }).limit(20),
    supabase.from("group_members").select("id, groups(id, name, type)").eq("person_id", id),
    supabase.from("entity_tags").select("tags(id, name, color, created_at)").eq("entity_type", "person").eq("entity_id", id),
    supabase.from("activity_logs").select("*, users(name, email)").eq("entity_type", "person").eq("entity_id", id).order("created_at", { ascending: false }).limit(30),
    supabase.from("crm_tasks").select("*, users(name, email)").eq("entity_type", "person").eq("entity_id", id).order("created_at", { ascending: false }),
  ]);

  const tags: TagItem[] = (tagsRes.data ?? [])
    .map((et) => et.tags)
    .filter(Boolean) as unknown as TagItem[];

  return (
    <PersonDetailClient
      person={person as PersonDetail}
      skills={(skillsRes.data ?? []) as PersonSkillItem[]}
      results={(resultsRes.data ?? []) as any[]}
      memberships={(membershipsRes.data ?? []) as any[]}
      tags={tags}
      activityLogs={(activityRes.data ?? []) as ActivityLogItem[]}
      tasks={(tasksRes.data ?? []) as CrmTaskItem[]}
    />
  );
}
