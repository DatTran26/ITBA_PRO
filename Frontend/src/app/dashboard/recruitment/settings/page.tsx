import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import RecruitmentSettingsClient from "./recruitment-settings-client";

export default async function RecruitmentSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users").select("name, email, role").eq("auth_id", user.id).single();

  const role = profile?.role ?? "";
  const ALLOWED = ["hr", "interviewer", "recruiter", "admin", "super_admin"];
  if (!ALLOWED.includes(role)) redirect("/dashboard/recruitment");

  return (
    <div className="min-h-screen bg-[#0A1120]">
      <AppNavbar
        user={profile ? { name: profile.name, email: profile.email, role } : null}
      />
      <div className="pt-[var(--page-top)] px-4 sm:px-6 max-w-[88rem] mx-auto">
        <PageBreadcrumb breadcrumbs={[{ label: "Recruitment", href: "/dashboard/recruitment" }, { label: "Settings" }]} />
        <RecruitmentSettingsClient canEdit={role === "hr" || role === "admin" || role === "super_admin"} />
      </div>
    </div>
  );
}
