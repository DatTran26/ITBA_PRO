import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GroupsListClient from "./groups-list-client";
import type { GroupListItem, GroupKpis } from "@/app/dashboard/management-types";

export type { GroupKpis };

function getMemberCount(g: GroupListItem): number {
  const m = g.group_members;
  if (Array.isArray(m)) return m[0]?.count ?? 0;
  return (m as { count: number })?.count ?? 0;
}

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("groups")
    .select("id, name, type, description, status, created_at, group_members(count), people:group_members(persons(full_name))")
    .order("created_at", { ascending: false });

  type Row = GroupListItem & { people?: { persons: { full_name: string } | null }[] };
  const groups: GroupListItem[] = ((data ?? []) as unknown as Row[]).map(({ people, ...g }) => ({
    ...g,
    member_names: (people ?? []).map((p) => p.persons?.full_name).filter((n): n is string => !!n),
  }));

  const kpis: GroupKpis = {
    totalGroups: groups.length,
    totalMembers: groups.reduce((sum, g) => sum + getMemberCount(g), 0),
    activeGroups: groups.filter((g) => g.status !== "inactive").length,
    atRiskGroups: groups.filter((g) =>
      g.status === "understaffed" || g.status === "skill_risk" || g.status === "needs_attention"
    ).length,
  };

  return <GroupsListClient groups={groups} kpis={kpis} />;
}
