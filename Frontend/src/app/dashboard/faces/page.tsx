import { redirect } from "next/navigation";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { canManageVision } from "@/lib/vision-ai";
import FacesClient from "./faces-client";

export default async function FacesPage() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) redirect("/login");
  if (!canManageVision(ctx.role)) redirect("/dashboard");
  return <FacesClient isSuperAdmin={ctx.isSuperAdmin} canIssueReauth={ctx.isAdmin} currentUserRole={ctx.role} />;
}
