/**
 * Calculate the readiness score for a position as the arithmetic mean of
 * all non-null match scores from assigned persons.
 *
 * A null match score means the person's score could not be computed (e.g. no
 * requirements existed), so those are excluded from the average.
 *
 * @param matchScores - Array of per-person match scores (0–100 or null)
 * @returns Integer 0-100 representing average readiness, or null if there are
 *          no valid (non-null) scores to average.
 */
export function calculateReadinessScore(
  matchScores: (number | null)[]
): number | null {
  const valid = matchScores.filter((s): s is number => s !== null);
  if (valid.length === 0) return null;

  const sum = valid.reduce((acc, s) => acc + s, 0);
  return Math.round(sum / valid.length);
}
