export const runtime = "nodejs";

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import type { BankQuestion } from "@/components/question-bank/question-bank-types";

// GET: List tests for authenticated user
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

    if (!userData) {
        const { data: newUser, error: createError } = await supabase
            .from("users")
            .insert({
                auth_id: user.id,
                email: user.email,
                name: user.user_metadata?.name || user.email?.split("@")[0] || "Recruiter",
                role: "recruiter"
            })
            .select("id")
            .single();

        if (createError) return NextResponse.json({ error: "Failed to create user record" }, { status: 500 });
        userData = newUser;
    }

    const { data: tests, error } = await supabase
        .from("tests")
        .select("*, results(count), questions(count)")
        .eq("recruiter_id", userData.id)
        .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tests });
}

// POST: Create new test + AI generate questions
const TEST_CREATE_ROLES = ["recruiter", "interviewer", "hr", "admin", "super_admin"];

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let { data: userData } = await supabase
        .from("users")
        .select("id, role")
        .eq("auth_id", user.id)
        .single();

    if (!userData) {
        const { data: newUser, error: createError } = await supabase
            .from("users")
            .insert({
                auth_id: user.id,
                email: user.email,
                name: user.user_metadata?.name || user.email?.split("@")[0] || "Recruiter",
                role: "recruiter"
            })
            .select("id, role")
            .single();

        if (createError) return NextResponse.json({ error: "Failed to create user record" }, { status: 500 });
        userData = newUser;
    }

    if (!TEST_CREATE_ROLES.includes(userData?.role ?? "")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, job_role, level, job_description, test_description, question_count = 10, time_limit_minutes = 15, max_participants = null, start_time = null, expires_at = null, target_type = 'candidate', position_id = null, group_id = null, bank_questions = null } = body as {
      title?: string; job_role?: string; level?: string; job_description?: string; test_description?: string;
      question_count?: number; time_limit_minutes?: number; max_participants?: number | null;
      start_time?: string | null; expires_at?: string | null; target_type?: string;
      position_id?: string | null; group_id?: string | null; bank_questions?: BankQuestion[] | null;
    };

    // Enforce target_type per role
    const creatorRole = userData?.role ?? "";
    if (creatorRole === "interviewer" && target_type !== "candidate") {
      return NextResponse.json(
        { error: "Interviewers can only create candidate assessments" },
        { status: 403 }
      );
    }
    if (creatorRole === "recruiter" && target_type !== "employee") {
      return NextResponse.json(
        { error: "Recruiters can only create employee assessments" },
        { status: 403 }
      );
    }

    // Bank-source tests (typically internal/employee) do not require recruiter to set
    // job_role/level — the bank itself supplies them. Default sensibly.
    const isBankSource = Array.isArray(bank_questions) && bank_questions.length > 0;
    if (!isBankSource && (!job_role || !level)) {
        return NextResponse.json({ error: "job_role and level are required" }, { status: 400 });
    }
    const effectiveJobRole = job_role || (isBankSource ? "Question Bank" : null);
    const effectiveLevel = level || (isBankSource ? (bank_questions?.[0]?.level ?? "junior") : null);

    const shareToken = uuidv4().replace(/-/g, "").substring(0, 12);

    // Create test
    const { data: test, error: testError } = await supabase
        .from("tests")
        .insert({
            recruiter_id: userData.id,
            title,
            job_role: effectiveJobRole,
            level: effectiveLevel,
            job_description,
            test_description,
            share_token: shareToken,
            status: "active",
            question_count,
            time_limit_minutes,
            max_participants,
            start_time,
            expires_at,
            target_type,
            position_id,
            group_id,
        })
        .select()
        .single();

    if (testError) return NextResponse.json({ error: testError.message }, { status: 500 });

    if (bank_questions && bank_questions.length > 0) {
        // Insert bank questions directly, skipping AI generation
        const CORRECT_ANSWER_KEYS = ["a", "b", "c", "d"] as const;
        const questionRecords = bank_questions.map((q, idx) => ({
            test_id: test.id,
            question_text: q.question_text,
            options: [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean),
            correct_answer: q.correct_answer ? CORRECT_ANSWER_KEYS.indexOf(q.correct_answer as typeof CORRECT_ANSWER_KEYS[number]) : -1,
            question_type: q.question_type ?? "single_choice",
            answer_payload: q.answer_payload ?? {},
            metadata: q.metadata ?? {},
            grading_mode: q.grading_mode ?? "auto",
            topic: q.topic_tag ?? "General",
            difficulty: q.level,
            explanation: q.explanation ?? "",
            order_num: idx + 1,
        }));
        const { error: qError } = await supabase.from("questions").insert(questionRecords);
        if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
    } else {
        // Generate questions using AI
        try {
            const aiResponse = await fetch(
                `http://localhost:3000/api/ai/generate`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(request.headers.get("cookie") ? { "cookie": request.headers.get("cookie")! } : {})
                    },
                    body: JSON.stringify({ job_role, level, test_id: test.id, job_description, test_description, question_count, position_id }),
                }
            );

            if (!aiResponse.ok) {
                const errorText = await aiResponse.text();
                console.error(`AI generation sub-request failed [${aiResponse.status}]:`, errorText);
            } else {
                const result = await aiResponse.json();
                console.log(`AI generation successful: ${result.count} questions created for test ${test.id}`);
            }
        } catch (err) {
            console.error("Critical AI generation error:", err);
        }
    }

    // Get created test with questions
    const { data: fullTest } = await supabase
        .from("tests")
        .select("*, questions(*)")
        .eq("id", test.id)
        .single();

    return NextResponse.json({ test: fullTest }, { status: 201 });
}

// PATCH: Bulk update status for multiple tests
export async function PATCH(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { ids, status } = body;

    if (!Array.isArray(ids) || ids.length === 0 || !status) {
        return NextResponse.json({ error: "ids (array) and status are required" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("tests")
        .update({ status })
        .in("id", ids)
        .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ count: data?.length || 0, data });
}

// DELETE: Bulk delete multiple tests
export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "ids (array) is required" }, { status: 400 });
    }

    const { error } = await supabase
        .from("tests")
        .delete()
        .in("id", ids);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, count: ids.length });
}
