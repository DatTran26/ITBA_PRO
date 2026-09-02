import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import ApplicationDetailClient from "./application-detail-client";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userData } = await supabase
    .from("users")
    .select("name, email, role")
    .eq("auth_id", user.id)
    .single();

  const role = userData?.role ?? "viewer";

  return (
    <>
      <AppNavbar user={userData ?? null} />
      <div className="pt-[var(--page-top)] px-4 sm:px-6 max-w-[88rem] mx-auto">
        <PageBreadcrumb breadcrumbs={[{ href: "/dashboard/recruitment", label: "Recruitment" }, { label: "Detail" }]} />
        <ApplicationDetailClient id={id} userRole={role} />
      </div>
    </>
  );
}
