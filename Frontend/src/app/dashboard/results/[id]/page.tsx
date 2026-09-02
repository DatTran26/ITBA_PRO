import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ResultDetailClient from "./result-detail-client";

export default async function ResultDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Get result with test and questions
    const { data: result } = await supabase
        .from("results")
        .select("*")
        .eq("id", id)
        .single();

    if (!result) redirect("/dashboard");

    const { data: test } = await supabase
        .from("tests")
        .select("*, questions(*)")
        .eq("id", result.test_id)
        .single();

    if (!test) redirect("/dashboard");

    test.questions?.sort((a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num);

    // Fetch existing follow-up session (latest one)
    const { data: followUpSessions } = await supabase
        .from("follow_up_sessions")
        .select("*")
        .eq("result_id", id)
        .order("created_at", { ascending: false })
        .limit(1);

    const followUpSession = followUpSessions?.[0] || null;

    // Fetch skill requirements + existing evaluations for employee tests
    let skillRequirements: any[] = [];
    let existingEvaluations: any[] = [];

    if (test.target_type === "employee" && test.position_id) {
        const { data: reqs } = await supabase
            .from("position_skill_requirements")
            .select("*, skills(id, name, category)")
            .eq("position_id", test.position_id)
            .order("checklist_order");

        skillRequirements = reqs || [];

        const { data: evals } = await supabase
            .from("skill_evaluations")
            .select("*")
            .eq("result_id", id);

        existingEvaluations = evals || [];
    }

    // Fetch manual grading answer records
    const { data: answerGrades } = await supabase
        .from("answer_grades")
        .select("*")
        .eq("result_id", id);

    return (
        <ResultDetailClient
            result={result}
            test={test}
            followUpSession={followUpSession}
            skillRequirements={skillRequirements}
            existingEvaluations={existingEvaluations}
            initialAnswerGrades={answerGrades || []}
        />
    );
}
