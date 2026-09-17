import path from "node:path";
import { promises as fs } from "node:fs";
import { createAdminClient } from "@/lib/supabase/admin";
import { callVisionAi } from "@/lib/vision-ai";
import { DEV_AUTH_USER } from "@/lib/dev-auth";

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
}

function getRegistryFilePath(): string {
  return path.resolve(process.cwd(), "..", "data", "vision-ai", "faces-registry.json");
}

function getAccountsFilePath(): string {
  return (
    process.env.DEV_LOGIN_ACCOUNTS_FILE ??
    path.resolve(process.cwd(), "..", "..", "ITBA_Accounts.txt")
  );
}

async function readLocalRegistry(): Promise<Record<string, LocalFaceRegistryItem>> {
  try {
    const raw = await fs.readFile(getRegistryFilePath(), "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeLocalRegistry(registry: Record<string, LocalFaceRegistryItem>): Promise<void> {
  const filePath = getRegistryFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(registry, null, 2), "utf8");
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
  };
  await writeLocalRegistry(registry);

  // 2. Attempt Supabase save if configured
  try {
    const admin = createAdminClient();
    await admin.from("user_face_embeddings").delete().eq("user_id", user.id);
    await admin.from("user_face_embeddings").insert({
      user_id: user.id,
      embedding_json: embeddings,
    });
  } catch {
    // Supabase server role key not configured in local environment; local file storage is active
  }
}

export async function getFaceEnrollment(
  userId: string
): Promise<{ id: string; created_at: string; embeddings?: number[][] } | null> {
  // 1. Check Supabase
  try {
    const admin = createAdminClient();
    const { data: enrollment } = await admin
      .from("user_face_embeddings")
      .select("id, created_at, embedding_json")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (enrollment && Array.isArray(enrollment.embedding_json)) {
      return {
        id: enrollment.id,
        created_at: enrollment.created_at,
        embeddings: enrollment.embedding_json,
      };
    }
  } catch {
    // Supabase not available
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

export async function getAllFaceUsers(): Promise<FaceUserRecord[]> {
  const usersMap = new Map<string, FaceUserRecord>();

  // 1. Load known local accounts
  const accounts = await getKnownAccounts();
  for (const acc of accounts) {
    usersMap.set(acc.id, {
      id: acc.id,
      name: acc.name,
      email: acc.email,
      role: acc.role,
      enrollment: null,
    });
  }

  // 2. Load Supabase users and enrollments if available
  try {
    const admin = createAdminClient();
    const [{ data: dbUsers }, { data: dbEnrollments }] = await Promise.all([
      admin.from("users").select("id, name, email, role").order("name"),
      admin
        .from("user_face_embeddings")
        .select("id, user_id, created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (dbUsers) {
      for (const u of dbUsers) {
        usersMap.set(u.id, {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          enrollment: null,
        });
      }
    }

    if (dbEnrollments) {
      for (const e of dbEnrollments) {
        const u = usersMap.get(e.user_id);
        if (u) {
          u.enrollment = { id: e.id, created_at: e.created_at };
        }
      }
    }
  } catch {
    // Supabase unavailable; rely on local accounts
  }

  // 3. Merge local registry
  const registry = await readLocalRegistry();
  for (const [userId, item] of Object.entries(registry)) {
    let u = usersMap.get(userId);
    if (!u) {
      u = {
        id: userId,
        name: item.name,
        email: item.email,
        role: item.role,
        enrollment: null,
      };
      usersMap.set(userId, u);
    }
    if (!u.enrollment) {
      u.enrollment = {
        id: `local-${userId}`,
        created_at: item.createdAt,
      };
    }
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
