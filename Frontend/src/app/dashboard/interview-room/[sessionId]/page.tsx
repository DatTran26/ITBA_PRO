import { redirect } from "next/navigation";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import InterviewRoomSessionClient from "./interview-room-session-client";

export default async function InterviewRoomSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) redirect("/login");
  if (!["interviewer", "hr", "admin", "super_admin"].includes(ctx.role)) redirect("/dashboard");

  const { sessionId } = await params;
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-body">
      <AppNavbar user={null} />
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-[var(--page-top)] sm:px-6">
        <div className="mb-6">
          <PageBreadcrumb breadcrumbs={[{ label: "Interview Room", href: "/dashboard/interview-room" }, { label: "Session" }]} />
        </div>
        <InterviewRoomSessionClient sessionId={sessionId} />
      </main>
    </div>
  );
}
