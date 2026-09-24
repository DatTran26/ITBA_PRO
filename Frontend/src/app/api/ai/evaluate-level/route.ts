import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { completeChat } from "@/lib/ai-complete";
import { getAiConfig } from "@/lib/get-ai-config";

export const maxDuration = 120;

type LevelSuggestion = {
  suggested_level: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  skill_gaps: string[];
  warnings: string[];
};

function ruleBasedSuggestion(scorePercent: number, positionLevel: string): LevelSuggestion {
  const warnings: string[] = [];
  let suggested_level: string;
  let confidence: "high" | "medium" | "low" = "medium";

  if (scorePercent >= 80) {
    suggested_level = positionLevel || "senior";
    confidence = "high";
  } else if (scorePercent >= 60) {
    suggested_level = "middle";
  } else {
    suggested_level = "needs_improvement";
    confidence = "low";
  }

  if (suggested_level.toLowerCase().includes("senior")) {
    warnings.push("Senior level requires 100% of mandatory skills. Manual checklist review required.");
  }

  return {
    suggested_level,
    confidence,
    reasoning: `Rule-based: score ${scorePercent.toFixed(1)}% (AI unavailable)`,
    skill_gaps: [],
    warnings,
  };
}

export async function POST(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin } = ctx;

  try {
    const body = await request.json();
    const { result_id, position_id } = body;

    if (!result_id || !position_id) {
      return NextResponse.json({ error: "result_id and position_id are required" }, { status: 400 });
    }

    // Verify result ownership
    const { data: result, error: resultErr } = await supabase
      .from("results")
      .select("id, score, test_id, ai_analysis, tests(recruiter_id, question_count)")
      .eq("id", result_id)
      .single();

    if (resultErr || !result) return NextResponse.json({ error: "Result not found" }, { status: 404 });
    const testsData = result.tests as unknown as { recruiter_id: string; question_count: number } | null;
    const recruiterId = testsData?.recruiter_id;
    if (!isAdmin && recruiterId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Fetch position with skill requirements
    const { data: position, error: posErr } = await supabase
      .from("positions")
      .select("id, title, target_level, position_skill_requirements(*, skills(name, category))")
      .eq("id", position_id)
      .single();

    if (posErr || !position) return NextResponse.json({ error: "Position not found" }, { status: 404 });

    // Fetch existing skill evaluations
    const { data: evaluations } = await supabase
      .from("skill_evaluations")
      .select("skill_id, score, status, skills(name)")
      .eq("result_id", result_id);

    const totalQuestions = (result.tests as unknown as { question_count: number } | null)?.question_count ?? 10;
    const scorePercent = ((result.score ?? 0) / totalQuestions) * 100;

    const { apiKey } = await getAiConfig();

    if (!apiKey) {
      return NextResponse.json(ruleBasedSuggestion(scorePercent, position.target_level ?? ""));
    }

    const requirementsSummary = (position.position_skill_requirements as unknown as Array<{
      skills: { name: string; category: string } | null;
      required_level: number;
      is_mandatory: boolean;
    }>).map((r) => ({
      skill: r.skills?.name ?? "Unknown",
      category: r.skills?.category ?? "",
      required_level: r.required_level,
      is_mandatory: r.is_mandatory,
    }));

    const evaluationsSummary = (evaluations ?? []).map((e) => ({
      skill: (e.skills as unknown as { name: string } | null)?.name ?? "Unknown",
      score: e.score,
      status: e.status,
    }));

    const prompt = `You are a talent assessment AI. Based on the following data, suggest the appropriate level for the candidate.

Position: ${position.title}
Target Level: ${position.target_level ?? "Not specified"}
Test Score: ${result.score ?? 0} / ${totalQuestions} (${scorePercent.toFixed(1)}%)
AI Analysis Summary: ${JSON.stringify(result.ai_analysis ?? {})}

Required Skills for Position:
${JSON.stringify(requirementsSummary, null, 2)}

Skill Evaluations Completed:
${JSON.stringify(evaluationsSummary, null, 2)}

BUSINESS RULE: If you suggest a "senior" level, you MUST verify all mandatory skills are met. If not, add a warning.

Respond with JSON only:
{
  "suggested_level": "junior|middle|senior|needs_improvement",
  "confidence": "high|medium|low",
  "reasoning": "Brief explanation",
  "skill_gaps": ["list of missing or weak skills"],
  "warnings": ["any important caveats, especially for senior"]
}`;

    const response = await completeChat({
      messages: [{ role: "user", content: prompt }],
      json: true,
      maxTokens: 1600,
      temperature: 0.3,
      feature: "evaluate-level",
      userId: ctx.userId,
    });

    const raw = JSON.parse(response.content || "{}") as LevelSuggestion;

    // BR-03: senior warning enforcement
    if (raw.suggested_level?.toLowerCase().includes("senior")) {
      const mandatorySkills = requirementsSummary.filter((r) => r.is_mandatory);
      const passedSkillNames = new Set(
        evaluationsSummary.filter((e) => e.status === "pass").map((e) => e.skill)
      );
      const unmetMandatory = mandatorySkills.filter((s) => !passedSkillNames.has(s.skill));
      if (unmetMandatory.length > 0) {
        raw.warnings = raw.warnings ?? [];
        raw.warnings.push(
          `Senior level requires all mandatory skills: ${unmetMandatory.map((s) => s.skill).join(", ")} not yet confirmed as passed.`
        );
      }
    }

    return NextResponse.json(raw);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
