import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import {
  calculateMatchScore,
  getMissingSkills,
  getGapDetails,
  type PersonSkill,
  type PositionRequirement,
} from "@/lib/crm/scoring";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: personId } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase } = ctx;

  try {
    // Fetch the person's current position assignment
    const { data: person, error: personError } = await supabase
      .from("persons")
      .select("id, position_id")
      .eq("id", personId)
      .single();

    if (personError || !person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    if (!person.position_id) {
      return NextResponse.json({
        match_score: null,
        reason: "no_position_assigned",
      });
    }

    // Fetch person's skills
    const { data: personSkillsRaw, error: skillsError } = await supabase
      .from("person_skills")
      .select("skill_id, current_level")
      .eq("person_id", personId);

    if (skillsError) {
      return NextResponse.json({ error: "Failed to fetch person skills" }, { status: 500 });
    }

    // Fetch position requirements
    const { data: requirementsRaw, error: reqError } = await supabase
      .from("position_skill_requirements")
      .select("skill_id, required_level, is_mandatory")
      .eq("position_id", person.position_id);

    if (reqError) {
      return NextResponse.json({ error: "Failed to fetch position requirements" }, { status: 500 });
    }

    const personSkills: PersonSkill[] = personSkillsRaw ?? [];
    const positionRequirements: PositionRequirement[] = requirementsRaw ?? [];

    const match_score = calculateMatchScore(personSkills, positionRequirements);
    const missing_skills = getMissingSkills(personSkills, positionRequirements);
    const gap_details = getGapDetails(personSkills, positionRequirements);

    return NextResponse.json({ match_score, missing_skills, gap_details });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
