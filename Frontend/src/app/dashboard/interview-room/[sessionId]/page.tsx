import { redirect } from "next/navigation";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import PageContainer from "@/components/ui/page-container";
import InterviewRoomSessionClient from "./interview-room-session-client";

export default async function InterviewRoomSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) redirect("/login");
  if (!["interviewer", "hr", "admin", "super_admin"].includes(ctx.role)) redirect("/dashboard");

  const { sessionId } = await params;
  return (
    <PageContainer>
      <div className="pb-12"><InterviewRoomSessionClient sessionId={sessionId} /></div>
    </PageContainer>
  );
}
