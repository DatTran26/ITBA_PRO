import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { listActiveInterviewers } from "@/lib/recruitment/list-interviewers";

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, role } = ctx;
  if (!isAdmin && role !== "recruiter" && role !== "hr") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const interviewers = await listActiveInterviewers();
  return NextResponse.json({ interviewers });
}
