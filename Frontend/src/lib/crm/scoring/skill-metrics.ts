/** A single person's proficiency for a specific skill */
export interface PersonSkillEntry {
  person_id: string;
  current_level: number;
}

/**
 * Returns the raw demand count for a skill — simply the number of
 * position_skill_requirements rows that reference this skill.
 *
 * @param requirementCount - Total rows in position_skill_requirements for the skill
 */
export function calculateSkillDemand(requirementCount: number): number {
  return requirementCount;
}

/**
 * Count how many assigned persons lack the skill at the required level.
 *
 * A person "has" the skill if their current_level >= requiredLevel.
 * Persons not in personSkillsForSkill at all also count as lacking it.
 *
 * @param personSkillsForSkill - Skills records for persons who DO have this skill
 * @param assignedPersonCount  - Total persons assigned to positions requiring this skill
 * @param requiredLevel        - Minimum level that satisfies the requirement
 * @returns Non-negative integer shortage count
 */
export function calculateSkillShortage(
  personSkillsForSkill: PersonSkillEntry[],
  assignedPersonCount: number,
  requiredLevel: number
): number {
  if (assignedPersonCount <= 0) return 0;

  const adequate = personSkillsForSkill.filter(
    (ps) => ps.current_level >= requiredLevel
  ).length;

  return Math.max(0, assignedPersonCount - adequate);
}

/**
 * Percentage of assigned persons who meet the required level for a skill.
 *
 * Returns 0 when assignedPersonCount is 0 to avoid division by zero.
 *
 * @param personSkillsForSkill - Skills records for persons who DO have this skill
 * @param assignedPersonCount  - Total persons assigned to positions requiring this skill
 * @param requiredLevel        - Minimum level that satisfies the requirement
 * @returns Integer 0–100
 */
export function calculateSkillCoverage(
  personSkillsForSkill: PersonSkillEntry[],
  assignedPersonCount: number,
  requiredLevel: number
): number {
  if (assignedPersonCount <= 0) return 0;

  const adequate = personSkillsForSkill.filter(
    (ps) => ps.current_level >= requiredLevel
  ).length;

  return Math.round(Math.min(adequate / assignedPersonCount, 1) * 100);
}
