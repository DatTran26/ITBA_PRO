import { createClient } from "@/lib/supabase/server";
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
    const supabase = await createClient();

    if (!id || typeof id !== 'string') redirect(`/test/${token}`);

    // Get result
    const { data: result, error: resultError } = await supabase
        .from("results")
        .select("*")
        .eq("id", id)
        .single();

    if (resultError || !result) {
        console.error("Result fetch error:", resultError);
        redirect(`/test/${token}`);
    }

    // Get test associated with result
    const { data: test, error: testError } = await supabase
        .from("tests")
        .select("*, questions(*)")
        .eq("id", result.test_id)
        .single();

    if (testError || !test || test.token !== token) {
        redirect(`/test/${token}`);
    }

    test.questions?.sort((a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num);

    return <ResultClient result={result} test={test} />;
}
