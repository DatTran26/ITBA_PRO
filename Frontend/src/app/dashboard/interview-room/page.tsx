import { redirect } from "next/navigation";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import PageContainer from "@/components/ui/page-container";
import InterviewRoomClient from "./interview-room-client";

export default async function InterviewRoomPage() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) redirect("/login");
  if (!["interviewer", "hr", "admin", "super_admin"].includes(ctx.role)) redirect("/dashboard");

  return (
    <PageContainer>
      <div className="pb-12"><InterviewRoomClient /></div>
    </PageContainer>
  );
}
