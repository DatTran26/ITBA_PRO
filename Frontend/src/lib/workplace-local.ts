import path from "node:path";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";

export const VISION_DATA_DIR = path.resolve(process.cwd(), "..", "data", "vision-ai");
const STALE_SESSION_MS = 10 * 60 * 1000;
export const ATTENDANCE_COOLDOWN_MS = 5 * 60 * 1000;
export const VN_TZ = "Asia/Ho_Chi_Minh";
export const WORK_START = "08:30";

export type ViolationStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "false_positive"
  | "justified";

export type LocalViolationAlert = {
  id: string;
  session_id: string | null;
  user_id: string;
  profile_name: string;
  violation_type: string;
  severity: string;
  camera_location: string;
  evidence_relative_path: string | null;
  evidence_url: string | null;
  detected_at: string;
  status: ViolationStatus;
  confidence: number;
  bbox: number[];
  detections_json?: Record<string, unknown>;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  decision_category?: string | null;
};

export type MonitoringSession = {
  id: string;
  camera_id: string;
  camera_location: string;
  operator_id: string;
  operator_name: string;
  started_at: string;
  ended_at: string | null;
  last_heartbeat_at: string;
  monitored_user_ids: string[];
  status: "active" | "completed" | "interrupted";
  stats: { frames_scanned: number; violations_detected: number; alerts_created: number };
};

export type WorkplaceSettings = {
  aiWeights: {
    smokingConfidence: number;
    emptyDeskConfidence: number;
  };
  labels: {
    smoking: string[];
    emptyDesk: string[];
  };
  modelPaths: {
    smoking: string;
    emptyDesk: string;
    faceRecognition: string;
  };
  violationRules: {
    smoking: string;
    emptyDesk: string;
  };
  businessRules: {
    quietHoursStart: string;
    quietHoursEnd: string;
    emptyDeskGraceSeconds: number;
    duplicateCooldownSeconds: number;
  };
  retentionDays: number;
  reviewerRoles: string[];
  updated_at?: string;
  updated_by?: string;
};

export const DEFAULT_WORKPLACE_SETTINGS: WorkplaceSettings = {
  aiWeights: {
    smokingConfidence: 0.7,
    emptyDeskConfidence: 0.65,
  },
  labels: {
    smoking: ["smoke", "cigarette"],
    emptyDesk: ["empty_desk", "away_from_desk", "leaving"],
  },
  modelPaths: {
    smoking: "models/vision-ai/smoking.pt",
    emptyDesk: "models/vision-ai/leaving.pt",
    faceRecognition: "models/vision-ai/arcface.onnx",
  },
  violationRules: {
    smoking: "Create a violation when smoke or cigarette labels exceed the configured confidence threshold.",
    emptyDesk: "Create a violation when the monitored person is absent from their desk beyond the configured threshold.",
  },
  businessRules: {
    quietHoursStart: "18:00",
    quietHoursEnd: "08:00",
    emptyDeskGraceSeconds: 180,
    duplicateCooldownSeconds: 300,
  },
  retentionDays: 90,
  reviewerRoles: ["super_admin", "admin", "leader"],
};

export async function atomicWriteJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(tmp, filePath);
}

async function readJsonArray<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function alertsFile() {
  return path.join(VISION_DATA_DIR, "violation-alerts.json");
}
function sessionsFile() {
  return path.join(VISION_DATA_DIR, "monitoring-sessions.json");
}
function settingsFile() {
  return path.join(VISION_DATA_DIR, "workplace-settings.json");
}

function stringList(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item).trim()).filter(Boolean);
    if (items.length) return items;
  }
  if (typeof value === "string") {
    const items = value.split(",").map((item) => item.trim()).filter(Boolean);
    if (items.length) return items;
  }
  return fallback;
}

