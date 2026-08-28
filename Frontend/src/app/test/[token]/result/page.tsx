import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import ResultClient from "./result-client";

export default async function CandidateResultPage({
    params,
    searchParams,
}: {
    params: Promise<{ token: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { token } = await params;
    const { id } = await searchParams;
    if (!id || typeof id !== "string") redirect(`/test/${token}`);

    const admin = createAdminClient();
    const { data: test } = await admin
        .from("tests")
        .select("id, share_token, title, job_role, level, questions(id, question_text, options, topic, order_num)")
        .eq("share_token", token)
        .maybeSingle();

    if (!test) redirect(`/test/${token}`);

    const { data: result } = await admin
        .from("results")
        .select("id, candidate_name, candidate_email, score, total_questions, time_taken, submitted_at, answers, ai_analysis, suggested_questions")
        .eq("id", id)
        .eq("test_id", test.id)
        .maybeSingle();

    if (!result) redirect(`/test/${token}`);

    const questions = (test.questions ?? [])
        .slice()
        .sort((a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num);

    return <ResultClient result={result} test={{ ...test, questions }} />;
}
