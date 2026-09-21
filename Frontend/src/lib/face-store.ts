import path from "node:path";
import { promises as fs } from "node:fs";
import { createAdminClient } from "@/lib/supabase/admin";
import { callVisionAi } from "@/lib/vision-ai";
import { DEV_AUTH_USER } from "@/lib/dev-auth";
import { atomicWriteJson } from "@/lib/workplace-local";

export interface FaceUserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  enrollment: {
    id: string;
    created_at: string;
    imageCount?: number;
    hasLocalFiles?: boolean;
  } | null;
}

export interface LocalFaceRegistryItem {
  userId: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  embeddingsCount: number;
  embeddings?: number[][];
  sync_status: "local_only" | "synced";
}

function getRegistryFilePath(): string {
  return path.resolve(process.cwd(), "..", "data", "vision-ai", "faces-registry.json");
}

function getAccountsFilePath(): string {
  return (
    process.env.DEV_LOGIN_ACCOUNTS_FILE ??
    path.resolve(process.cwd(), "..", "ITBA_Accounts.txt")
  );
}

export async function readLocalRegistry(): Promise<Record<string, LocalFaceRegistryItem>> {
  try {
    const raw = await fs.readFile(getRegistryFilePath(), "utf8");
    const parsed = JSON.parse(raw) as Record<string, LocalFaceRegistryItem>;
    for (const item of Object.values(parsed)) {
      if (!item.sync_status) item.sync_status = "local_only";
    }
    return parsed;
  } catch {
    return {};
  }
}

async function writeLocalRegistry(registry: Record<string, LocalFaceRegistryItem>): Promise<void> {
  await atomicWriteJson(getRegistryFilePath(), registry);
}

/**
 * Standard test accounts supported locally.
 */
export async function getKnownAccounts(): Promise<Array<{ id: string; email: string; name: string; role: string }>> {
  const accounts: Array<{ id: string; email: string; name: string; role: string }> = [
    {
      id: DEV_AUTH_USER.id,
      email: (process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL ?? "test.superadmin@itba.ai").toLowerCase(),
      name: DEV_AUTH_USER.name,
      role: DEV_AUTH_USER.role,
    },
    { id: "local-admin", email: "test.admin@itba.ai", name: "Test Admin", role: "admin" },
    { id: "local-leader", email: "test.leader@itba.ai", name: "Test Leader", role: "leader" },
    { id: "local-hr", email: "test.hr@itba.ai", name: "Test HR", role: "hr" },
    { id: "local-recruiter", email: "test.recruiter@itba.ai", name: "Test Recruiter", role: "recruiter" },
    { id: "local-interviewer", email: "test.interviewer@itba.ai", name: "Test Interviewer", role: "interviewer" },
  ];

  try {
    const fileText = await fs.readFile(getAccountsFilePath(), "utf8");
    for (const line of fileText.split(/\r?\n/)) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3 && ["super_admin", "admin", "leader", "hr", "recruiter", "interviewer"].includes(parts[0])) {
        const role = parts[0];
        const emailIndex = parts.findIndex((p) => p.includes("@"));
        if (emailIndex !== -1) {
          const email = parts[emailIndex].toLowerCase();
          const name = parts.slice(1, emailIndex).join(" ");
          const existing = accounts.find((a) => a.email === email);
          if (!existing) {
            accounts.push({ id: `local-${role}`, email, name: name || `Test ${role}`, role });
          }
        }
      }
    }
  } catch {
    // Ignore file read error, default fallback accounts exist
  }

  return accounts;
}

export async function findUserByEmail(
  email: string
): Promise<{ id: string; authId?: string; name: string; email: string; role: string } | null> {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Try Supabase admin if credentials are valid
  try {
    const admin = createAdminClient();
    const { data: user } = await admin
      .from("users")
      .select("id, auth_id, name, email, role")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (user) {
      return {
        id: user.id,
        authId: user.auth_id ?? user.id,
        name: user.name ?? user.email,
        email: user.email,
        role: user.role,
      };
    }
  } catch {
    // Supabase credentials unavailable or query failed; fallback to local accounts
  }

  // 2. Check known local accounts
  const accounts = await getKnownAccounts();
  const matched = accounts.find((a) => a.email.toLowerCase() === normalizedEmail);
  if (matched) {
    return {
      id: matched.id,
      authId: matched.id,
      name: matched.name,
      email: matched.email,
      role: matched.role,
    };
  }

  // 3. Fallback: create safe user id from email
  const safeId = "user-" + Buffer.from(normalizedEmail).toString("hex").slice(0, 16);
  return {
    id: safeId,
    authId: safeId,
    name: normalizedEmail.split("@")[0],
    email: normalizedEmail,
    role: "user",
  };
}

