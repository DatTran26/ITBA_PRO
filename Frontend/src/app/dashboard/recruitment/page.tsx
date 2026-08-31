import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import RecruitmentClient from "./recruitment-client";

export default async function RecruitmentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, role")
    .eq("auth_id", user.id)
    .single();

  const userRole = profile?.role ?? "user";

  return (
    <div className="min-h-screen bg-[#0A1120]">
      <AppNavbar
        user={profile ? { name: profile.name, email: profile.email, role: profile.role } : null}
      />
      <div className="pt-[var(--page-top)] px-4 sm:px-6 max-w-[88rem] mx-auto">
        <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Recruitment" }]} />
        <RecruitmentClient userRole={userRole} />
      </div>
    </div>
  );
}
