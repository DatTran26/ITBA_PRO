"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2, Pause, Play, RefreshCw, ShieldAlert, Square, X } from "lucide-react";
import { toast } from "sonner";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readApiResponse } from "@/lib/api-response";

type Alert = {
  id: string;
  violation_type: string;
  severity: string;
  camera_location: string;
  status: "pending_review" | "approved" | "rejected";
  detected_at: string;
  detections_json?: { confidence?: number; label?: string; bbox?: number[] };
};

type Detection = { label: string; confidence: number; bbox: number[]; isViolation: boolean };
type Overlay = { detections: Detection[]; width: number; height: number };
type MonitorProps = {
  title: string;
  defaultModelPath: string;
  defaultCameraIndex: number;
  devices: MediaDeviceInfo[];
  onAlertsSaved: () => Promise<void>;
};

function MonitorPanel({ title, defaultModelPath, defaultCameraIndex, devices, onAlertsSaved }: MonitorProps) {
  const [sourceType, setSourceType] = useState<"camera" | "video">("camera");
  const [deviceId, setDeviceId] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [modelPath, setModelPath] = useState(defaultModelPath);
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

  const addLog = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setLogs((current) => [`${time}  ${message}`, ...current].slice(0, 24));
  }, []);

  const stop = useCallback(() => {
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

  useEffect(() => () => {
    stop();
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
  }, [stop]);

  useEffect(() => {
    if (!deviceId && devices.length > defaultCameraIndex) {
      setDeviceId(devices[defaultCameraIndex].deviceId);
    }
  }, [defaultCameraIndex, deviceId, devices]);

  function selectVideo(file: File | null) {
    stop();
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    const nextUrl = file ? URL.createObjectURL(file) : null;
    videoUrlRef.current = nextUrl;
    setVideoUrl(nextUrl);
  }

  async function start() {
    stop();
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

    const cameraIndex = Math.max(0, devices.findIndex((item) => item.deviceId === deviceId));
    const body = new FormData();
    body.append("image", new File([blob], "monitor-frame.jpg", { type: "image/jpeg" }));
    body.append("cameraLocation", `${title} / ${sourceType === "camera" ? `Camera ${cameraIndex}` : "Video file"}`);
    body.append("modelPath", modelPath);

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
  }, [addLog, deviceId, devices, modelPath, onAlertsSaved, paused, sourceType, title]);

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
        <Input value={modelPath} onChange={(event) => setModelPath(event.target.value)} placeholder="YOLO model path" aria-label={`${title} YOLO model path`} />
        <div className="grid grid-cols-4 gap-2">
          <Button className="col-span-2" disabled={running || !modelPath || (sourceType === "video" && !videoUrl)} onClick={start}><Play />Start</Button>
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

export default function BehaviorClient() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const load = useCallback(async () => {
    const response = await fetch("/api/behavior", { cache: "no-store" });
    const data = await readApiResponse<{ error?: string; alerts: Alert[] }>(response);
    if (!response.ok) throw new Error(data.error ?? "Unable to load behavior alerts");
    setAlerts(data.alerts ?? []);
  }, []);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    setDevices(allDevices.filter((device) => device.kind === "videoinput"));
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      load().catch((error) => toast.error(error.message));
      void refreshDevices();
    }, 0);
    const timer = window.setInterval(() => load().catch(() => undefined), 5000);
    navigator.mediaDevices?.addEventListener("devicechange", refreshDevices);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
      navigator.mediaDevices?.removeEventListener("devicechange", refreshDevices);
    };
  }, [load, refreshDevices]);

  async function review(id: string, decision: "approved" | "rejected") {
    const response = await fetch(`/api/behavior/${id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const data = await readApiResponse<{ error?: string }>(response);
    if (!response.ok) return toast.error(data.error ?? "Behavior review failed");
    toast.success(decision === "approved" ? "Violation approved" : "Alert rejected");
    await load();
  }

  return (
    <div className="min-h-screen bg-[#121A2E] text-[#ECF0F7]">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Behavior Monitoring" }]} />
        <div className="mb-6 flex items-end justify-between">
          <h1 className="font-display text-4xl font-light">Behavior Monitoring</h1>
          <Button variant="outline" size="icon" title="Refresh cameras and alerts" onClick={() => { void refreshDevices(); void load(); }}><RefreshCw /></Button>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <MonitorPanel title="Smoking Monitor" defaultModelPath="models/vision-ai/smoking.pt" defaultCameraIndex={0} devices={devices} onAlertsSaved={load} />
          <MonitorPanel title="Away-from-Desk Monitor" defaultModelPath="models/vision-ai/leaving.pt" defaultCameraIndex={1} devices={devices} onAlertsSaved={load} />
        </div>

        <Card className="mt-5 rounded-lg bg-[#10192B]/80">
          <CardHeader><CardTitle>Pending Review</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {alerts.length === 0 && <p className="text-sm text-[#8B99B0]">No alerts.</p>}
            {alerts.map((alert) => (
              <div key={alert.id} className="flex flex-col gap-3 border-b border-white/10 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{alert.violation_type === "smoking" ? "Smoking" : "Away from desk"}</p>
                    <Badge variant={alert.status === "pending_review" ? "default" : "outline"}>{alert.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[#8B99B0]">
                    {alert.camera_location} · {new Date(alert.detected_at).toLocaleString()} · {alert.detections_json?.confidence ? `${(alert.detections_json.confidence * 100).toFixed(1)}%` : alert.severity}
                  </p>
                </div>
                {alert.status === "pending_review" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => review(alert.id, "approved")}><Check />Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => review(alert.id, "rejected")}><X />Reject</Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </PageContainer>
    </div>
  );
}
