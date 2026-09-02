import { redirect } from "next/navigation";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import InterviewRoomClient from "./interview-room-client";

export default async function InterviewRoomPage() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) redirect("/login");
  if (!["interviewer", "hr", "admin", "super_admin"].includes(ctx.role)) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#121A2E] text-[#ECF0F7] selection:bg-[#7C8FFF]/30 font-body">
      <AppNavbar user={null} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-[var(--page-top)] sm:px-6">
        <div className="mb-6">
          <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Interview Room" }]} />
        </div>
        <InterviewRoomClient />
      </main>
    </div>
  );
}
