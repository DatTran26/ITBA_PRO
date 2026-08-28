import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

type QuestionRow = {
    id: string;
    question_text: string;
    options: string[];
    topic: string;
    difficulty: string;
    order_num: number;
    question_type?: string;
    grading_mode?: "auto" | "manual" | null;
};

function availabilityFor(test: {
    status: string;
    start_time: string | null;
    expires_at: string | null;
    max_participants: number | null;
    participantCount: number;
}): "ok" | "completed" | "not_started" | "expired" | "full" {
    if (test.status === "completed") return "completed";
    if (test.start_time && new Date() < new Date(test.start_time)) return "not_started";
    if (test.expires_at && new Date() > new Date(test.expires_at)) return "expired";
    if (test.max_participants && test.participantCount >= test.max_participants) return "full";
    return "ok";
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params;
    if (!token || token.length < 8 || token.length > 64) {
        return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: test, error } = await admin
        .from("tests")
        .select("id, title, job_role, level, status, time_limit_minutes, start_time, expires_at, max_participants, share_token, questions(id, question_text, options, topic, difficulty, order_num, question_type, grading_mode)")
        .eq("share_token", token)
        .maybeSingle();

    if (error || !test) {
        return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const { count: participantCount } = await admin
        .from("results")
        .select("*", { count: "exact", head: true })
        .eq("test_id", test.id);

    const questions = ((test.questions ?? []) as QuestionRow[])
        .slice()
        .sort((a, b) => (a.order_num ?? 0) - (b.order_num ?? 0));

    const availability = availabilityFor({
        status: test.status,
        start_time: test.start_time,
        expires_at: test.expires_at,
        max_participants: test.max_participants,
        participantCount: participantCount ?? 0,
    });

    return NextResponse.json({
        test: {
            id: test.id,
            title: test.title,
            job_role: test.job_role,
            level: test.level,
            status: test.status,
            time_limit_minutes: test.time_limit_minutes,
            start_time: test.start_time,
            expires_at: test.expires_at,
            max_participants: test.max_participants,
            share_token: test.share_token,
            questions,
        },
        participantCount: participantCount ?? 0,
        availability,
    });
}
