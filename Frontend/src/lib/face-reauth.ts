import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const FACE_REAUTH_TTL_MS = 24 * 60 * 60 * 1000;

const FACE_USER_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isPersistedUserId(userId: string) {
  return FACE_USER_UUID_RE.test(userId);
}

export type FaceReauthRequest = {
  id: string;
  user_id: string;
  token_hash: string;
  created_by: string | null;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export function canIssueFaceReauth(role: string) {
  return role === "admin" || role === "super_admin";
}

export function hashFaceReauthToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createFaceReauthToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashFaceReauthToken(token) };
}

export function buildFaceReauthUrl(origin: string, token: string) {
  const base = origin.replace(/\/+$/, "");
  return `${base}/face-reauth?token=${encodeURIComponent(token)}`;
}

export async function getPendingFaceReauth(userId: string): Promise<FaceReauthRequest | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("face_reauth_requests")
    .select("id, user_id, token_hash, created_by, expires_at, used_at, revoked_at, created_at")
    .eq("user_id", userId)
    .is("used_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function userRequiresFaceReauth(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("users")
    .select("face_reauth_required")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data?.face_reauth_required) return true;
  return Boolean(await getPendingFaceReauth(userId));
}

async function syncFaceReauthFlag(userId: string, required: boolean) {
  const admin = createAdminClient();
  const { data: user, error: userError } = await admin
    .from("users")
    .select("id, auth_id")
    .eq("id", userId)
    .maybeSingle();
  if (userError) throw userError;
  if (!user) return;

  const { error: flagError } = await admin
    .from("users")
    .update({ face_reauth_required: required })
    .eq("id", userId);
  if (flagError) throw flagError;

  if (user.auth_id) {
    const { data: authUser } = await admin.auth.admin.getUserById(user.auth_id);
    if (authUser.user) {
      await admin.auth.admin.updateUserById(user.auth_id, {
        user_metadata: {
          ...(authUser.user.user_metadata ?? {}),
          face_reauth_required: required,
        },
      });
    }
  }
}

export async function issueFaceReauthRequest(input: {
  userId: string;
  email?: string;
  createdBy: string;
  origin: string;
}) {
  const admin = createAdminClient();
  const email = input.email?.trim().toLowerCase() ?? "";

  let target: { id: string; auth_id: string | null; email: string; name: string; role: string } | null = null;
  if (isPersistedUserId(input.userId)) {
    const { data, error } = await admin
      .from("users")
      .select("id, auth_id, email, name, role")
      .eq("id", input.userId)
      .maybeSingle();
    if (error) throw error;
    target = data;
  }
  if (!target && email) {
    const { data, error } = await admin
      .from("users")
      .select("id, auth_id, email, name, role")
      .eq("email", email)
      .maybeSingle();
    if (error) throw error;
    target = data;
  }
  if (!target) {
    throw new Error(
      isPersistedUserId(input.userId)
        ? "Account not found"
        : "This profile is a local placeholder. Choose the Staging account for this email."
    );
  }

  const { error: revokeError } = await admin
    .from("face_reauth_requests")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", target.id)
    .is("used_at", null)
    .is("revoked_at", null);
  if (revokeError) throw revokeError;

  const { token, tokenHash } = createFaceReauthToken();
  const expiresAt = new Date(Date.now() + FACE_REAUTH_TTL_MS).toISOString();
  const { data: created, error: insertError } = await admin
    .from("face_reauth_requests")
    .insert({
      user_id: target.id,
      token_hash: tokenHash,
      created_by: isPersistedUserId(input.createdBy) ? input.createdBy : null,
      expires_at: expiresAt,
    })
    .select("id, expires_at, created_at")
    .single();
  if (insertError || !created) throw insertError ?? new Error("Unable to create face verification request");

  await syncFaceReauthFlag(target.id, true);

  return {
    id: created.id,
    userId: target.id,
    email: target.email,
    name: target.name,
    expiresAt: created.expires_at,
    createdAt: created.created_at,
    url: buildFaceReauthUrl(input.origin, token),
  };
}

export async function revokeFaceReauthRequest(requestId: string) {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("face_reauth_requests")
    .select("id, user_id, used_at, revoked_at")
    .eq("id", requestId)
    .maybeSingle();
  if (error) throw error;
  if (!row) throw new Error("Request not found");
  if (row.used_at) throw new Error("This request was already completed");
  if (!row.revoked_at) {
    const { error: revokeError } = await admin
      .from("face_reauth_requests")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", requestId);
    if (revokeError) throw revokeError;
  }
  const pending = await getPendingFaceReauth(row.user_id);
  if (!pending) await syncFaceReauthFlag(row.user_id, false);
}

export async function completeFaceReauthForUser(
  userId: string,
  requestId?: string,
  options: { requireClaim?: boolean } = {},
) {
  const admin = createAdminClient();
  if (requestId) {
    let completion = admin
      .from("face_reauth_requests")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("id", requestId)
      .is("revoked_at", null);
    completion = options.requireClaim
      ? completion.not("used_at", "is", null)
      : completion.is("used_at", null);
    const { data: completed, error: completedError } = await completion.select("id");
    if (completedError) throw completedError;
    if (!completed?.length) throw new Error("This face verification request is no longer valid");
  } else {
    // Manual administrator enrollment is an explicit alternate completion path.
    const { error } = await admin
      .from("face_reauth_requests")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("used_at", null)
      .is("revoked_at", null);
    if (error) throw error;
  }

  const pending = await getPendingFaceReauth(userId);
  await syncFaceReauthFlag(userId, Boolean(pending));
}

export async function findFaceReauthByToken(token: string): Promise<FaceReauthRequest | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("face_reauth_requests")
    .select("id, user_id, token_hash, created_by, expires_at, used_at, revoked_at, created_at")
    .eq("token_hash", hashFaceReauthToken(token))
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function claimFaceReauthByToken(token: string): Promise<FaceReauthRequest | null> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("face_reauth_requests")
    .update({ used_at: now })
    .eq("token_hash", hashFaceReauthToken(token))
    .is("used_at", null)
    .is("revoked_at", null)
    .gt("expires_at", now)
    .select("id, user_id, token_hash, created_by, expires_at, used_at, revoked_at, created_at")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function releaseFaceReauthClaim(requestId: string, claimedAt: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("face_reauth_requests")
    .update({ used_at: null })
    .eq("id", requestId)
    .eq("used_at", claimedAt);
  if (error) throw error;
}

export function describeFaceReauthState(row: FaceReauthRequest | null) {
  if (!row) return "This face verification link is invalid.";
  if (row.revoked_at) return "This face verification link was revoked. Ask an administrator for a new link.";
  if (row.used_at) return "This face verification link was already used.";
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return "This face verification link has expired. Ask an administrator for a new link.";
  }
  return null;
}
