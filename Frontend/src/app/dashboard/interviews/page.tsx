import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function InterviewsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("auth_id", user.id)
    .single();

  if (profile?.role === "interviewer") redirect("/dashboard/interview-room");
  redirect("/dashboard/recruitment/sessions");
}