function finiteNumber(value: unknown, fallback: number, min: number, max: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

export async function readWorkplaceSettings(): Promise<WorkplaceSettings> {
  try {
    const raw = await fs.readFile(settingsFile(), "utf8");
    const parsed = JSON.parse(raw) as Partial<WorkplaceSettings> & {
      thresholds?: {
        smokingConfidence?: unknown;
        emptyDeskConfidence?: unknown;
        alertCooldownSeconds?: unknown;
      };
    };
    const aiWeights = parsed.aiWeights ?? parsed.thresholds;
    return {
      aiWeights: {
        smokingConfidence: finiteNumber(aiWeights?.smokingConfidence, DEFAULT_WORKPLACE_SETTINGS.aiWeights.smokingConfidence, 0, 1),
        emptyDeskConfidence: finiteNumber(aiWeights?.emptyDeskConfidence, DEFAULT_WORKPLACE_SETTINGS.aiWeights.emptyDeskConfidence, 0, 1),
      },
      labels: {
        smoking: stringList(parsed.labels?.smoking, DEFAULT_WORKPLACE_SETTINGS.labels.smoking),
        emptyDesk: stringList(parsed.labels?.emptyDesk, DEFAULT_WORKPLACE_SETTINGS.labels.emptyDesk),
      },
      modelPaths: {
        smoking: String(parsed.modelPaths?.smoking ?? DEFAULT_WORKPLACE_SETTINGS.modelPaths.smoking),
        emptyDesk: String(parsed.modelPaths?.emptyDesk ?? DEFAULT_WORKPLACE_SETTINGS.modelPaths.emptyDesk),
        faceRecognition: String(parsed.modelPaths?.faceRecognition ?? DEFAULT_WORKPLACE_SETTINGS.modelPaths.faceRecognition),
      },
      violationRules: {
        smoking: String(parsed.violationRules?.smoking ?? DEFAULT_WORKPLACE_SETTINGS.violationRules.smoking),
        emptyDesk: String(parsed.violationRules?.emptyDesk ?? DEFAULT_WORKPLACE_SETTINGS.violationRules.emptyDesk),
      },
      businessRules: {
        quietHoursStart: String(parsed.businessRules?.quietHoursStart ?? DEFAULT_WORKPLACE_SETTINGS.businessRules.quietHoursStart),
        quietHoursEnd: String(parsed.businessRules?.quietHoursEnd ?? DEFAULT_WORKPLACE_SETTINGS.businessRules.quietHoursEnd),
        emptyDeskGraceSeconds: finiteNumber(parsed.businessRules?.emptyDeskGraceSeconds, DEFAULT_WORKPLACE_SETTINGS.businessRules.emptyDeskGraceSeconds, 0, 86400),
        duplicateCooldownSeconds: finiteNumber(parsed.businessRules?.duplicateCooldownSeconds ?? parsed.thresholds?.alertCooldownSeconds, DEFAULT_WORKPLACE_SETTINGS.businessRules.duplicateCooldownSeconds, 0, 86400),
      },
      retentionDays: finiteNumber(parsed.retentionDays, DEFAULT_WORKPLACE_SETTINGS.retentionDays, 1, 3650),
      reviewerRoles: stringList(parsed.reviewerRoles, DEFAULT_WORKPLACE_SETTINGS.reviewerRoles),
      updated_at: parsed.updated_at,
      updated_by: parsed.updated_by,
    };
  } catch {
    return DEFAULT_WORKPLACE_SETTINGS;
  }
}

export async function writeWorkplaceSettings(settings: WorkplaceSettings): Promise<WorkplaceSettings> {
  await atomicWriteJson(settingsFile(), settings);
  return settings;
}

export function vnCalendarDate(iso: string | Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof iso === "string" ? new Date(iso) : iso);
}

export function vnTimeHm(iso: string | Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: VN_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(typeof iso === "string" ? new Date(iso) : iso);
}

export function attendanceStatus(checkInIso: string): "on_time" | "late" {
  return vnTimeHm(checkInIso) <= WORK_START ? "on_time" : "late";
}

export function workDurationMinutes(checkInIso: string, checkOutIso: string): number {
  return Math.max(0, Math.round((new Date(checkOutIso).getTime() - new Date(checkInIso).getTime()) / 60_000));
}

export function relativeEvidencePath(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const resolved = path.resolve(stored);
  const root = path.resolve(VISION_DATA_DIR);
  if (resolved === root || resolved.startsWith(root + path.sep)) {
    return path.relative(root, resolved).split(path.sep).join("/");
  }
  if (!path.isAbsolute(stored) && !stored.includes("..")) {
    return stored.replace(/\\/g, "/").replace(/^\//, "");
  }
  return null;
}

export function evidencePublicUrl(rel: string | null): string | null {
  if (!rel) return null;
  return `/api/behavior/evidence?path=${encodeURIComponent(rel)}`;
}

export function resolveSafeEvidenceFile(rel: string): string | null {
  const cleaned = rel.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!cleaned || cleaned.includes("..")) return null;
  const resolved = path.resolve(VISION_DATA_DIR, cleaned);
  const root = path.resolve(VISION_DATA_DIR);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  const ext = path.extname(resolved).toLowerCase();
  if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return null;
  return resolved;
}

