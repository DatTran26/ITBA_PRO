"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, RefreshCw, ScanLine, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Alert = { id: string; violation_type: string; severity: string; camera_location: string; status: "pending_review" | "approved" | "rejected"; detected_at: string; detections_json?: { confidence?: number } };

export default function BehaviorClient() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [location, setLocation] = useState("Manual upload");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { const response = await fetch("/api/behavior", { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setAlerts(data.alerts); }, []);
  useEffect(() => { load().catch((error) => toast.error(error.message)); const timer = window.setInterval(() => load().catch(() => undefined), 5000); return () => window.clearInterval(timer); }, [load]);

  async function scan() {
    if (!image) return; setBusy(true); const body = new FormData(); body.append("image", image); body.append("cameraLocation", location);
    try { const response = await fetch("/api/behavior", { method: "POST", body }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Scan failed"); toast.success(data.alerts.length ? `${data.alerts.length} alert(s) queued for review` : "No target behavior detected"); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Scan failed"); } finally { setBusy(false); }
  }

  async function review(id: string, decision: "approved" | "rejected") {
    const response = await fetch(`/api/behavior/${id}/review`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision }) });
    const data = await response.json(); if (!response.ok) return toast.error(data.error ?? "Review failed"); toast.success(`Alert ${decision}`); await load();
  }

  return <div className="min-h-screen bg-[#121A2E] text-[#ECF0F7]"><AppNavbar /><PageContainer>
    <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Behavior Review" }]} />
    <div className="mb-8 flex items-end justify-between"><div><h1 className="font-display text-4xl font-light">Behavior Review</h1><p className="mt-2 text-sm text-[#8B99B0]">Smoking and empty-desk detections always require human review.</p></div><Button variant="outline" size="icon" title="Refresh" onClick={() => load()}><RefreshCw /></Button></div>
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <Card className="rounded-lg bg-[#10192B]/80"><CardHeader><CardTitle className="flex items-center gap-2"><ScanLine className="size-4" />Scan frame</CardTitle><CardDescription>Upload one camera frame for YOLO inference.</CardDescription></CardHeader><CardContent className="space-y-3"><Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Camera location" /><Input type="file" accept="image/png,image/jpeg,image/webp" capture="environment" onChange={(event) => setImage(event.target.files?.[0] ?? null)} /><Button className="w-full" disabled={!image || busy} onClick={scan}><ShieldAlert />Run scan</Button></CardContent></Card>
      <Card className="rounded-lg bg-[#10192B]/80"><CardHeader><CardTitle>Review queue</CardTitle><CardDescription>Polled every five seconds. AI does not apply discipline automatically.</CardDescription></CardHeader><CardContent className="space-y-2">{alerts.length === 0 && <p className="text-sm text-[#8B99B0]">No alerts.</p>}{alerts.map((alert) => <div key={alert.id} className="flex flex-col gap-3 border-b border-white/10 py-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="font-medium">{alert.violation_type.replace("_", " ")}</p><Badge variant={alert.status === "pending_review" ? "default" : "outline"}>{alert.status}</Badge></div><p className="mt-1 text-xs text-[#8B99B0]">{alert.camera_location} · {new Date(alert.detected_at).toLocaleString()} · {alert.detections_json?.confidence ? `${(alert.detections_json.confidence * 100).toFixed(1)}%` : alert.severity}</p></div>{alert.status === "pending_review" && <div className="flex gap-2"><Button size="sm" onClick={() => review(alert.id, "approved")}><Check />Approve</Button><Button size="sm" variant="destructive" onClick={() => review(alert.id, "rejected")}><X />Reject</Button></div>}</div>)}</CardContent></Card>
    </div>
  </PageContainer></div>;
}
