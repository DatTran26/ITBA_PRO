"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, Download, Loader2, MessageSquare, Pause, Play, RefreshCw, ShieldAlert, Square, X } from "lucide-react";
import { toast } from "sonner";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { readApiResponse } from "@/lib/api-response";

type Alert = {
  id: string;
  violation_type: string;
  severity: string;
  camera_location: string;
  status: "pending_review" | "approved" | "rejected" | "false_positive" | "justified";
  detected_at: string;
  evidence_url?: string | null;
  session_id?: string | null;
  detections_json?: { confidence?: number; label?: string; bbox?: number[]; userId?: string; profileName?: string };
  reviewed_by?: string | null;
  review_note?: string | null;
  reviewed_at?: string | null;
  decision_category?: string | null;
};

type ReviewDecision = "approved" | "rejected" | "false_positive" | "justified";
type ReviewReason = "policy_violation" | "no_violation" | "authorized_exception" | "camera_error" | "model_error" | "other";

type MonitorSession = {
  id: string;
  status: string;
  started_at: string;
  camera_location: string;
  stats?: { frames_scanned: number; violations_detected: number; alerts_created: number };
};

type Detection = { label: string; confidence: number; bbox: number[]; isViolation: boolean };
type Overlay = { detections: Detection[]; width: number; height: number };
type Profile = { id: string; name: string; email: string };
type MonitorProps = {
  title: string;
  defaultModelPath: string;
  defaultCameraIndex: number;
  devices: MediaDeviceInfo[];
  profiles: Profile[];
  onAlertsSaved: () => Promise<void>;
};

