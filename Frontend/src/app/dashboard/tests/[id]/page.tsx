import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TestDetailClient from "./test-detail-client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function TestDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: test } = await supabase
        .from("tests")
        .select("*, questions(*), results(*)")
        .eq("id", id)
        .single();

    if (!test) redirect("/dashboard");

    // Sort questions
    test.questions?.sort((a: { order_num: number }, b: { order_num: number }) => a.order_num - b.order_num);

    // Extract generation context for regeneration feature
    const generationContext = {
        job_description: test.job_description || null,
        test_description: test.test_description || null,
    };

    return <TestDetailClient test={test} generationContext={generationContext} />;
}
