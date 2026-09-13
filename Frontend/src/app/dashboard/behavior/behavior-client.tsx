"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2, Play, RefreshCw, ShieldAlert, Square, Upload, X } from "lucide-react";
import { toast } from "sonner";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Alert = {
  id: string;
  violation_type: string;
  severity: string;
  camera_location: string;
  status: "pending_review" | "approved" | "rejected";
  detected_at: string;
  detections_json?: { confidence?: number; label?: string; bbox?: number[] };
};

const DEFAULT_MODEL_PATH = "models/vision-ai/behavior.pt";

export default function BehaviorClient() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [location, setLocation] = useState("Camera 1");
  const [modelPath, setModelPath] = useState(DEFAULT_MODEL_PATH);
  const [busy, setBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/behavior", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setAlerts(data.alerts);
  }, []);

  useEffect(() => {
    load().catch((error) => toast.error(error.message));
    const timer = window.setInterval(() => load().catch(() => undefined), 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch {
      toast.error("Không mở được camera. Hãy cấp quyền camera cho trình duyệt.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
    setAutoScan(false);
  }

  const captureFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) throw new Error("Camera chưa sẵn sàng");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) throw new Error("Không chụp được frame");
    return new File([blob], "behavior-frame.jpg", { type: "image/jpeg" });
  }, []);

  const submitImage = useCallback(async (file: File, quiet = false) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const body = new FormData();
    body.append("image", file);
    body.append("cameraLocation", location);
    body.append("modelPath", modelPath);

    try {
      const response = await fetch("/api/behavior", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Quét hành vi thất bại");
      if (!quiet) {
        toast.success(data.alerts.length ? `${data.alerts.length} vi phạm chờ duyệt` : "Chưa phát hiện vi phạm mục tiêu");
      }
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Quét hành vi thất bại");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [load, location, modelPath]);

  const scanCurrentFrame = useCallback(async (quiet = false) => {
    try {
      await submitImage(await captureFrame(), quiet);
    } catch (error) {
      if (!quiet) toast.error(error instanceof Error ? error.message : "Không chụp được frame");
    }
  }, [captureFrame, submitImage]);

  useEffect(() => {
    if (!autoScan) return;
    const timer = window.setInterval(() => {
      void scanCurrentFrame(true);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [autoScan, scanCurrentFrame]);

  async function scanUpload() {
    if (!image) return;
    await submitImage(image);
  }

  async function review(id: string, decision: "approved" | "rejected") {
    const response = await fetch(`/api/behavior/${id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const data = await response.json();
    if (!response.ok) return toast.error(data.error ?? "Duyệt vi phạm thất bại");
    toast.success(decision === "approved" ? "Đã xác nhận vi phạm" : "Đã từ chối cảnh báo");
    await load();
  }

  return (
    <div className="min-h-screen bg-[#121A2E] text-[#ECF0F7]">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Duyệt vi phạm" }]} />
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="font-display text-4xl font-light">Duyệt vi phạm</h1>
            <p className="mt-2 text-sm text-[#8B99B0]">Video realtime, YOLO phát hiện hút thuốc và rời vị trí. AI chỉ tạo cảnh báo chờ duyệt.</p>
          </div>
          <Button variant="outline" size="icon" title="Làm mới" onClick={() => load()}><RefreshCw /></Button>
        </div>

        <div className="grid gap-5 xl:grid-cols-[520px_1fr]">
          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Camera className="size-4" />Camera realtime</CardTitle>
              <CardDescription>Nhập đường dẫn file .pt trên máy/server đang chạy vision-ai-api.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-lg bg-black aspect-video">
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <Input value={modelPath} onChange={(event) => setModelPath(event.target.value)} placeholder="models/vision-ai/behavior.pt hoặc D:\\models\\behavior.pt" />
              <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Vị trí camera" />
              <div className="grid grid-cols-2 gap-2">
                {!cameraOn ? (
                  <Button onClick={startCamera}><Play />Mở camera</Button>
                ) : (
                  <Button variant="outline" onClick={stopCamera}><Square />Tắt camera</Button>
                )}
                <Button disabled={!cameraOn || busy} onClick={() => scanCurrentFrame()}>
                  {busy ? <Loader2 className="animate-spin" /> : <ShieldAlert />}Quét frame
                </Button>
              </div>
              <Button className="w-full" variant={autoScan ? "destructive" : "secondary"} disabled={!cameraOn} onClick={() => setAutoScan((value) => !value)}>
                {autoScan ? "Dừng quét realtime" : "Bật quét realtime mỗi 4 giây"}
              </Button>
              <div className="border-t border-white/10 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8B99B0]">Hoặc upload ảnh/frame</p>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input type="file" accept="image/png,image/jpeg,image/webp" capture="environment" onChange={(event) => setImage(event.target.files?.[0] ?? null)} />
                  <Button disabled={!image || busy} onClick={scanUpload}><Upload />Quét ảnh</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader>
              <CardTitle>Hàng chờ duyệt</CardTitle>
              <CardDescription>Cập nhật mỗi 5 giây. Quản lý xác nhận hoặc từ chối từng cảnh báo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.length === 0 && <p className="text-sm text-[#8B99B0]">Chưa có cảnh báo.</p>}
              {alerts.map((alert) => (
                <div key={alert.id} className="flex flex-col gap-3 border-b border-white/10 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{alert.violation_type === "smoking" ? "Hút thuốc" : "Rời vị trí"}</p>
                      <Badge variant={alert.status === "pending_review" ? "default" : "outline"}>{alert.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-[#8B99B0]">
                      {alert.camera_location} · {new Date(alert.detected_at).toLocaleString()} · {alert.detections_json?.confidence ? `${(alert.detections_json.confidence * 100).toFixed(1)}%` : alert.severity}
                    </p>
                  </div>
                  {alert.status === "pending_review" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => review(alert.id, "approved")}><Check />Xác nhận</Button>
                      <Button size="sm" variant="destructive" onClick={() => review(alert.id, "rejected")}><X />Từ chối</Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}
