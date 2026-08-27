import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// POST: Submit test results
export async function POST(request: Request) {
    const admin = createAdminClient();
    const body = await request.json();
    const { test_id, candidate_name, candidate_email, answers, time_taken } = body;

    if (!test_id || !candidate_name || !candidate_email || !answers) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get test and questions using admin client to ensure we see the status and questions correctly
    const { data: test } = await admin
        .from("tests")
        .select("*, questions(*)")
        .eq("id", test_id)
        .single();

    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });
    if (test.status === "completed") {
        return NextResponse.json({ error: "This test has already been completed." }, { status: 400 });
    }

    // Resolve or validation person record (service-role client bypasses RLS)
    let personId: string | null = null;

    // Strict lookup by EXACT name and email
    const { data: existingPerson } = await admin
        .from("persons")
        .select("id")
        .eq("email", candidate_email)
        .eq("full_name", candidate_name)
        .maybeSingle();

    if (existingPerson) {
        personId = existingPerson.id;
    } else {
        // If target type is employee and not found, reject
        if (test.target_type === 'employee') {
            return NextResponse.json({
                error: "Thông tin không chính xác hoặc bạn không có trong danh sách tham gia bài test này. Vui lòng liên hệ Admin."
            }, { status: 403 });
        }

        // For candidates, auto-create the person record
        const { data: newPerson, error: personError } = await admin
            .from("persons")
            .insert({
                full_name: candidate_name,
                email: candidate_email,
                type: 'candidate',
                position_id: test.position_id || null,
                created_by: test.recruiter_id,
            })
            .select("id")
            .single();

        if (personError) {
            console.error("Error creating person:", personError);
        }
        if (newPerson) personId = newPerson.id;
    }

    // Calculate score. Auto questions scored now; manual questions deferred to admin grading.
    type SubmittedAnswer = { question_id: string; selected_answer?: number; response_text?: string };
    const questions = test.questions || [];
    let score = 0;
    const manualAnswers: { question_id: string; response_text: string }[] = [];
    const answerDetails = (answers as SubmittedAnswer[]).map((a) => {
        const q = questions.find((q: { id: string }) => q.id === a.question_id);
        if (q && q.grading_mode === "manual") {
            manualAnswers.push({ question_id: a.question_id, response_text: a.response_text ?? "" });
            return { question_id: a.question_id, requires_manual: true, is_correct: null };
        }
        const isCorrect = !!q && a.selected_answer === q.correct_answer;
        if (isCorrect) score++;
        return { question_id: a.question_id, selected_answer: a.selected_answer ?? -1, is_correct: isCorrect };
    });

    const gradingStatus = manualAnswers.length > 0 ? "pending_grading" : "graded";

    // Save result using admin client (bypasses RLS)
    const { data: result, error } = await admin
        .from("results")
        .insert({
            test_id,
            candidate_name,
            candidate_email,
            answers: answerDetails,
            score,
            total_questions: questions.length,
            grading_status: gradingStatus,
            time_taken: time_taken || 0,
            ai_analysis: null,
            suggested_questions: null,
            person_id: personId,
        })
        .select()
        .single();

    if (error) {
        console.error("Submission insertion error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Persist ungraded overlay rows for manual answers (candidate response captured, grade pending).
    if (manualAnswers.length > 0) {
        const { error: gradeError } = await admin.from("answer_grades").insert(
            manualAnswers.map((m) => ({
                result_id: result.id,
                question_id: m.question_id,
                response_text: m.response_text,
                is_correct: null,
            }))
        );
        if (gradeError) console.error("answer_grades insertion error:", gradeError);
    }

    // Check if slot limit is reached before marking as completed
    if (test.max_participants) {
        const { count: resultCount } = await admin
            .from("results")
            .select('*', { count: 'exact', head: true })
            .eq("test_id", test_id);

        if (resultCount && resultCount >= test.max_participants) {
            await admin.from("tests").update({ status: "completed" }).eq("id", test_id);
        }
    }

    return NextResponse.json({ result }, { status: 201 });
}
