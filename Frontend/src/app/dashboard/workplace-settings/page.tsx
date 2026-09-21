import { redirect } from "next/navigation";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { canManageVision } from "@/lib/vision-ai";
import WorkplaceSettingsClient from "./workplace-settings-client";

export const metadata = {
  title: "Workplace Settings | DownTown",
  description: "Configure workplace monitoring review and violation rules",
};

export default async function WorkplaceSettingsPage() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) redirect("/login");
  if (!canManageVision(ctx.role)) redirect("/dashboard");

  return <WorkplaceSettingsClient />;
}
