import { createAdminClient } from "@/lib/supabase/admin";

export type OfferEligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: string };

function extractRoundNumber(roundStr: string): number | null {
  const lower = roundStr.toLowerCase().trim();
  if (lower === "final") return 3;
  const m = lower.match(/round\s*(\d)/);
  if (m) return parseInt(m[1], 10);
  return null;
}

/**
 * Check if a candidate has passed all 3 interview rounds before being OFFERED.
 * Queries interview_schedules + interview_results for the given application.
 */
export async function checkOfferEligibility(
  jobApplicationId: string,
): Promise<OfferEligibilityResult> {
  const admin = createAdminClient();

  const { data: schedules, error } = await admin
    .from("interview_schedules")
    .select(`
      id, interview_round, status,
      interview_results(id, result)
    `)
    .eq("job_application_id", jobApplicationId)
    .eq("status", "completed");

  if (error) {
    return { eligible: false, reason: `Lỗi kiểm tra vòng phỏng vấn: ${error.message}` };
  }

  const passedRounds = new Set<number>();

  for (const schedule of schedules ?? []) {
    const results = (schedule.interview_results ?? []) as Array<{ id: string; result: string }>;
    const passed = results.some((r) => r.result === "pass");
    if (!passed) continue;

    const roundNum = extractRoundNumber(schedule.interview_round ?? "");
    if (roundNum !== null) passedRounds.add(roundNum);
  }

  const missingRounds: string[] = [];
  if (!passedRounds.has(1)) missingRounds.push("Round 1");
  if (!passedRounds.has(2)) missingRounds.push("Round 2");
  if (!passedRounds.has(3)) missingRounds.push("Round Final");

  if (missingRounds.length > 0) {
    return {
      eligible: false,
      reason: `Ứng viên chưa pass đủ tất cả vòng. Còn thiếu: ${missingRounds.join(", ")}`,
    };
  }

  return { eligible: true };
}
