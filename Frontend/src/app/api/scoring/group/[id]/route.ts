import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import {
  calculateMatchScore,
  calculateHealthScore,
  type PersonSkill,
  type PositionRequirement,
} from "@/lib/crm/scoring";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase } = ctx;

  try {
    // Fetch group members with their person data (including position assignment)
    const { data: membersRaw, error: membersError } = await supabase
      .from("group_members")
      .select("persons(id, full_name, email, position_id)")
      .eq("group_id", groupId);

    if (membersError) {
      return NextResponse.json({ error: "Failed to fetch group members" }, { status: 500 });
    }

    type PersonRow = { id: string; full_name: string; email: string; position_id: string | null };
    const members = (membersRaw ?? [])
      .map((m) => {
        const p = m.persons;
        // Supabase may return a single object or array depending on relation type
        return (Array.isArray(p) ? p[0] : p) as PersonRow | null;
      })
      .filter((p): p is PersonRow => p !== null && p !== undefined);

    const memberCount = members.length;

    if (memberCount === 0) {
      return NextResponse.json({
        health_score: null,
        role_coverage: null,
        skill_coverage: null,
        assessment_rate: null,
        member_count: 0,
      });
    }

    // --- Role coverage: members with an assigned position ---
    const membersWithPosition = members.filter((m) => m.position_id !== null);
    const roleCoverage = Math.round((membersWithPosition.length / memberCount) * 100);

    // --- Skill coverage: average match score for members who have a position ---
    let skillCoverage: number | null = null;

    if (membersWithPosition.length > 0) {
      const memberIds = membersWithPosition.map((m) => m.id);

      // Fetch all skills for members with positions
      const { data: allSkillsRaw } = await supabase
        .from("person_skills")
        .select("person_id, skill_id, current_level")
        .in("person_id", memberIds);

      // Group skills by person
      const skillsByPerson = new Map<string, PersonSkill[]>();
      for (const row of allSkillsRaw ?? []) {
        const list = skillsByPerson.get(row.person_id) ?? [];
        list.push({ skill_id: row.skill_id, current_level: row.current_level });
        skillsByPerson.set(row.person_id, list);
      }

      // Fetch unique position requirements for all positions held by these members
      const positionIds = [...new Set(membersWithPosition.map((m) => m.position_id as string))];
      const { data: allReqsRaw } = await supabase
        .from("position_skill_requirements")
        .select("position_id, skill_id, required_level, is_mandatory")
        .in("position_id", positionIds);

      // Group requirements by position_id
      const reqsByPosition = new Map<string, PositionRequirement[]>();
      for (const row of allReqsRaw ?? []) {
        const list = reqsByPosition.get(row.position_id) ?? [];
        list.push({
          skill_id: row.skill_id,
          required_level: row.required_level,
          is_mandatory: row.is_mandatory,
        });
        reqsByPosition.set(row.position_id, list);
      }

      // Compute match score per member
      const matchScores = membersWithPosition.map((member) => {
        const personSkills = skillsByPerson.get(member.id) ?? [];
        const requirements = reqsByPosition.get(member.position_id as string) ?? [];
        return calculateMatchScore(personSkills, requirements);
      });

      const validScores = matchScores.filter((s): s is number => s !== null);
      if (validScores.length > 0) {
        skillCoverage = Math.round(
          validScores.reduce((acc, s) => acc + s, 0) / validScores.length
        );
      }
    }

    // --- Assessment rate: members who have at least 1 result entry ---
    // Proxy: query results table via candidate_email matching person emails.
    // NOTE: This is a simplified proxy. For a full implementation, a dedicated
    //       person_assessments table would provide more accurate tracking.
    let assessmentRate = 0;
    try {
      const memberEmails = members.map((m) => m.email).filter(Boolean);
      if (memberEmails.length > 0) {
        const { data: resultRows } = await supabase
          .from("results")
          .select("candidate_email")
          .in("candidate_email", memberEmails);

        if (resultRows && resultRows.length > 0) {
          const completedEmails = new Set(resultRows.map((r) => r.candidate_email));
          assessmentRate = Math.round((completedEmails.size / memberCount) * 100);
        }
      }
    } catch {
      // Assessment proxy query failed — return 0 as placeholder
      assessmentRate = 0;
    }

    const healthScore = calculateHealthScore({
      roleCoverage,
      skillCoverage,
      assessmentRate,
    });

    return NextResponse.json({
      health_score: healthScore,
      role_coverage: roleCoverage,
      skill_coverage: skillCoverage,
      assessment_rate: assessmentRate,
      member_count: memberCount,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
