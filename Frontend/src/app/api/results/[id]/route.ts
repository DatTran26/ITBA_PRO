import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_NOTE_LENGTH = 5000;
const VALID_STATUSES = ["pass", "fail"];
const VALID_RECOMMENDATIONS = ["Recommend", "Consider", "Not Recommend"];

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const updateFields: Record<string, unknown> = {};

        // Handle note field
        if ("note" in body) {
            if (typeof body.note !== "string") {
                return NextResponse.json({ error: "Invalid note value" }, { status: 400 });
            }
            if (body.note.length > MAX_NOTE_LENGTH) {
                return NextResponse.json({ error: `Note exceeds ${MAX_NOTE_LENGTH} characters` }, { status: 400 });
            }
            updateFields.note = body.note;
        }

        // Handle status field
        if ("status" in body) {
            if (!VALID_STATUSES.includes(body.status)) {
                return NextResponse.json({ error: "Status must be 'pass' or 'fail'" }, { status: 400 });
            }
            updateFields.status = body.status;
        }

        // Handle ai_analysis field — whitelist allowed fields only
        if ("ai_analysis" in body) {
            const raw = body.ai_analysis;
            if (typeof raw !== "object" || raw === null) {
                return NextResponse.json({ error: "Invalid ai_analysis value" }, { status: 400 });
            }
            if (raw.recommendation && !VALID_RECOMMENDATIONS.includes(raw.recommendation)) {
                return NextResponse.json({ error: "Invalid recommendation value" }, { status: 400 });
            }
            const sanitized: Record<string, unknown> = {};
            if (typeof raw.overall_assessment === "string") sanitized.overall_assessment = raw.overall_assessment.slice(0, 2000);
            if (Array.isArray(raw.strengths)) sanitized.strengths = raw.strengths.filter((s: unknown) => typeof s === "string").map((s: string) => s.slice(0, 500));
            if (Array.isArray(raw.weaknesses)) sanitized.weaknesses = raw.weaknesses.filter((w: unknown) => typeof w === "string").map((w: string) => w.slice(0, 500));
            if (typeof raw.recommendation === "string") sanitized.recommendation = raw.recommendation;
            if (typeof raw.detail_note === "string") sanitized.detail_note = raw.detail_note.slice(0, 2000);
            updateFields.ai_analysis = sanitized;
        }

        if (Object.keys(updateFields).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("results")
            .update(updateFields)
            .eq("id", id)
            .select("note, status, ai_analysis, test_id")
            .single();

        if (error) return NextResponse.json({ error: "Failed to save" }, { status: 500 });

        const { revalidatePath } = await import("next/cache");
        revalidatePath(`/dashboard/tests/${data.test_id}`);
        revalidatePath(`/dashboard/results/${id}`);

        return NextResponse.json({ success: true, note: data.note, status: data.status, ai_analysis: data.ai_analysis });
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: result, error } = await supabase
        .from("results")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });

    // Get test details
    const { data: test } = await supabase
        .from("tests")
        .select("*, questions(*)")
        .eq("id", result.test_id)
        .single();

    return NextResponse.json({ result, test });
}
