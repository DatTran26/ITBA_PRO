import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PageContainer from "@/components/ui/page-container";
import { createClient } from "@/lib/supabase/server";
import { DEV_AUTH_COOKIE, parseDevAuthCookie } from "@/lib/dev-auth";
import ReportComingSoonClient from "./report-coming-soon-client";

export default async function RecruitmentReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const devUser = parseDevAuthCookie(cookieStore.get(DEV_AUTH_COOKIE)?.value);
  if (!user && !devUser) redirect("/login");

  const { data: profile } = user
    ? await supabase.from("users").select("role").eq("auth_id", user.id).single()
    : { data: null };

  const effectiveRole = profile?.role ?? devUser?.role;
  if (!["hr", "admin", "super_admin"].includes(effectiveRole ?? "")) {
    redirect("/dashboard/recruitment");
  }

  return (
    <PageContainer>
      <ReportComingSoonClient />
    </PageContainer>
  );
}
