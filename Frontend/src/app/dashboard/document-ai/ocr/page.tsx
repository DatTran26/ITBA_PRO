import { redirect } from "next/navigation";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import OcrWorkbenchClient from "./ocr-workbench-client";

export default async function OcrWorkbenchPage() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) redirect("/login");
  if (!ctx.isAdmin && !ctx.isLeader) redirect("/dashboard");

  return <OcrWorkbenchClient />;
}
