/** Input: a skill possessed by a person with their current proficiency level */
export interface PersonSkill {
  skill_id: string;
  current_level: number;
}

/** Input: a skill required by a position with the minimum level and priority flag */
export interface PositionRequirement {
  skill_id: string;
  required_level: number;
  is_mandatory: boolean;
}

/** Detail of a single skill gap for a person vs. a position requirement */
export interface GapDetail {
  skill_id: string;
  current: number;
  required: number;
  is_mandatory: boolean;
}

/**
 * Calculate an overall match score (0–100) for a person against a position.
 *
 * Algorithm:
 * - No requirements → 100 (position has no skill bar)
 * - No personSkills   → 0  (person has no skills at all)
 * - Mandatory skills carry weight 2; optional skills carry weight 1.
 * - Per skill: skill_score = min(current_level / required_level, 1.0); missing = 0.
 * - Missing mandatory skills incur a -20 penalty each, capped at -40 total.
 * - base  = (weighted_sum / total_weight) * 100
 * - final = Math.round(max(0, base - missing_mandatory_penalty))
 *
 * @returns Integer 0-100, or null when positionRequirements is empty.
 */
export function calculateMatchScore(
  personSkills: PersonSkill[],
  positionRequirements: PositionRequirement[]
): number | null {
  if (positionRequirements.length === 0) return 100;
  if (personSkills.length === 0) return 0;

  const skillMap = new Map<string, number>(
    personSkills.map((ps) => [ps.skill_id, ps.current_level])
  );

  let weightedSum = 0;
  let totalWeight = 0;
  let missingMandatoryCount = 0;

  for (const req of positionRequirements) {
    const weight = req.is_mandatory ? 2 : 1;
    totalWeight += weight;

    const currentLevel = skillMap.get(req.skill_id);
    if (currentLevel !== undefined) {
      const skillScore = Math.min(currentLevel / req.required_level, 1.0);
      weightedSum += skillScore * weight;
    } else {
      // Missing skill contributes 0 to weighted sum
      if (req.is_mandatory) missingMandatoryCount++;
    }
  }

  const penalty = Math.min(missingMandatoryCount * 20, 40);
  const base = (weightedSum / totalWeight) * 100;
  return Math.round(Math.max(0, base - penalty));
}

/**
 * Returns the subset of positionRequirements that the person is missing entirely
 * (i.e. they have no person_skill entry for that skill_id).
 */
export function getMissingSkills(
  personSkills: PersonSkill[],
  positionRequirements: PositionRequirement[]
): PositionRequirement[] {
  const ownedIds = new Set(personSkills.map((ps) => ps.skill_id));
  return positionRequirements.filter((req) => !ownedIds.has(req.skill_id));
}

/**
 * Returns full gap details for every requirement, including skills the person
 * has but at an insufficient level (current < required).
 * Skills where current >= required are included with current level for completeness.
 */
export function getGapDetails(
  personSkills: PersonSkill[],
  positionRequirements: PositionRequirement[]
): GapDetail[] {
  const skillMap = new Map<string, number>(
    personSkills.map((ps) => [ps.skill_id, ps.current_level])
  );

  return positionRequirements.map((req) => ({
    skill_id: req.skill_id,
    current: skillMap.get(req.skill_id) ?? 0,
    required: req.required_level,
    is_mandatory: req.is_mandatory,
  }));
}
