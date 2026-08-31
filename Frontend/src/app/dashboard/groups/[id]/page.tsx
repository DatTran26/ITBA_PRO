import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import GroupDetailClient from "./group-detail-client";
import type { GroupListItem, GroupMemberItem, NoteItem, ActivityLogItem } from "@/app/dashboard/management-types";

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: group }, { data: members }, { data: notes }, { data: activity }] = await Promise.all([
    supabase
      .from("groups")
      .select("id, name, type, description, status, created_at, group_members(count)")
      .eq("id", id)
      .single(),
    supabase
      .from("group_members")
      .select("id, person_id, added_at, persons(id, full_name, email, type, department)")
      .eq("group_id", id)
      .order("added_at", { ascending: false }),
    supabase
      .from("notes")
      .select("*")
      .eq("entity_type", "group")
      .eq("entity_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("activity_logs")
      .select("*")
      .eq("entity_type", "group")
      .eq("entity_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!group) notFound();

  return (
    <GroupDetailClient
      group={group as GroupListItem}
      members={(members ?? []) as unknown as GroupMemberItem[]}
      notes={(notes ?? []) as NoteItem[]}
      activityLogs={(activity ?? []) as ActivityLogItem[]}
    />
  );
}
