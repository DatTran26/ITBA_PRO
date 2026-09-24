import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageContainer from "@/components/ui/page-container";
import ReportComingSoonClient from "./report-coming-soon-client";

export default async function RecruitmentReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users").select("role").eq("auth_id", user.id).single();

  if (!profile || !["hr", "admin", "super_admin"].includes(profile.role ?? "")) {
    redirect("/dashboard/recruitment");
  }

  return (
    <PageContainer>
      <ReportComingSoonClient />
    </PageContainer>
  );
}