export async function readViolationAlerts(): Promise<LocalViolationAlert[]> {
  const rows = await readJsonArray<LocalViolationAlert>(alertsFile());
  return rows
    .map((row) => {
      const rel = row.evidence_relative_path ?? relativeEvidencePath(row.evidence_url);
      return { ...row, evidence_relative_path: rel, evidence_url: evidencePublicUrl(rel) };
    })
    .sort((a, b) => b.detected_at.localeCompare(a.detected_at));
}

export async function writeViolationAlerts(rows: LocalViolationAlert[]): Promise<void> {
  await atomicWriteJson(alertsFile(), rows);
}

export async function appendViolationAlerts(rows: LocalViolationAlert[]): Promise<LocalViolationAlert[]> {
  const existing = await readViolationAlerts();
  const next = [...rows, ...existing];
  await writeViolationAlerts(next);
  return rows;
}

export async function updateViolationAlert(
  id: string,
  patch: Partial<LocalViolationAlert>,
  onlyPending = true
): Promise<LocalViolationAlert | null> {
  const rows = await readViolationAlerts();
  const idx = rows.findIndex((row) => row.id === id);
  if (idx === -1) return null;
  if (onlyPending && rows[idx].status !== "pending_review") return null;
  rows[idx] = { ...rows[idx], ...patch };
  await writeViolationAlerts(rows);
  return rows[idx];
}

export async function readMonitoringSessions(): Promise<MonitoringSession[]> {
  const rows = await readJsonArray<MonitoringSession>(sessionsFile());
  const now = Date.now();
  let dirty = false;
  for (const row of rows) {
    if (row.status === "active") {
      const beat = new Date(row.last_heartbeat_at || row.started_at).getTime();
      if (now - beat > STALE_SESSION_MS) {
        row.status = "interrupted";
        row.ended_at = new Date().toISOString();
        dirty = true;
      }
    }
  }
  if (dirty) await atomicWriteJson(sessionsFile(), rows);
  return rows;
}

export async function writeMonitoringSessions(rows: MonitoringSession[]): Promise<void> {
  await atomicWriteJson(sessionsFile(), rows);
}

export async function getActiveMonitoringSession(cameraId?: string): Promise<MonitoringSession | null> {
  const rows = await readMonitoringSessions();
  return rows.find((row) => row.status === "active" && (!cameraId || row.camera_id === cameraId)) ?? null;
}

export async function startMonitoringSession(input: {
  operator_id: string;
  operator_name: string;
  camera_id?: string;
  camera_location?: string;
  monitored_user_ids?: string[];
}): Promise<MonitoringSession> {
  const rows = await readMonitoringSessions();
  const now = new Date().toISOString();
  const cameraId = input.camera_id ?? "cam-0";
  for (const row of rows) {
    if (row.status === "active" && row.camera_id === cameraId) {
      row.status = "interrupted";
      row.ended_at = now;
    }
  }
  const session: MonitoringSession = {
    id: `sess_${Date.now()}_${randomUUID().slice(0, 8)}`,
    camera_id: cameraId,
    camera_location: input.camera_location ?? "Workplace monitor",
    operator_id: input.operator_id,
    operator_name: input.operator_name,
    started_at: now,
    ended_at: null,
    last_heartbeat_at: now,
    monitored_user_ids: input.monitored_user_ids ?? [],
    status: "active",
    stats: { frames_scanned: 0, violations_detected: 0, alerts_created: 0 },
  };
  rows.unshift(session);
  await writeMonitoringSessions(rows);
  return session;
}

export async function stopMonitoringSession(cameraId?: string): Promise<MonitoringSession | null> {
  const rows = await readMonitoringSessions();
  const active = rows.find((row) => row.status === "active" && (!cameraId || row.camera_id === cameraId));
  if (!active) return null;
  const now = new Date().toISOString();
  active.status = "completed";
  active.ended_at = now;
  active.last_heartbeat_at = now;
  await writeMonitoringSessions(rows);
  return active;
}

export async function heartbeatMonitoringSession(
  stats?: Partial<MonitoringSession["stats"]>,
  cameraId?: string,
): Promise<MonitoringSession | null> {
  const rows = await readMonitoringSessions();
  const active = rows.find((row) => row.status === "active" && (!cameraId || row.camera_id === cameraId));
  if (!active) return null;
  active.last_heartbeat_at = new Date().toISOString();
  if (stats) {
    active.stats = { ...active.stats, ...stats };
  }
  await writeMonitoringSessions(rows);
  return active;
}

