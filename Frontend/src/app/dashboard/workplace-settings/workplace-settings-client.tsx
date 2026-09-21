"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Cloud, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import AppNavbar from "@/components/ui/app-navbar";
import WorkplacePageHeader from "@/components/ui/workplace-page-header";
import PageContainer from "@/components/ui/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { readApiResponse } from "@/lib/api-response";

type WorkplaceSettings = {
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

const DEFAULT_SETTINGS: WorkplaceSettings = {
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

function listText(items: string[]) {
  return items.join(", ");
}

function parseList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="text-xs font-medium uppercase tracking-[0.08em] text-[#8B99B0]">{children}</label>;
}

export default function WorkplaceSettingsClient() {
  const [settings, setSettings] = useState<WorkplaceSettings>(DEFAULT_SETTINGS);
  const [canEditAiWeights, setCanEditAiWeights] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncHint, setSyncHint] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/behavior/settings", { cache: "no-store" });
      const data = await readApiResponse<{ error?: string; settings?: WorkplaceSettings; canEditAiWeights?: boolean }>(response);
      if (!response.ok) throw new Error(data.error ?? "Unable to load workplace settings");
      setSettings(data.settings ?? DEFAULT_SETTINGS);
      setCanEditAiWeights(data.canEditAiWeights === true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load workplace settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function syncCloud() {
    setSyncing(true);
    try {
      const response = await fetch("/api/workplace/sync", { method: "POST" });
      const data = await readApiResponse<{ synced?: boolean; reason?: string; error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Sync failed");
      if (data.synced) {
        setSyncHint("Synced to Superbase");
        toast.success("Synced to Superbase");
      } else {
        const reason = data.reason === "offline_mode" ? "Offline mode — Superbase keys are not configured" : (data.reason ?? "Not synced");
        setSyncHint(reason);
        toast.message(reason);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/behavior/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = await readApiResponse<{ error?: string; settings?: WorkplaceSettings; canEditAiWeights?: boolean }>(response);
      if (!response.ok) throw new Error(data.error ?? "Unable to save workplace settings");
      setSettings(data.settings ?? settings);
      setCanEditAiWeights(data.canEditAiWeights === true);
      toast.success("Workplace settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save workplace settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#121A2E] text-[#ECF0F7]">
      <AppNavbar />
      <PageContainer>
        <WorkplacePageHeader
          title="Settings"
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Workplace Settings" }]}
          actions={
            <>
            {syncHint && <Badge variant="outline">{syncHint}</Badge>}
            {settings.updated_at && (
              <Badge variant="outline">Updated {new Date(settings.updated_at).toLocaleString()}</Badge>
            )}
            <Button variant="outline" onClick={() => void syncCloud()} disabled={syncing}>
              {syncing ? <Loader2 className="animate-spin" /> : <Cloud />}Sync Superbase
            </Button>
            <Button variant="outline" onClick={() => setSettings(DEFAULT_SETTINGS)} disabled={saving}>
              <RotateCcw />Defaults
            </Button>
            <Button onClick={save} disabled={saving || loading}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}Save
            </Button>
            </>
          }
        />

        <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          {canEditAiWeights && (
            <Card className="rounded-lg bg-[#10192B]/80">
              <CardHeader><CardTitle>AI Weights</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel>Smoking confidence</FieldLabel>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.aiWeights.smokingConfidence}
                    onChange={(event) => setSettings((current) => ({
                      ...current,
                      aiWeights: { ...current.aiWeights, smokingConfidence: Number(event.target.value) },
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel>Away confidence</FieldLabel>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.aiWeights.emptyDeskConfidence}
                    onChange={(event) => setSettings((current) => ({
                      ...current,
                      aiWeights: { ...current.aiWeights, emptyDeskConfidence: Number(event.target.value) },
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader><CardTitle>Retention & Review</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <FieldLabel>Retention days</FieldLabel>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={settings.retentionDays}
                  onChange={(event) => setSettings((current) => ({ ...current, retentionDays: Number(event.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel>Who can review</FieldLabel>
                <Input
                  value={listText(settings.reviewerRoles)}
                  onChange={(event) => setSettings((current) => ({ ...current, reviewerRoles: parseList(event.target.value) }))}
                  placeholder="super_admin, admin, leader"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader><CardTitle>Operational Rules</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel>Quiet hours start</FieldLabel>
                <Input
                  type="time"
                  value={settings.businessRules.quietHoursStart}
                  onChange={(event) => setSettings((current) => ({
                    ...current,
                    businessRules: { ...current.businessRules, quietHoursStart: event.target.value },
                  }))}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel>Quiet hours end</FieldLabel>
                <Input
                  type="time"
                  value={settings.businessRules.quietHoursEnd}
                  onChange={(event) => setSettings((current) => ({
                    ...current,
                    businessRules: { ...current.businessRules, quietHoursEnd: event.target.value },
                  }))}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel>Empty-desk grace seconds</FieldLabel>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={settings.businessRules.emptyDeskGraceSeconds}
                  onChange={(event) => setSettings((current) => ({
                    ...current,
                    businessRules: { ...current.businessRules, emptyDeskGraceSeconds: Number(event.target.value) },
                  }))}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel>Duplicate cooldown seconds</FieldLabel>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={settings.businessRules.duplicateCooldownSeconds}
                  onChange={(event) => setSettings((current) => ({
                    ...current,
                    businessRules: { ...current.businessRules, duplicateCooldownSeconds: Number(event.target.value) },
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader><CardTitle>{canEditAiWeights ? "Labels & Violation Rules" : "Violation Rules"}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                {canEditAiWeights && (
                  <>
                    <FieldLabel>Smoking labels</FieldLabel>
                    <Input
                      value={listText(settings.labels.smoking)}
                      onChange={(event) => setSettings((current) => ({
                        ...current,
                        labels: { ...current.labels, smoking: parseList(event.target.value) },
                      }))}
                    />
                  </>
                )}
                <FieldLabel>Smoking rule</FieldLabel>
                <Textarea
                  value={settings.violationRules.smoking}
                  onChange={(event) => setSettings((current) => ({
                    ...current,
                    violationRules: { ...current.violationRules, smoking: event.target.value },
                  }))}
                  className="min-h-28"
                />
              </div>
              <div className="space-y-2">
                {canEditAiWeights && (
                  <>
                    <FieldLabel>Away-from-desk labels</FieldLabel>
                    <Input
                      value={listText(settings.labels.emptyDesk)}
                      onChange={(event) => setSettings((current) => ({
                        ...current,
                        labels: { ...current.labels, emptyDesk: parseList(event.target.value) },
                      }))}
                    />
                  </>
                )}
                <FieldLabel>Away-from-desk rule</FieldLabel>
                <Textarea
                  value={settings.violationRules.emptyDesk}
                  onChange={(event) => setSettings((current) => ({
                    ...current,
                    violationRules: { ...current.violationRules, emptyDesk: event.target.value },
                  }))}
                  className="min-h-28"
                />
              </div>
            </CardContent>
          </Card>

          {canEditAiWeights && <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader><CardTitle>Model Paths</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <FieldLabel>Smoking model</FieldLabel>
                <Input
                  value={settings.modelPaths.smoking}
                  onChange={(event) => setSettings((current) => ({
                    ...current,
                    modelPaths: { ...current.modelPaths, smoking: event.target.value },
                  }))}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel>Away-from-desk model</FieldLabel>
                <Input
                  value={settings.modelPaths.emptyDesk}
                  onChange={(event) => setSettings((current) => ({
                    ...current,
                    modelPaths: { ...current.modelPaths, emptyDesk: event.target.value },
                  }))}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel>Face recognition model</FieldLabel>
                <Input
                  value={settings.modelPaths.faceRecognition}
                  onChange={(event) => setSettings((current) => ({
                    ...current,
                    modelPaths: { ...current.modelPaths, faceRecognition: event.target.value },
                  }))}
                />
              </div>
            </CardContent>
          </Card>}
        </div>
      </PageContainer>
    </div>
  );
}
