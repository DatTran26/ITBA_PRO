import type { SupabaseClient } from "@supabase/supabase-js";

function extractRoundNumber(roundStr: string): number | null {
    const lower = roundStr.toLowerCase().trim();
    if (lower === "final") return 3;
    const m = lower.match(/round\s*(\d)/);
    if (m) return parseInt(m[1], 10);
    return null;
}

function firstRelation<T>(relation: T | T[] | null | undefined): T | null {
    if (Array.isArray(relation)) return relation[0] ?? null;
    return relation ?? null;
}

/**
 * Returns person_ids eligible for an offer email.
 * Eligible = has at least one job_application where all 3 interview rounds
 * have a completed schedule with a passing result.
 * Excludes candidates already OFFERED or ACCEPTED.
 */
export async function getOfferEligiblePersonIds(
    supabase: SupabaseClient,
    q?: string,
): Promise<string[]> {
    // Fetch all completed schedules with pass results, excluding already-offered apps
    const { data: schedules, error } = await supabase
        .from("interview_schedules")
        .select(`
            id, interview_round, job_application_id,
            interview_results(result),
            job_applications!inner(person_id, pipeline_status)
        `)
        .eq("status", "completed")
        .not("job_applications.pipeline_status", "in", '("OFFERED","ACCEPTED","ONBOARDED")');

    if (error || !schedules) return [];

    // Group by job_application_id → collect passed rounds
    const appPassedRounds = new Map<string, Set<number>>();
    const appPersonId = new Map<string, string>();

    for (const schedule of schedules) {
        const app = firstRelation(
            schedule.job_applications as
            | { person_id: string; pipeline_status: string }
            | Array<{ person_id: string; pipeline_status: string }>
            | null
        );
        if (!app) continue;

        const results = (schedule.interview_results ?? []) as Array<{ result: string }>;
        const passed = results.some((r) => r.result === "pass");
        if (!passed) continue;

        const roundNum = extractRoundNumber(schedule.interview_round ?? "");
        if (roundNum === null) continue;

        const appId = schedule.job_application_id as string;
        if (!appPassedRounds.has(appId)) appPassedRounds.set(appId, new Set());
        appPassedRounds.get(appId)!.add(roundNum);
        appPersonId.set(appId, app.person_id);
    }

    // Collect person_ids where app has passed rounds 1, 2, and 3 (or "final")
    const eligiblePersonIds = new Set<string>();
    for (const [appId, rounds] of appPassedRounds) {
        if (rounds.has(1) && rounds.has(2) && rounds.has(3)) {
            const personId = appPersonId.get(appId);
            if (personId) eligiblePersonIds.add(personId);
        }
    }

    if (eligiblePersonIds.size === 0) return [];

    const ids = [...eligiblePersonIds];

    if (!q || q.trim().length < 2) return ids;

    // Apply text search filter
    const { data: persons } = await supabase
        .from("persons")
        .select("id")
        .in("id", ids)
        .or(`full_name.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`);

    return (persons ?? []).map((p) => p.id);
}

/**
 * Returns person_ids eligible for an onboard-confirm email.
 * Eligible = has a job_application with pipeline_status = 'ACCEPTED'.
 * Excludes candidates already ONBOARDED.
 */
export async function getOnboardEligiblePersonIds(
    supabase: SupabaseClient,
    q?: string,
): Promise<string[]> {
    const { data: apps, error } = await supabase
        .from("job_applications")
        .select("person_id")
        .eq("pipeline_status", "ACCEPTED");

    if (error || !apps) return [];

    const ids = [...new Set(apps.map((a) => a.person_id as string))];
    if (ids.length === 0) return [];

    if (!q || q.trim().length < 2) return ids;

    // Apply text search filter
    const { data: persons } = await supabase
        .from("persons")
        .select("id")
        .in("id", ids)
        .or(`full_name.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`);

    return (persons ?? []).map((p) => p.id);
}
