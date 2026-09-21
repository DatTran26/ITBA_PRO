import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { canManageVision } from "@/lib/vision-ai";
import {
  DEFAULT_WORKPLACE_SETTINGS,
  readWorkplaceSettings,
  writeWorkplaceSettings,
  type WorkplaceSettings,
} from "@/lib/workplace-local";

export const runtime = "nodejs";

function asStringList(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) {
    const next = value.map((item) => String(item).trim()).filter(Boolean);
    if (next.length) return next;
  }
  if (typeof value === "string") {
    const next = value.split(",").map((item) => item.trim()).filter(Boolean);
    if (next.length) return next;
  }
  return fallback;
}

function asNumber(value: unknown, fallback: number, min: number, max: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function normalizeSettings(input: Partial<WorkplaceSettings>, userId: string): WorkplaceSettings {
  const base = DEFAULT_WORKPLACE_SETTINGS;
  return {
    aiWeights: {
      smokingConfidence: asNumber(input.aiWeights?.smokingConfidence, base.aiWeights.smokingConfidence, 0, 1),
      emptyDeskConfidence: asNumber(input.aiWeights?.emptyDeskConfidence, base.aiWeights.emptyDeskConfidence, 0, 1),
    },
    labels: {
      smoking: asStringList(input.labels?.smoking, base.labels.smoking),
      emptyDesk: asStringList(input.labels?.emptyDesk, base.labels.emptyDesk),
    },
    modelPaths: {
      smoking: String(input.modelPaths?.smoking ?? base.modelPaths.smoking).trim(),
      emptyDesk: String(input.modelPaths?.emptyDesk ?? base.modelPaths.emptyDesk).trim(),
      faceRecognition: String(input.modelPaths?.faceRecognition ?? base.modelPaths.faceRecognition).trim(),
    },
    violationRules: {
      smoking: String(input.violationRules?.smoking ?? base.violationRules.smoking).trim(),
      emptyDesk: String(input.violationRules?.emptyDesk ?? base.violationRules.emptyDesk).trim(),
    },
    businessRules: {
      quietHoursStart: String(input.businessRules?.quietHoursStart ?? base.businessRules.quietHoursStart).trim(),
      quietHoursEnd: String(input.businessRules?.quietHoursEnd ?? base.businessRules.quietHoursEnd).trim(),
      emptyDeskGraceSeconds: asNumber(input.businessRules?.emptyDeskGraceSeconds, base.businessRules.emptyDeskGraceSeconds, 0, 86400),
      duplicateCooldownSeconds: asNumber(input.businessRules?.duplicateCooldownSeconds, base.businessRules.duplicateCooldownSeconds, 0, 86400),
    },
    retentionDays: asNumber(input.retentionDays, base.retentionDays, 1, 3650),
    reviewerRoles: asStringList(input.reviewerRoles, base.reviewerRoles),
    updated_at: new Date().toISOString(),
    updated_by: userId,
  };
}

function responseSettings(settings: WorkplaceSettings, canEditAiWeights: boolean): WorkplaceSettings {
  if (canEditAiWeights) return settings;
  return {
    ...settings,
    aiWeights: DEFAULT_WORKPLACE_SETTINGS.aiWeights,
    modelPaths: {
      smoking: "",
      emptyDesk: "",
      faceRecognition: "",
    },
    labels: DEFAULT_WORKPLACE_SETTINGS.labels,
  };
}

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canManageVision(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings = await readWorkplaceSettings();
  return NextResponse.json({ settings: responseSettings(settings, ctx.isSuperAdmin), canEditAiWeights: ctx.isSuperAdmin });
}

export async function PUT(request: Request) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!canManageVision(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const current = await readWorkplaceSettings();
  const incoming = normalizeSettings(body.settings ?? body, ctx.userId);
  const settings = ctx.isSuperAdmin
    ? incoming
    : {
      ...incoming,
      aiWeights: current.aiWeights,
      modelPaths: current.modelPaths,
      labels: current.labels,
    };
  await writeWorkplaceSettings(settings);
  return NextResponse.json({ settings: responseSettings(settings, ctx.isSuperAdmin), canEditAiWeights: ctx.isSuperAdmin });
}
