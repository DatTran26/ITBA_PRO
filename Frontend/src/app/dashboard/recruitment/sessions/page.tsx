import { redirect } from "next/navigation";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import SessionsClient from "./sessions-client";

export default async function Page() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) redirect("/login");

  const allowed = ["hr", "admin", "super_admin", "interviewer"];
  if (!allowed.includes(ctx.role)) redirect("/dashboard");

  return (
    <div className="pt-[var(--page-top)] px-4 sm:px-6 max-w-[88rem] mx-auto">
      <SessionsClient userRole={ctx.role} />
    </div>
  );
}