export async function findRegisteredUserByEmail(
  email: string
): Promise<{ id: string; authId?: string; name: string; email: string; role: string } | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const admin = createAdminClient();
  const { data: user, error } = await admin
    .from("users")
    .select("id, auth_id, name, email, role")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (error) throw error;
  if (!user) return null;
  return {
    id: user.id,
    authId: user.auth_id ?? user.id,
    name: user.name ?? user.email,
    email: user.email,
    role: user.role,
  };
}

export async function saveFaceEnrollment(
  user: { id: string; email: string; name?: string; role?: string },
  embeddings: number[][]
): Promise<void> {
  // 1. Save to local registry
  const registry = await readLocalRegistry();
  registry[user.id] = {
    userId: user.id,
    email: user.email,
    name: user.name ?? user.email,
    role: user.role ?? "user",
    createdAt: new Date().toISOString(),
    embeddingsCount: embeddings.length,
    embeddings: embeddings,
    sync_status: "local_only",
  };
  await writeLocalRegistry(registry);

  // 2. Persist embeddings to Supabase when server credentials exist.
  try {
    const admin = createAdminClient();
    const { error: deleteError } = await admin.from("user_face_embeddings").delete().eq("user_id", user.id);
    if (deleteError) throw deleteError;
    const { error: insertError } = await admin.from("user_face_embeddings").insert({
      user_id: user.id,
      embedding_json: embeddings,
      angle_count: embeddings.length,
      is_active: true,
    });
    if (insertError) throw insertError;
    registry[user.id].sync_status = "synced";
    await writeLocalRegistry(registry);
  } catch (error) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
    throw error;
  }
}

export async function getFaceEnrollment(
  userId: string
): Promise<{ id: string; created_at: string; embeddings?: number[][] } | null> {
  // 1. Check Supabase
  try {
    const admin = createAdminClient();
    const { data: enrollment, error } = await admin
      .from("user_face_embeddings")
      .select("id, created_at, embedding_json")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (enrollment && Array.isArray(enrollment.embedding_json)) {
      return {
        id: enrollment.id,
        created_at: enrollment.created_at,
        embeddings: enrollment.embedding_json,
      };
    }
  } catch (error) {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) throw error;
  }

  // 2. Check local registry
  const registry = await readLocalRegistry();
  const localItem = registry[userId] || Object.values(registry).find(
    (item) => item.userId === userId || item.email.toLowerCase() === userId.toLowerCase()
  );
  if (localItem) {
    return {
      id: `local-${localItem.userId}`,
      created_at: localItem.createdAt,
      embeddings: localItem.embeddings,
    };
  }

  return null;
}

export async function listActiveFaceEnrollments(): Promise<
  Array<{
    id: string;
    authId?: string | null;
    email: string;
    name: string;
    role: string;
    embeddings: number[][];
  }>
> {
  const results: Array<{
    id: string;
    authId?: string | null;
    email: string;
    name: string;
    role: string;
    embeddings: number[][];
  }> = [];

  try {
    const admin = createAdminClient();
    const [{ data: enrollments, error: enrollmentError }, { data: users, error: userError }] = await Promise.all([
      admin
        .from("user_face_embeddings")
        .select("user_id, embedding_json, created_at")
        .order("created_at", { ascending: false }),
      admin.from("users").select("id, auth_id, email, name, role, face_reauth_required"),
    ]);
    if (enrollmentError) throw enrollmentError;
    if (userError) throw userError;

    const userMap = new Map((users ?? []).map((user) => [user.id, user]));
    const seen = new Set<string>();

    for (const row of enrollments ?? []) {
      if (seen.has(row.user_id)) continue;
      const embeddings = row.embedding_json;
      if (!Array.isArray(embeddings) || embeddings.length < 4) continue;
      const user = userMap.get(row.user_id);
      if (!user || user.face_reauth_required) continue;
      seen.add(row.user_id);
      results.push({
        id: user.id,
        authId: user.auth_id,
        email: user.email,
        name: user.name ?? user.email,
        role: user.role,
        embeddings,
      });
    }
    if (results.length) return results;
  } catch {
    // Local Face ID: enrollments live in data/vision-ai/faces-registry.json
  }

  const registry = await readLocalRegistry();
  for (const item of Object.values(registry)) {
    const embeddings = item.embeddings;
    if (!Array.isArray(embeddings) || embeddings.length < 4) continue;
    results.push({
      id: item.userId,
      authId: item.userId,
      email: item.email,
      name: item.name,
      role: item.role,
      embeddings,
    });
  }
  return results;
}