export async function bumpActiveSessionStats(delta: { frames?: number; violations?: number; alerts?: number }, cameraId?: string): Promise<void> {
  const rows = await readMonitoringSessions();
  const active = rows.find((row) => row.status === "active" && (!cameraId || row.camera_id === cameraId));
  if (!active) return;
  active.last_heartbeat_at = new Date().toISOString();
  active.stats.frames_scanned += delta.frames ?? 0;
  active.stats.violations_detected += delta.violations ?? 0;
  active.stats.alerts_created += delta.alerts ?? 0;
  await writeMonitoringSessions(rows);
}

export type LocalAttendanceSession = {
  id: string;
  user_id: string;
  date: string;
  check_in_at: string;
  check_out_at: string | null;
  check_in_similarity: number;
  check_out_similarity: number | null;
  work_duration_minutes: number | null;
  status: "on_time" | "late" | "open";
  last_action_at: string;
  kiosk_id?: string | null;
  direction?: "in" | "out";
  users?: { name?: string; email?: string } | null;
};

function attendanceFile() {
  return path.join(VISION_DATA_DIR, "attendance-sessions.json");
}

export async function readLocalAttendance(): Promise<LocalAttendanceSession[]> {
  return readJsonArray<LocalAttendanceSession>(attendanceFile());
}

export async function writeLocalAttendance(sessions: LocalAttendanceSession[]): Promise<void> {
  await atomicWriteJson(attendanceFile(), sessions);
}

export function attendanceCooldownWaitMs(sessions: LocalAttendanceSession[], userId: string): number {
  let latest = 0;
  for (const session of sessions.filter((row) => row.user_id === userId)) {
    latest = Math.max(latest, new Date(session.check_in_at).getTime());
    if (session.check_out_at) latest = Math.max(latest, new Date(session.check_out_at).getTime());
    if (session.last_action_at) latest = Math.max(latest, new Date(session.last_action_at).getTime());
  }
  if (!latest) return 0;
  return Math.max(0, ATTENDANCE_COOLDOWN_MS - (Date.now() - latest));
}

export async function punchLocalAttendance(input: {
  userId: string;
  name?: string;
  email?: string;
  similarity: number;
  direction: "in" | "out" | "auto";
  kioskId?: string;
}): Promise<
  | { ok: true; session: LocalAttendanceSession; direction: "in" | "out" }
  | { ok: false; status: number; error: string }
> {
  const sessions = await readLocalAttendance();
  const wait = attendanceCooldownWaitMs(sessions, input.userId);
  if (wait > 0) {
    const minutes = Math.max(1, Math.ceil(wait / 60_000));
    return {
      ok: false,
      status: 429,
      error: `Wait ${minutes} minute${minutes === 1 ? "" : "s"} before the next check-in or check-out`,
    };
  }
  const now = new Date().toISOString();
  const openIdx = sessions.findIndex((row) => row.user_id === input.userId && !row.check_out_at);
  const direction: "in" | "out" =
    input.direction === "auto" ? (openIdx === -1 ? "in" : "out") : input.direction;

  if (direction === "in") {
    if (openIdx !== -1) return { ok: false, status: 409, error: "You already have an active attendance session" };
    const session: LocalAttendanceSession = {
      id: `att-${Date.now()}`,
      user_id: input.userId,
      date: vnCalendarDate(now),
      check_in_at: now,
      check_out_at: null,
      check_in_similarity: input.similarity,
      check_out_similarity: null,
      work_duration_minutes: null,
      status: attendanceStatus(now),
      last_action_at: now,
      kiosk_id: input.kioskId ?? null,
      direction: "in",
      users: { name: input.name ?? input.userId, email: input.email ?? "" },
    };
    sessions.unshift(session);
    await writeLocalAttendance(sessions);
    return { ok: true, session, direction };
  }

  if (openIdx === -1) return { ok: false, status: 409, error: "Check in before checking out" };
  const open = sessions[openIdx];
  open.check_out_at = now;
  open.check_out_similarity = input.similarity;
  open.work_duration_minutes = workDurationMinutes(open.check_in_at, now);
  open.status = attendanceStatus(open.check_in_at);
  open.date = vnCalendarDate(open.check_in_at);
  open.last_action_at = now;
  open.kiosk_id = input.kioskId ?? open.kiosk_id ?? null;
  open.direction = "out";
  await writeLocalAttendance(sessions);
  return { ok: true, session: open, direction };
}
