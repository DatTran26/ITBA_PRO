import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import {
  calculateMatchScore,
  calculateReadinessScore,
  type PersonSkill,
  type PositionRequirement,
} from "@/lib/crm/scoring";

interface PersonScore {
  person_id: string;
  person_name: string;
  match_score: number | null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: positionId } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase } = ctx;

  try {
    // Fetch all persons assigned to this position
    const { data: persons, error: personsError } = await supabase
      .from("persons")
      .select("id, full_name")
      .eq("position_id", positionId);

    if (personsError) {
      return NextResponse.json({ error: "Failed to fetch persons" }, { status: 500 });
    }

    // Fetch position requirements once
    const { data: requirementsRaw, error: reqError } = await supabase
      .from("position_skill_requirements")
      .select("skill_id, required_level, is_mandatory")
      .eq("position_id", positionId);

    if (reqError) {
      return NextResponse.json({ error: "Failed to fetch position requirements" }, { status: 500 });
    }

    const positionRequirements: PositionRequirement[] = requirementsRaw ?? [];
    const personList = persons ?? [];

    // Fetch skills for all persons in one query, then group client-side
    const personIds = personList.map((p) => p.id);
    const { data: allSkillsRaw, error: skillsError } = personIds.length > 0
      ? await supabase
          .from("person_skills")
          .select("person_id, skill_id, current_level")
          .in("person_id", personIds)
      : { data: [], error: null };

    if (skillsError) {
      return NextResponse.json({ error: "Failed to fetch person skills" }, { status: 500 });
    }

    // Group skills by person_id
    const skillsByPerson = new Map<string, PersonSkill[]>();
    for (const row of allSkillsRaw ?? []) {
      const list = skillsByPerson.get(row.person_id) ?? [];
      list.push({ skill_id: row.skill_id, current_level: row.current_level });
      skillsByPerson.set(row.person_id, list);
    }

    // Compute per-person match scores
    const personScores: PersonScore[] = personList.map((person) => {
      const personSkills = skillsByPerson.get(person.id) ?? [];
      return {
        person_id: person.id,
        person_name: person.full_name,
        match_score: calculateMatchScore(personSkills, positionRequirements),
      };
    });

    const readiness_score = calculateReadinessScore(
      personScores.map((ps) => ps.match_score)
    );

    return NextResponse.json({
      readiness_score,
      person_count: personList.length,
      person_scores: personScores,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
