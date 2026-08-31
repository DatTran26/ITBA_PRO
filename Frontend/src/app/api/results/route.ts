import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_NAME = 200;
const MAX_EMAIL = 320;
const MAX_RESPONSE_TEXT = 10_000;
const MAX_ANSWERS = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubmittedAnswer = {
    question_id: string;
    selected_answer?: number;
    response_text?: string;
};

function submissionErrorStatus(message: string): number {
    if (message.includes("test_not_found")) return 404;
    if (message.includes("test_closed") || message.includes("test_expired")) return 410;
    if (message.includes("test_not_started")) return 403;
    if (message.includes("test_full")) return 409;
    if (message.includes("duplicate") || message.includes("results_one_attempt")) return 409;
    return 500;
}

export async function POST(request: Request) {
    const contentLength = Number(request.headers.get("content-length") || "0");
    if (contentLength > MAX_BODY_BYTES) {
        return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const raw = JSON.stringify(body);
    if (raw.length > MAX_BODY_BYTES) {
        return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const shareToken = typeof body.share_token === "string" ? body.share_token.trim() : "";
    const candidateName = typeof body.candidate_name === "string" ? body.candidate_name.trim() : "";
    const candidateEmail = typeof body.candidate_email === "string" ? body.candidate_email.trim().toLowerCase() : "";
    const answers = body.answers as SubmittedAnswer[] | undefined;
    const timeTaken = typeof body.time_taken === "number" && Number.isFinite(body.time_taken)
        ? Math.max(0, Math.min(Math.round(body.time_taken), 24 * 60 * 60))
        : 0;

    if (!shareToken || shareToken.length < 8 || shareToken.length > 64) {
        return NextResponse.json({ error: "share_token is required" }, { status: 400 });
    }
    if (!candidateName || candidateName.length > MAX_NAME) {
        return NextResponse.json({ error: "Invalid candidate_name" }, { status: 400 });
    }
    if (!candidateEmail || candidateEmail.length > MAX_EMAIL || !EMAIL_RE.test(candidateEmail)) {
        return NextResponse.json({ error: "Invalid candidate_email" }, { status: 400 });
    }
    if (!Array.isArray(answers) || answers.length === 0 || answers.length > MAX_ANSWERS) {
        return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: test } = await admin
        .from("tests")
        .select("*, questions(*)")
        .eq("share_token", shareToken)
        .maybeSingle();

    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    if (typeof body.test_id === "string" && body.test_id !== test.id) {
        return NextResponse.json({ error: "share_token does not match test" }, { status: 403 });
    }

    if (test.status !== "active") {
        return NextResponse.json({ error: "This test is no longer accepting submissions." }, { status: 410 });
    }
    if (test.start_time && new Date() < new Date(test.start_time)) {
        return NextResponse.json({ error: "This test has not started." }, { status: 403 });
    }
    if (test.expires_at && new Date() > new Date(test.expires_at)) {
        return NextResponse.json({ error: "This test has expired." }, { status: 410 });
    }

    const { count: existingForEmail } = await admin
        .from("results")
        .select("*", { count: "exact", head: true })
        .eq("test_id", test.id)
        .ilike("candidate_email", candidateEmail);

    if (existingForEmail && existingForEmail > 0) {
        return NextResponse.json({ error: "You have already submitted this test." }, { status: 409 });
    }

    if (test.max_participants) {
        const { count: resultCount } = await admin
            .from("results")
            .select("*", { count: "exact", head: true })
            .eq("test_id", test.id);

        if (resultCount != null && resultCount >= test.max_participants) {
            return NextResponse.json({ error: "This test is full." }, { status: 409 });
        }
    }

    let personId: string | null = null;
    const { data: existingPerson } = await admin
        .from("persons")
        .select("id")
        .eq("email", candidateEmail)
        .eq("full_name", candidateName)
        .maybeSingle();

    if (existingPerson) {
        personId = existingPerson.id;
    } else if (test.target_type === "employee") {
        return NextResponse.json({
            error: "Thông tin không chính xác hoặc bạn không có trong danh sách tham gia bài test này. Vui lòng liên hệ Admin.",
        }, { status: 403 });
    } else {
        const { data: newPerson, error: personError } = await admin
            .from("persons")
            .insert({
                full_name: candidateName,
                email: candidateEmail,
                type: "candidate",
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

    const allowedIds = new Set((test.questions || []).map((q: { id: string }) => q.id));
    const questions = test.questions || [];
    let score = 0;
    const manualAnswers: { question_id: string; response_text: string }[] = [];
    const answerDetails = answers
        .filter((a) => a && typeof a.question_id === "string" && allowedIds.has(a.question_id))
        .map((a) => {
            const q = questions.find((q: { id: string }) => q.id === a.question_id);
            if (q && q.grading_mode === "manual") {
                const responseText = typeof a.response_text === "string"
                    ? a.response_text.slice(0, MAX_RESPONSE_TEXT)
                    : "";
                manualAnswers.push({ question_id: a.question_id, response_text: responseText });
                return { question_id: a.question_id, requires_manual: true, is_correct: null };
            }
            const selected = typeof a.selected_answer === "number" ? a.selected_answer : -1;
            const isCorrect = !!q && selected === q.correct_answer;
            if (isCorrect) score++;
            return { question_id: a.question_id, selected_answer: selected, is_correct: isCorrect };
        });

    if (answerDetails.length === 0) {
        return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
    }

    const gradingStatus = manualAnswers.length > 0 ? "pending_grading" : "graded";

    const { data: result, error } = await admin
        .from("results")
        .insert({
            test_id: test.id,
            candidate_name: candidateName,
            candidate_email: candidateEmail,
            answers: answerDetails,
            score,
            total_questions: questions.length,
            grading_status: gradingStatus,
            time_taken: timeTaken,
            ai_analysis: null,
            suggested_questions: null,
            person_id: personId,
        })
        .select("id, score, total_questions, grading_status, submitted_at")
        .single();

    if (error) {
        console.error("Submission insertion error:", error);
        const status = submissionErrorStatus(error.message || "");
        const clientMessage = status === 409
            ? "You have already submitted this test or the test is full."
            : status === 410
                ? "This test is no longer accepting submissions."
                : status === 403
                    ? "This test has not started."
                    : "Failed to submit";
        return NextResponse.json({ error: clientMessage }, { status });
    }

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

    if (test.max_participants) {
        const { count: resultCount } = await admin
            .from("results")
            .select("*", { count: "exact", head: true })
            .eq("test_id", test.id);

        if (resultCount && resultCount >= test.max_participants) {
            await admin.from("tests").update({ status: "completed" }).eq("id", test.id);
        }
    }

    return NextResponse.json({ result }, { status: 201 });
}
