import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import RecruitmentDashboardClient from "./recruitment-dashboard-client";

const ALLOWED = ["hr", "interviewer", "recruiter", "admin", "super_admin"];

export default async function RecruitmentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users").select("name, email, role").eq("auth_id", user.id).single();

  if (!ALLOWED.includes(profile?.role ?? "")) redirect("/dashboard/recruitment");

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar
        user={profile ? { name: profile.name, email: profile.email, role: profile.role } : null}
      />
      <div className="pt-[var(--page-top)] px-4 sm:px-6 max-w-[88rem] mx-auto">
        <PageBreadcrumb breadcrumbs={[{ label: "Recruitment", href: "/dashboard/recruitment" }, { label: "Dashboard" }]} />
        <RecruitmentDashboardClient />
      </div>
    </div>
  );
}
