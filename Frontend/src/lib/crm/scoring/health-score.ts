/**
 * Inputs required to compute a group's health score.
 * Each metric is 0–100 or null when it cannot be determined (e.g. zero members).
 */
export interface HealthScoreInputs {
  /** % of members who have an assigned position */
  roleCoverage: number | null;
  /** Average match score across members who have an assigned position */
  skillCoverage: number | null;
  /** % of members who have completed at least one assessment */
  assessmentRate: number | null;
}

/** Contribution weights — must sum to 1.0 */
const WEIGHTS = {
  role: 0.3,
  skill: 0.4,
  assessment: 0.3,
} as const;

/**
 * Calculate an overall health score (0–100) for a group using a weighted average
 * of three coverage metrics.
 *
 * Weights: role coverage 30%, skill coverage 40%, assessment rate 30%.
 *
 * Null inputs are excluded from the calculation and their combined weight is
 * redistributed proportionally among the non-null inputs, so a partial score
 * is still produced when some metrics are unavailable.
 *
 * @returns Integer 0–100, or null if all inputs are null (no members).
 */
export function calculateHealthScore(inputs: HealthScoreInputs): number | null {
  const metrics: { value: number | null; weight: number }[] = [
    { value: inputs.roleCoverage, weight: WEIGHTS.role },
    { value: inputs.skillCoverage, weight: WEIGHTS.skill },
    { value: inputs.assessmentRate, weight: WEIGHTS.assessment },
  ];

  const available = metrics.filter((m): m is { value: number; weight: number } =>
    m.value !== null
  );

  if (available.length === 0) return null;

  const totalWeight = available.reduce((acc, m) => acc + m.weight, 0);
  const weightedSum = available.reduce((acc, m) => acc + m.value * m.weight, 0);

  return Math.round(weightedSum / totalWeight);
}
