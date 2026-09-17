import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type InternalCaller = {
  id: string;
  authId: string;
  role: string;
};

export function jsonError(message: string, status: number, corsHeaders: HeadersInit) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function requireInternalCaller(
  request: Request,
  supabase: ReturnType<typeof createClient>,
  allowedRoles: readonly string[],
): Promise<InternalCaller | Response> {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) return jsonError("Unauthorized", 401, {});

  const { data: auth, error: authError } = await supabase.auth.getUser(match[1]);
  if (authError || !auth.user) return jsonError("Unauthorized", 401, {});

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, role")
    .eq("auth_id", auth.user.id)
    .maybeSingle();
  if (userError || !user || !allowedRoles.includes(user.role)) {
    return jsonError("Forbidden", 403, {});
  }

  return { id: user.id, authId: auth.user.id, role: user.role };
}
