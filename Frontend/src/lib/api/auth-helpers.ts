import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DEV_AUTH_COOKIE, parseDevAuthCookie } from "@/lib/dev-auth";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export interface AuthContext {
  supabase: SupabaseServer | null;
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

function rolesFrom(role: string) {
  return {
    role,
    isAdmin: role === "admin" || role === "super_admin",
    isSuperAdmin: role === "super_admin",
    isHr: role === "hr",
    isInterviewer: role === "interviewer",
    isRecruiter: role === "recruiter",
    isLeader: role === "leader",
  };
}

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getAuthContext(): Promise<AuthContext | NextResponse> {
  const cookieStore = await cookies();
  const devUser = parseDevAuthCookie(cookieStore.get(DEV_AUTH_COOKIE)?.value);
  if (devUser) {
    const role = devUser.role;
    const supabase = isSupabaseConfigured() ? await createClient() : null;
    return {
      supabase,
      userId: devUser.id,
      authId: devUser.authId,
      ...rolesFrom(role),
    };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    ...rolesFrom(role),
  };
}

export function isAuthError(ctx: AuthContext | NextResponse): ctx is NextResponse {
  return ctx instanceof NextResponse;
}

/** Empty 200 for dashboard chrome; 503 for pages that need the database. */
export function missingSupabase(ctx: AuthContext, empty?: Record<string, unknown>) {
  if (ctx.supabase) return null;
  if (empty) return NextResponse.json(empty);
  return NextResponse.json({ error: "Unavailable without Supabase (local vision mode)" }, { status: 503 });
}
