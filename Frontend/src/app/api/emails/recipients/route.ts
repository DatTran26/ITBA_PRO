import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOfferEligiblePersonIds, getOnboardEligiblePersonIds } from "@/lib/recruitment/eligibility-queries";

const PASS_SCORE = 70;

async function getPassingPersonIds(admin: ReturnType<typeof createAdminClient>): Promise<string[]> {
    const { data: screenings } = await admin
        .from("candidate_screenings")
        .select("job_application_id, final_score, ai_score");
    if (!screenings?.length) return [];

    const passingAppIds = [
        ...new Set(
            screenings
                .filter((s) => (s.final_score ?? s.ai_score ?? 0) >= PASS_SCORE)
                .map((s) => s.job_application_id as string)
        ),
    ];
    if (!passingAppIds.length) return [];

    const { data: apps } = await admin
        .from("job_applications")
        .select("person_id")
        .in("id", passingAppIds);

    return [...new Set((apps ?? []).map((a) => a.person_id as string))];
}

export async function GET(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userData } = await supabase
        .from("users").select("role").eq("auth_id", user.id).single();
    const allowed = ["admin", "super_admin", "hr", "interviewer", "recruiter"];
    if (!userData || !allowed.includes(userData.role))
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "";
    const gate = searchParams.get("gate") ?? "";
    const q = (searchParams.get("q") ?? "").trim();

    const admin = createAdminClient();

    // Empty query: return default suggestions
    if (!q) {
        if (type === "interview_reminder") {
            const { data } = await admin.from("users")
                .select("id, name, email")
                .eq("role", "interviewer")
                .limit(20);
            return NextResponse.json((data ?? []).map((u) => ({ ...u, source: "users" })));
        }
        // Default: candidates with passing CV score
        const personIds = await getPassingPersonIds(admin);
        if (!personIds.length) return NextResponse.json([]);
        const { data } = await admin.from("persons")
            .select("id, full_name, email")
            .in("id", personIds)
            .limit(20);
        return NextResponse.json((data ?? []).map((p) => ({ id: p.id, name: p.full_name, email: p.email, source: "persons" })));
    }

    if (q.length < 2) return NextResponse.json([]);

    if (type === "interview_reminder") {
        const { data } = await admin.from("users")
            .select("id, name, email")
            .eq("role", "interviewer")
            .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
            .limit(10);
        return NextResponse.json((data ?? []).map((u) => ({ ...u, source: "users" })));
    }

    // Resolve eligible person IDs when a gate is active
    let eligibleIds: string[] | null = null;
    if (gate === "offer") {
        eligibleIds = await getOfferEligiblePersonIds(supabase, q);
        if (eligibleIds.length === 0) return NextResponse.json([]);
    } else if (gate === "onboard_confirm") {
        eligibleIds = await getOnboardEligiblePersonIds(supabase, q);
        if (eligibleIds.length === 0) return NextResponse.json([]);
    }

    const baseQuery = admin.from("persons")
        .select("id, full_name, email")
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(10);

    const { data } = eligibleIds !== null
        ? await baseQuery.in("id", eligibleIds)
        : await baseQuery;

    return NextResponse.json((data ?? []).map((p) => ({ id: p.id, name: p.full_name, email: p.email, source: "persons" })));
}