function MonitorPanel({ title, defaultModelPath, defaultCameraIndex, devices, profiles, onAlertsSaved }: MonitorProps) {
  const [sourceType, setSourceType] = useState<"camera" | "video">("camera");
  const [deviceId, setDeviceId] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [modelPath, setModelPath] = useState(defaultModelPath);
  const [userId, setUserId] = useState("");
  useEffect(() => {
    if (defaultModelPath) setModelPath(defaultModelPath);
  }, [defaultModelPath]);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);
  const videoUrlRef = useRef<string | null>(null);
  const lastNoticeRef = useRef(0);
  const cameraId = sourceType === "camera" ? `cam-${Math.max(0, devices.findIndex((item) => item.deviceId === deviceId))}` : `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-video`;

  const addLog = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setLogs((current) => [`${time}  ${message}`, ...current].slice(0, 24));
  }, []);

  const haltMedia = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setRunning(false);
    setPaused(false);
    setOverlay(null);
  }, []);

  const stop = useCallback(() => {
    haltMedia();
    void fetch("/api/behavior/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop", camera_id: cameraId }),
    }).catch(() => undefined);
  }, [cameraId, haltMedia]);

  useEffect(() => () => {
    stop();
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
  }, [stop]);

  useEffect(() => {
    if (!deviceId && devices.length > defaultCameraIndex) {
      setDeviceId(devices[defaultCameraIndex].deviceId);
    }
  }, [defaultCameraIndex, deviceId, devices]);

  useEffect(() => {
    if (!userId && profiles.length) setUserId(profiles[0].id);
  }, [profiles, userId]);

  function selectVideo(file: File | null) {
    stop();
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    const nextUrl = file ? URL.createObjectURL(file) : null;
    videoUrlRef.current = nextUrl;
    setVideoUrl(nextUrl);
  }

  async function start() {
    haltMedia();
    if (!userId) return toast.error(`${title}: select a monitored profile`);
    const video = videoRef.current;
    if (!video) return;
    try {
      if (sourceType === "camera") {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
          audio: false,
        });
        streamRef.current = stream;
        video.srcObject = stream;
      } else {
        if (!videoUrl) return toast.error(`${title}: select a video first`);
        video.srcObject = null;
        video.src = videoUrl;
      }
      await video.play();
      await fetch("/api/behavior/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          camera_id: cameraId,
          camera_location: `${title} / ${sourceType === "camera" ? cameraId : "Video file"}`,
          monitored_user_ids: [userId],
        }),
      }).catch(() => undefined);
      setRunning(true);
      setPaused(false);
      addLog(`Started ${sourceType === "camera" ? "camera" : "video"}`);
    } catch {
      addLog("Unable to start source");
      toast.error(`${title}: unable to start the selected source`);
    }
  }

  function togglePause() {
    const video = videoRef.current;
    if (!video || !running) return;
    if (paused) void video.play();
    else video.pause();
    setPaused((value) => !value);
    addLog(paused ? "Resumed" : "Paused");
  }

  const scanFrame = useCallback(async (quiet = true) => {
    if (busyRef.current || paused) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;

    busyRef.current = true;
    setBusy(true);
    const scale = Math.min(1, 640 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.75));
    if (!blob) {
      busyRef.current = false;
      setBusy(false);
      return;
    }

    const body = new FormData();
    body.append("image", new File([blob], "monitor-frame.jpg", { type: "image/jpeg" }));
    body.append("cameraId", cameraId);
    body.append("cameraLocation", `${title} / ${sourceType === "camera" ? cameraId : "Video file"}`);
    body.append("modelPath", modelPath);
    const profile = profiles.find((item) => item.id === userId);
    if (!profile) {
      busyRef.current = false;
      setBusy(false);
      return;
    }
    body.append("userId", profile.id);
    body.append("profileName", profile.name);

    const requestStarted = performance.now();
    try {
      const response = await fetch("/api/behavior", { method: "POST", body });
      const data = await readApiResponse<{ error?: string; warning?: string; detections: Detection[]; alerts: Alert[]; processingMs?: number }>(response);
      if (!response.ok) throw new Error(data.error ?? "Behavior scan failed");
      const detections = data.detections ?? [];
      const violations = detections.filter((detection) => detection.isViolation);
      setOverlay({ detections, width: canvas.width, height: canvas.height });
      const labels = detections.map((detection) => `${detection.label} ${(detection.confidence * 100).toFixed(0)}%`).join(", ");
      addLog(`${detections.length} boxes · API ${Math.round(performance.now() - requestStarted)}ms · AI ${Math.round(data.processingMs ?? 0)}ms${labels ? ` · ${labels}` : ""}`);
      if (data.alerts?.length) await onAlertsSaved();
      void fetch("/api/behavior/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "heartbeat", camera_id: cameraId }),
      }).catch(() => undefined);
      if (violations.length && Date.now() - lastNoticeRef.current > 10_000) {
        lastNoticeRef.current = Date.now();
        toast.warning(data.warning ?? `${title}: ${violations.length} violation detection${violations.length === 1 ? "" : "s"}`);
      } else if (!quiet && !violations.length) {
        toast.success(`${title}: no violation detected`);
      }
    } catch (error) {
      addLog(`Error · ${error instanceof Error ? error.message : "Behavior scan failed"}`);
      if (!quiet) toast.error(error instanceof Error ? error.message : "Behavior scan failed");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [addLog, cameraId, modelPath, onAlertsSaved, paused, profiles, sourceType, title, userId]);

  useEffect(() => {
    if (!running || paused) return;
    const firstScan = window.setTimeout(() => void scanFrame(false), 250);
    const timer = window.setInterval(() => void scanFrame(true), 1000);
    return () => {
      window.clearTimeout(firstScan);
      window.clearInterval(timer);
    };
  }, [paused, running, scanFrame]);

  return (
    <Card className="rounded-lg bg-[#10192B]/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <span className="flex items-center gap-2"><Camera className="size-4" />{title}</span>
          <Badge variant={running && !paused ? "default" : "outline"}>{running && !paused ? "Live" : paused ? "Paused" : "Stopped"}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
          <video ref={videoRef} autoPlay muted playsInline loop className="h-full w-full object-contain" />
          {overlay && running && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${overlay.width} ${overlay.height}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              {overlay.detections.map((detection, index) => {
                const [x1, y1, x2, y2] = detection.bbox;
                const color = detection.isViolation
                  ? detection.label.toLowerCase().includes("smoke") || detection.label.toLowerCase().includes("cigarette") ? "#F87171" : "#FBBF24"
                  : "#36DDAB";
                return (
                  <g key={`${detection.label}-${index}`}>
                    <rect x={x1} y={y1} width={Math.max(0, x2 - x1)} height={Math.max(0, y2 - y1)} fill="none" stroke={color} strokeWidth="4" />
                    <text x={x1 + 4} y={Math.max(20, y1 - 8)} fill={color} stroke="#0B1220" strokeWidth="4" paintOrder="stroke" fontSize="18" fontWeight="700">
                      {detection.label} {(detection.confidence * 100).toFixed(0)}%
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <select className="h-9 w-full rounded-lg border border-white/10 bg-[#0B1220] px-3 text-sm" value={userId} onChange={(event) => { stop(); setUserId(event.target.value); }} aria-label={`${title} monitored profile`}>
          <option value="">Select monitored profile</option>
          {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} ({profile.email})</option>)}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <select className="h-9 rounded-lg border border-white/10 bg-[#0B1220] px-3 text-sm" value={sourceType} onChange={(event) => { stop(); setSourceType(event.target.value as "camera" | "video"); }}>
            <option value="camera">Camera</option>
            <option value="video">Video file</option>
          </select>
          {sourceType === "camera" ? (
            <select className="h-9 rounded-lg border border-white/10 bg-[#0B1220] px-3 text-sm" value={deviceId} onChange={(event) => { stop(); setDeviceId(event.target.value); }} aria-label={`${title} camera index`}>
              {devices.length === 0 && <option value="">Camera 0</option>}
              {devices.map((device, index) => <option key={device.deviceId} value={device.deviceId}>Camera {index}{device.label ? ` - ${device.label}` : ""}</option>)}
            </select>
          ) : (
            <Input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => selectVideo(event.target.files?.[0] ?? null)} />
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-[#8B99B0] px-3 py-2 rounded-lg bg-[#0B1220] border border-white/5 font-mono">
          <span className="flex items-center gap-1.5 text-xs text-[#7C8FFF]">
            <ShieldAlert className="size-3.5 text-[#5B6CF0]" />
            Model AI:
          </span>
          <span className="truncate max-w-[260px] text-white text-[11px]" title={modelPath}>
            {modelPath ? modelPath.split(/[/\\]/).pop() || modelPath : "From Controller"}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Button className="col-span-2" disabled={running || !userId || !modelPath || (sourceType === "video" && !videoUrl)} onClick={start}><Play />Start</Button>
          <Button variant="outline" size="icon" title={paused ? "Resume" : "Pause"} disabled={!running} onClick={togglePause}><Pause /></Button>
          <Button variant="destructive" size="icon" title="Stop" disabled={!running} onClick={stop}><Square /></Button>
        </div>
        <Button className="w-full" variant="secondary" disabled={!running || paused || busy} onClick={() => scanFrame(false)}>
          {busy ? <Loader2 className="animate-spin" /> : <ShieldAlert />}Scan Now
        </Button>
        <div className="h-28 overflow-y-auto rounded-lg border border-white/10 bg-[#080E19] p-2 font-mono text-[11px] leading-5 text-[#8B99B0]" role="log" aria-live="polite">
          {logs.length === 0 ? <p>No runtime events</p> : logs.map((line, index) => <p key={`${line}-${index}`} className={line.includes("Error") ? "text-[#FF6B82]" : ""}>{line}</p>)}
        </div>
      </CardContent>
    </Card>
  );
}

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function violationLabel(type: string) {
  return type === "smoking" ? "Smoking" : type === "empty_desk" ? "Away from desk" : type;
}

export default function BehaviorClient() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [smokeModelPath, setSmokeModelPath] = useState("models/vision-ai/smoking.pt");
  const [leavingModelPath, setLeavingModelPath] = useState("models/vision-ai/leaving.pt");
  const [monitorSession, setMonitorSession] = useState<MonitorSession | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | Alert["status"]>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reviewTarget, setReviewTarget] = useState<Alert | null>(null);
  const [reviewDecision, setReviewDecision] = useState<ReviewDecision>("approved");
  const [reviewReason, setReviewReason] = useState<ReviewReason>("policy_violation");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  const filteredAlerts = useMemo(() => alerts.filter((alert) => {
    if (statusFilter !== "all" && alert.status !== statusFilter) return false;
    if (typeFilter !== "all" && alert.violation_type !== typeFilter) return false;
    if (dateFrom && alert.detected_at.slice(0, 10) < dateFrom) return false;
    if (dateTo && alert.detected_at.slice(0, 10) > dateTo) return false;
    return true;
  }), [alerts, dateFrom, dateTo, statusFilter, typeFilter]);

  const violationTypes = useMemo(() => {
    return Array.from(new Set(alerts.map((alert) => alert.violation_type))).sort();
  }, [alerts]);

  const loadSession = useCallback(async () => {
    const response = await fetch("/api/behavior/session", { cache: "no-store" });
    const data = await readApiResponse<{ active?: MonitorSession | null }>(response);
    if (response.ok) setMonitorSession(data.active ?? null);
  }, []);

  const load = useCallback(async () => {
    const response = await fetch("/api/behavior", { cache: "no-store" });
    const data = await readApiResponse<{ error?: string; alerts: Alert[] }>(response);
    if (!response.ok) throw new Error(data.error ?? "Unable to load behavior alerts");
    setAlerts(data.alerts ?? []);
    await loadSession();
  }, [loadSession]);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    setDevices(allDevices.filter((device) => device.kind === "videoinput"));
  }, []);

  const loadProfiles = useCallback(async () => {
    const response = await fetch("/api/face", { cache: "no-store" });
    const data = await readApiResponse<{ error?: string; users: Profile[] }>(response);
    if (!response.ok) throw new Error(data.error ?? "Unable to load profiles");
    setProfiles(data.users ?? []);
  }, []);

  useEffect(() => {
    // Sync models from controller
    fetch("/api/vision-controller")
      .then((res) => res.json())
      .then((data) => {
        if (data?.config?.behaviorModels && Array.isArray(data.config.behaviorModels)) {
          const models = data.config.behaviorModels as Array<{ id: string; modelPath: string }>;
          const smoke = models.find((m) => m.id.includes("smoke"));
          const seat = models.find((m) => m.id.includes("seat") || m.id.includes("leaving"));
          if (smoke?.modelPath) setSmokeModelPath(smoke.modelPath);
          if (seat?.modelPath) setLeavingModelPath(seat.modelPath);
        } else if (data?.config?.behaviorModelPath) {
          setSmokeModelPath(data.config.behaviorModelPath);
        }
      })
      .catch(() => undefined);

    const initialLoad = window.setTimeout(() => {
      load().catch((error) => toast.error(error.message));
      void refreshDevices();
      loadProfiles().catch((error) => toast.error(error.message));
    }, 0);
    const timer = window.setInterval(() => load().catch(() => undefined), 5000);
    navigator.mediaDevices?.addEventListener("devicechange", refreshDevices);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
      navigator.mediaDevices?.removeEventListener("devicechange", refreshDevices);
    };
  }, [load, loadProfiles, refreshDevices]);

  function openReview(alert: Alert, decision: ReviewDecision) {
    setReviewTarget(alert);
    setReviewDecision(decision);
    setReviewReason(
      decision === "approved" ? "policy_violation"
        : decision === "justified" ? "authorized_exception"
          : decision === "false_positive" ? "model_error"
            : "no_violation",
    );
    setReviewNote(alert.review_note ?? "");
  }

  async function review() {
    if (!reviewTarget) return;
    const note = reviewNote.trim();
    if (reviewDecision !== "approved" && (!reviewReason || note.length < 5)) {
      toast.error("Reject, false positive, and justified decisions require a reason and a note of at least 5 characters");
      return;
    }

    setReviewBusy(true);
    try {
      const response = await fetch(`/api/behavior/${reviewTarget.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: reviewDecision, reason_category: reviewReason, note }),
      });
      const data = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) return toast.error(data.error ?? "Behavior review failed");
      toast.success("Review saved");
      setReviewTarget(null);
      setReviewNote("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Behavior review failed");
    } finally {
      setReviewBusy(false);
    }
  }

  function exportCsv() {
    const rows = filteredAlerts;
    const header = [
      "id",
      "detected_at",
      "status",
      "violation_type",
      "severity",
      "profile",
      "camera_location",
      "confidence",
      "session_id",
      "reviewed_at",
      "reviewed_by",
      "decision_category",
      "review_note",
      "evidence_url",
    ];
    const lines = [
      header.map(csvCell).join(","),
      ...rows.map((alert) => [
        alert.id,
        alert.detected_at,
        alert.status,
        alert.violation_type,
        alert.severity,
        alert.detections_json?.profileName ?? "",
        alert.camera_location,
        alert.detections_json?.confidence ?? "",
        alert.session_id ?? "",
        alert.reviewed_at ?? "",
        alert.reviewed_by ?? "",
        alert.decision_category ?? "",
        alert.review_note ?? "",
        alert.evidence_url ?? "",
      ].map(csvCell).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `violation-history-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#121A2E] text-[#ECF0F7]">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Behavior Monitoring" }]} />
        <div className="mb-6 flex items-end justify-between gap-3">
          <h1 className="font-display text-4xl font-light">Behavior Monitoring</h1>
          <div className="flex items-center gap-2">
            <Badge variant={monitorSession ? "default" : "outline"}>
              {monitorSession
                ? `Session ${monitorSession.id.slice(-8)} · ${monitorSession.stats?.alerts_created ?? 0} alerts`
                : "No active session"}
            </Badge>
            <Button variant="outline" size="icon" title="Refresh cameras, profiles, and alerts" onClick={() => { void refreshDevices(); void loadProfiles(); void load(); }}><RefreshCw /></Button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <MonitorPanel title="Smoking Monitor" defaultModelPath={smokeModelPath} defaultCameraIndex={0} devices={devices} profiles={profiles} onAlertsSaved={load} />
          <MonitorPanel title="Away-from-Desk Monitor" defaultModelPath={leavingModelPath} defaultCameraIndex={1} devices={devices} profiles={profiles} onAlertsSaved={load} />
        </div>

        <Card className="mt-5 rounded-lg bg-[#10192B]/80">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Violation History & Review</CardTitle>
                <p className="mt-1 text-sm text-[#8B99B0]">{filteredAlerts.length} of {alerts.length} alerts shown</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="h-9 rounded-lg border border-white/10 bg-[#0B1220] px-3 text-sm"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                  aria-label="Filter by status"
                >
                  <option value="all">All statuses</option>
                  <option value="pending_review">Pending review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="false_positive">False positive</option>
                  <option value="justified">Justified</option>
                </select>
                <select
                  className="h-9 rounded-lg border border-white/10 bg-[#0B1220] px-3 text-sm"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  aria-label="Filter by violation type"
                >
                  <option value="all">All violation types</option>
                  {violationTypes.map((type) => <option key={type} value={type}>{violationLabel(type)}</option>)}
                </select>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="h-9 w-auto border-white/10 bg-[#0B1220]"
                  aria-label="Filter from date"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="h-9 w-auto border-white/10 bg-[#0B1220]"
                  aria-label="Filter to date"
                />
                <Button variant="outline" onClick={exportCsv} disabled={filteredAlerts.length === 0}>
                  <Download />Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredAlerts.length === 0 && <p className="text-sm text-[#8B99B0]">No alerts match the current filters.</p>}
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="flex flex-col gap-3 border-b border-white/10 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  {alert.evidence_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={alert.evidence_url} alt="" className="h-16 w-24 rounded object-cover bg-black" />
                  ) : null}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{violationLabel(alert.violation_type)}</p>
                      <Badge variant={alert.status === "pending_review" ? "default" : "outline"}>{alert.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-[#8B99B0]">
                      {alert.detections_json?.profileName ?? "Unassigned profile"} · {alert.camera_location} · {new Date(alert.detected_at).toLocaleString()} · {alert.detections_json?.confidence ? `${(alert.detections_json.confidence * 100).toFixed(1)}%` : alert.severity}
                      {alert.session_id ? ` · ${alert.session_id}` : ""}
                    </p>
                    {alert.status !== "pending_review" && (
                      <p className="mt-1 text-xs text-[#C8D0E0]">
                        Reviewed {alert.reviewed_at ? new Date(alert.reviewed_at).toLocaleString() : "time unknown"}
                        {alert.reviewed_by ? ` by ${alert.reviewed_by}` : ""}
                        {alert.decision_category ? ` · ${alert.decision_category}` : ""}
                        {alert.review_note ? ` · ${alert.review_note}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                {alert.status === "pending_review" && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => openReview(alert, "approved")}><Check />Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => openReview(alert, "justified")}><MessageSquare />Justified</Button>
                    <Button size="sm" variant="outline" onClick={() => openReview(alert, "false_positive")}><X />False Positive</Button>
                    <Button size="sm" variant="destructive" onClick={() => openReview(alert, "rejected")}><X />Reject</Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </PageContainer>

      <Dialog open={!!reviewTarget} onOpenChange={(open) => { if (!open && !reviewBusy) setReviewTarget(null); }}>
        <DialogContent className="border border-white/10 bg-[#10192B] text-[#ECF0F7] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review violation alert</DialogTitle>
            <DialogDescription className="text-[#8B99B0]">
              Confirm the decision and add reviewer context for the audit trail.
            </DialogDescription>
          </DialogHeader>

          {reviewTarget && (
            <div className="space-y-4">
              {reviewTarget.evidence_url && (
                <div className="overflow-hidden rounded-lg border border-white/10 bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={reviewTarget.evidence_url} alt="Violation evidence" className="max-h-72 w-full object-contain" />
                </div>
              )}
              <div className="rounded-lg border border-white/10 bg-[#0B1220] p-3 text-sm">
                <p className="font-medium">{violationLabel(reviewTarget.violation_type)}</p>
                <p className="mt-1 text-xs text-[#8B99B0]">
                  {reviewTarget.detections_json?.profileName ?? "Unassigned profile"} · {reviewTarget.camera_location} · {new Date(reviewTarget.detected_at).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.08em] text-[#8B99B0]">Decision</label>
                <select
                  className="h-10 w-full rounded-lg border border-white/10 bg-[#0B1220] px-3 text-sm"
                  value={reviewDecision}
                  onChange={(event) => setReviewDecision(event.target.value as ReviewDecision)}
                >
                  <option value="approved">Approve violation</option>
                  <option value="rejected">Reject alert</option>
                  <option value="false_positive">False positive</option>
                  <option value="justified">Justified exception</option>
                </select>
              </div>

              {reviewDecision !== "approved" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-[0.08em] text-[#8B99B0]">Reason category</label>
                  <select
                    className="h-10 w-full rounded-lg border border-white/10 bg-[#0B1220] px-3 text-sm"
                    value={reviewReason}
                    onChange={(event) => setReviewReason(event.target.value as ReviewReason)}
                  >
                    <option value="no_violation">No violation</option>
                    <option value="authorized_exception">Authorized exception</option>
                    <option value="camera_error">Camera error</option>
                    <option value="model_error">Model error</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.08em] text-[#8B99B0]">
                  Review note {reviewDecision !== "approved" ? "required" : "optional"}
                </label>
                <Textarea
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  className="min-h-28 border-white/10 bg-[#0B1220]"
                  placeholder="Add context for this decision..."
                />
              </div>
            </div>
          )}

          <DialogFooter className="border-white/10 bg-[#0B1220]/70">
            <Button variant="outline" disabled={reviewBusy} onClick={() => setReviewTarget(null)}>Cancel</Button>
            <Button disabled={reviewBusy} onClick={review}>
              {reviewBusy ? <Loader2 className="animate-spin" /> : <Check />}Save Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
