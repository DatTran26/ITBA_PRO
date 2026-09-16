import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
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
    ? await supabase
      .from("users")
      .select("name, email, role")
      .eq("auth_id", user.id)
      .single()
    : { data: null };

  const effectiveRole = profile?.role ?? devUser?.role;
  if (!["hr", "admin", "super_admin"].includes(effectiveRole ?? "")) {
    redirect("/dashboard/recruitment");
  }

  const navUser = profile ?? devUser;

  return (
    <div className="min-h-screen bg-[#0A1120]">
      <AppNavbar
        user={navUser ? { name: navUser.name, email: navUser.email, role: effectiveRole } : null}
      />
      <div className="pt-[var(--page-top)] px-4 sm:px-6 max-w-[88rem] mx-auto">
        <PageBreadcrumb breadcrumbs={[
          { label: "Recruitment", href: "/dashboard/recruitment" },
          { label: "Report" },
        ]} />
        <ReportComingSoonClient />
      </div>
    </div>
  );
}
