import { redirect } from "next/navigation";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import ModelControllerClient from "./model-controller-client";

export const metadata = {
  title: "AI Model Configuration | DownTown",
  description: "Configure Vision AI model settings",
};

export default async function ModelControllerPage() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) redirect("/login");
  if (!ctx.isSuperAdmin) redirect("/dashboard");

  return <ModelControllerClient />;
}
