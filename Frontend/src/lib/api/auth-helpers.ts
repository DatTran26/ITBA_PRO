import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface AuthContext {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  authId: string;
  role: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isHr: boolean;
  isInterviewer: boolean;
  isRecruiter: boolean;
  isLeader: boolean;
}

export async function getAuthContext(): Promise<AuthContext | NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let { data: userData } = await supabase
    .from("users")
    .select("id, role")
    .eq("auth_id", user.id)
    .single();

  if (!userData) {
    const defaultName = user.user_metadata?.name || user.email?.split("@")[0] || "Admin";
    const defaultEmail = user.email || "";
    const { data: createdUser } = await supabase
      .from("users")
      .insert({
        auth_id: user.id,
        email: defaultEmail,
        name: defaultName,
        role: "super_admin",
      })
      .select("id, role")
      .single();

    userData = createdUser || {
      id: user.id,
      role: "super_admin",
    };
  }

  const role = userData?.role || "super_admin";
  return {
    supabase,
    userId: userData?.id || user.id,
    authId: user.id,
    role: role as string,
    isAdmin: role === "admin" || role === "super_admin",
    isSuperAdmin: role === "super_admin",
    isHr: role === "hr",
    isInterviewer: role === "interviewer",
    isRecruiter: role === "recruiter",
    isLeader: role === "leader",
  };
}

export function isAuthError(ctx: AuthContext | NextResponse): ctx is NextResponse {
  return ctx instanceof NextResponse;
}
