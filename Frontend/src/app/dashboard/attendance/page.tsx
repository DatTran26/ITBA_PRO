import { redirect } from "next/navigation";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import AttendanceClient from "./attendance-client";

export default async function AttendancePage() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) redirect("/login");
  return <AttendanceClient />;
}
