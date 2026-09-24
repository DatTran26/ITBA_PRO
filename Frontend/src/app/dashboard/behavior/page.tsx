import { redirect } from "next/navigation";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { canManageVision } from "@/lib/vision-ai";
import BehaviorClient from "./behavior-client";

export default async function BehaviorPage() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) redirect("/login");
  if (!canManageVision(ctx.role)) redirect("/dashboard");
  return <BehaviorClient />;
}
