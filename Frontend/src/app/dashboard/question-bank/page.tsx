import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import QuestionBankClient from "./question-bank-client";

export default async function QuestionBankPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("auth_id", user.id)
    .single();

  const role = userData?.role ?? "";
  const canEdit = role === "admin" || role === "super_admin" || role === "leader";

  const [{ data: counts }, { data: topicRows }] = await Promise.all([
    supabase
      .from("question_bank")
      .select("level"),
    supabase
      .from("question_bank")
      .select("topic_tag")
      .not("topic_tag", "is", null),
  ]);

  const all = counts ?? [];
  const kpis = {
    total: all.length,
    junior: all.filter((r) => r.level === "junior").length,
    middle: all.filter((r) => r.level === "middle").length,
    senior: all.filter((r) => r.level === "senior").length,
    topics: new Set((topicRows ?? []).map((r) => r.topic_tag).filter(Boolean)).size,
  };

  const topics = [...new Set((topicRows ?? []).map((r) => r.topic_tag).filter((t): t is string => !!t))].sort();

  return <QuestionBankClient kpis={kpis} topics={topics} canEdit={canEdit} />;
}
