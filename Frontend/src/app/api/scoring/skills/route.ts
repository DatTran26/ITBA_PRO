import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

interface SkillMetrics {
  id: string;
  name: string;
  demand: number;
  person_count: number;
  shortage: number;
  coverage: number;
}

export async function GET(_request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase } = ctx;

  try {
    // Fetch all skills
    const { data: skills, error: skillsError } = await supabase
      .from("skills")
      .select("id, name")
      .order("name", { ascending: true });

    if (skillsError) {
      return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 });
    }

    if (!skills || skills.length === 0) {
      return NextResponse.json({ skills: [] });
    }

    const skillIds = skills.map((s) => s.id);

    // Fetch demand counts (position_skill_requirements) per skill
    const { data: demandRaw, error: demandError } = await supabase
      .from("position_skill_requirements")
      .select("skill_id")
      .in("skill_id", skillIds);

    if (demandError) {
      return NextResponse.json({ error: "Failed to fetch skill demand" }, { status: 500 });
    }

    // Fetch supply counts (person_skills) per skill
    const { data: supplyRaw, error: supplyError } = await supabase
      .from("person_skills")
      .select("skill_id")
      .in("skill_id", skillIds);

    if (supplyError) {
      return NextResponse.json({ error: "Failed to fetch skill supply" }, { status: 500 });
    }

    // Aggregate counts client-side
    const demandBySkill = new Map<string, number>();
    for (const row of demandRaw ?? []) {
      demandBySkill.set(row.skill_id, (demandBySkill.get(row.skill_id) ?? 0) + 1);
    }

    const supplyBySkill = new Map<string, number>();
    for (const row of supplyRaw ?? []) {
      supplyBySkill.set(row.skill_id, (supplyBySkill.get(row.skill_id) ?? 0) + 1);
    }

    const result: SkillMetrics[] = skills.map((skill) => {
      const demand = demandBySkill.get(skill.id) ?? 0;
      const personCount = supplyBySkill.get(skill.id) ?? 0;
      const shortage = Math.max(0, demand - personCount);

      let coverage: number;
      if (demand === 0) {
        coverage = 100; // no demand → fully covered by definition
      } else if (personCount === 0) {
        coverage = 0;
      } else {
        coverage = Math.round(Math.min(personCount / demand, 1) * 100);
      }

      return {
        id: skill.id,
        name: skill.name,
        demand,
        person_count: personCount,
        shortage,
        coverage,
      };
    });

    return NextResponse.json({ skills: result });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