export async function deleteFaceEnrollment(userId: string): Promise<void> {
  // 1. Call Python API to delete files on disk
  try {
    await callVisionAi(`/api/face/enroll/${encodeURIComponent(userId)}`, { method: "DELETE" });
  } catch {
    // ignore
  }

  // 2. Remove from local registry
  const registry = await readLocalRegistry();
  if (registry[userId]) {
    delete registry[userId];
    await writeLocalRegistry(registry);
  }

  // 3. Remove from Supabase if configured
  try {
    const admin = createAdminClient();
    await admin.from("user_face_embeddings").delete().eq("user_id", userId);
  } catch {
    // ignore
  }
}

const FACE_USER_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPersistedFaceUserId(userId: string) {
  return FACE_USER_UUID_RE.test(userId);
}

export async function getAllFaceUsers(): Promise<FaceUserRecord[]> {
  const usersMap = new Map<string, FaceUserRecord>();
  const emailToId = new Map<string, string>();

  function upsert(user: FaceUserRecord, preferIncoming = false) {
    const emailKey = user.email.trim().toLowerCase();
    const existingId = emailKey ? emailToId.get(emailKey) : undefined;
    if (existingId) {
      const existing = usersMap.get(existingId);
      if (!existing) return;
      const incomingWins = preferIncoming || (isPersistedFaceUserId(user.id) && !isPersistedFaceUserId(existing.id));
      if (incomingWins && existingId !== user.id) {
        usersMap.delete(existingId);
        usersMap.set(user.id, {
          ...user,
          enrollment: user.enrollment ?? existing.enrollment,
        });
        if (emailKey) emailToId.set(emailKey, user.id);
        return;
      }
      if (!existing.enrollment && user.enrollment) existing.enrollment = user.enrollment;
      return;
    }
    usersMap.set(user.id, user);
    if (emailKey) emailToId.set(emailKey, user.id);
  }

  try {
    const admin = createAdminClient();
    const [{ data: dbUsers }, { data: dbEnrollments }] = await Promise.all([
      admin.from("users").select("id, name, email, role").order("name"),
      admin
        .from("user_face_embeddings")
        .select("id, user_id, created_at")
        .order("created_at", { ascending: false }),
    ]);

    const enrollments = new Map<string, { id: string; created_at: string }>();
    for (const enrollment of dbEnrollments ?? []) {
      if (!enrollments.has(enrollment.user_id)) {
        enrollments.set(enrollment.user_id, { id: enrollment.id, created_at: enrollment.created_at });
      }
    }

    for (const user of dbUsers ?? []) {
      upsert({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        enrollment: enrollments.get(user.id) ?? null,
      }, true);
    }
  } catch {
    // Supabase unavailable; rely on local accounts
  }

  const accounts = await getKnownAccounts();
  for (const acc of accounts) {
    upsert({
      id: acc.id,
      name: acc.name,
      email: acc.email,
      role: acc.role,
      enrollment: null,
    });
  }

  const registry = await readLocalRegistry();
  for (const [userId, item] of Object.entries(registry)) {
    upsert({
      id: userId,
      name: item.name,
      email: item.email,
      role: item.role,
      enrollment: {
        id: `local-${userId}`,
        created_at: item.createdAt,
      },
    });
  }

  // 4. Merge disk files status from Python vision-ai storage config
  try {
    const storageConfig = await callVisionAi("/api/face/storage-config", { method: "GET" }) as {
      users: Array<{ userId: string; imageCount: number; hasEmbeddings: boolean }>;
    };
    if (storageConfig && Array.isArray(storageConfig.users)) {
      for (const diskUser of storageConfig.users) {
        const u = usersMap.get(diskUser.userId);
        if (u) {
          if (!u.enrollment) {
            u.enrollment = {
              id: `disk-${diskUser.userId}`,
              created_at: new Date().toISOString(),
              imageCount: diskUser.imageCount,
              hasLocalFiles: true,
            };
          } else {
            u.enrollment.imageCount = diskUser.imageCount;
            u.enrollment.hasLocalFiles = true;
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return Array.from(usersMap.values());
}
