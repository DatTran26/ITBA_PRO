import { redirect } from "next/navigation";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { canManageVision } from "@/lib/vision-ai";
import AttendanceKioskClient from "./kiosk-client";

export default async function AttendanceKioskPage() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) redirect("/login");
  if (!canManageVision(ctx.role)) redirect("/dashboard/attendance");
  return <AttendanceKioskClient />;
}
