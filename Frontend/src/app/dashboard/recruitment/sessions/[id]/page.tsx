import { redirect } from "next/navigation";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import SessionDetailClient from "./session-detail-client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) redirect("/login");

  const allowed = ["hr", "admin", "super_admin", "interviewer"];
  if (!allowed.includes(ctx.role)) redirect("/dashboard");

  const { id } = await params;
  return <SessionDetailClient id={id} userRole={ctx.role} />;
}
