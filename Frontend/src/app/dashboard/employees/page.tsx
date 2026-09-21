import { redirect } from "next/navigation";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { canManageVision } from "@/lib/vision-ai";
import EmployeesClient from "./employees-client";

export const metadata = {
  title: "Employees | DownTown",
  description: "Employee profile, face enrollment, attendance, and violations",
};

export default async function EmployeesPage() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) redirect("/login");
  if (!canManageVision(ctx.role)) redirect("/dashboard");
  return <EmployeesClient />;
}
