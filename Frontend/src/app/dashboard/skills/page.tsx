import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SkillsListClient from "./skills-list-client";
import type { SkillListItem } from "@/app/dashboard/management-types";

export interface SkillCategory {
  id: string;
  name: string;
  display_order: number;
}

export interface SkillKpis {
  totalSkills: number;
  mostDemandedSkill: string;
  unmappedCount: number;
  shortageCount: number;
}

export default async function SkillsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("auth_id", user.id)
    .single();

  const isAdmin = userData?.role === "admin" || userData?.role === "super_admin";

  const [{ data: rawSkills }, { data: categories }] = await Promise.all([
    supabase
      .from("skills")
      .select(`
        id, name, category, description, created_at,
        position_skill_requirements(count),
        person_skills(count)
      `)
      .order("name", { ascending: true }),
    supabase
      .from("skill_categories")
      .select("id, name, display_order")
      .order("display_order", { ascending: true }),
  ]);

  const skills: SkillListItem[] = (rawSkills ?? []).map((s) => {
    const posArr = s.position_skill_requirements;
    const perArr = s.person_skills;
    const position_count = Array.isArray(posArr) ? (posArr[0]?.count ?? 0) : ((posArr as { count: number } | null)?.count ?? 0);
    const person_count = Array.isArray(perArr) ? (perArr[0]?.count ?? 0) : ((perArr as { count: number } | null)?.count ?? 0);
    const shortage_score = Math.max(0, position_count - person_count);
    return {
      id: s.id,
      name: s.name,
      category: s.category,
      description: s.description,
      created_at: s.created_at,
      position_count,
      person_count,
      demand_score: position_count,
      shortage_score,
    };
  });

  const mostDemanded = [...skills].sort((a, b) => b.position_count - a.position_count)[0];

  const kpis: SkillKpis = {
    totalSkills: skills.length,
    mostDemandedSkill: mostDemanded?.name ?? "—",
    unmappedCount: skills.filter((s) => s.position_count === 0).length,
    shortageCount: skills.filter((s) => s.shortage_score > 2).length,
  };

  return (
    <SkillsListClient
      skills={skills}
      categories={(categories ?? []) as SkillCategory[]}
      isAdmin={isAdmin}
      kpis={kpis}
    />
  );
}
