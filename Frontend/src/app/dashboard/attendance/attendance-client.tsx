"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Clock3, LogIn, LogOut, Play, RefreshCw, Square } from "lucide-react";
import { toast } from "sonner";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readApiResponse } from "@/lib/api-response";

type Session = {
  id: string;
  check_in_at: string;
  check_out_at: string | null;
  check_in_similarity: number;
  check_out_similarity: number | null;
  users?: { name?: string; email?: string } | null;
};

export default function AttendanceClient() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/attendance", { cache: "no-store" });
    const data = await readApiResponse<{ error?: string; sessions: Session[] }>(response);
    if (!response.ok) throw new Error(data.error);
    setSessions(data.sessions);
  }, []);

  useEffect(() => {
    load().catch((error) => toast.error(error.message));
  }, [load]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  function selectImage(file: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = file ? URL.createObjectURL(file) : null;
    previewRef.current = url;
    setPreviewUrl(url);
    setImage(file);
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch {
      toast.error("Unable to open the camera. Please allow camera access.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function captureFace(): Promise<File | null> {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) {
      toast.error("Camera is not ready. Open the camera first.");
      return null;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) {
      toast.error("Unable to capture an image from the camera");
      return null;
    }
    const capturedFile = new File([blob], "attendance-face.jpg", { type: "image/jpeg" });
    selectImage(capturedFile);
    return capturedFile;
  }

  async function record(action: "check-in" | "check-out") {
    let targetImage = image;
    if (!targetImage) {
      if (cameraOn) {
        targetImage = await captureFace();
      }
      if (!targetImage) {
        toast.error("Open the camera or upload a face image for attendance");
        return;
      }
    }

    setBusy(true);
    const body = new FormData();
    body.append("action", action);
    body.append("image", targetImage);
    try {
      const response = await fetch("/api/attendance", { method: "POST", body });
      const data = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Điểm danh không thành công");
      toast.success(action === "check-in" ? "✓ Điểm danh VÀO (Check-in) thành công!" : "✓ Điểm danh RA (Check-out) thành công!");
      selectImage(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Điểm danh thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#121A2E] text-[#ECF0F7]">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Attendance" }]} />
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="font-display text-4xl font-light">Attendance</h1>
            <p className="mt-1 text-sm text-[#8B99B0]">Face attendance powered by ArcFace.</p>
          </div>
          <Button variant="outline" size="icon" title="Làm mới" onClick={() => load()}><RefreshCw className="size-4" /></Button>
        </div>

        {/* Sync Info Banner */}
        <div className="mb-6 rounded-lg border border-[#36DDAB]/30 bg-[#36DDAB]/10 p-3.5 text-xs text-[#36DDAB]">
          <strong>Face verification:</strong> The current face is checked against Face ID and My Face enrollment data before check-in or check-out.
        </div>

        <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="size-4" />Attendance Face Scan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="relative overflow-hidden rounded-lg bg-black aspect-video">
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" />
                {previewUrl && <Image src={previewUrl} alt="Captured face" fill unoptimized sizes="388px" className="object-cover" />}
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {!cameraOn ? (
                  <Button onClick={startCamera}><Play className="mr-1 size-4" />Open Camera</Button>
                ) : (
                  <Button variant="outline" onClick={stopCamera}><Square className="mr-1 size-4" />Stop Camera</Button>
                )}
                <Button disabled={!cameraOn} onClick={() => void captureFace()}><Camera className="mr-1 size-4" />{image ? "Retake" : "Capture"}</Button>
              </div>
              <Input type="file" accept="image/png,image/jpeg,image/webp" capture="user" onChange={(event) => selectImage(event.target.files?.[0] ?? null)} />
              <div className="grid grid-cols-2 gap-2">
                <Button disabled={(!image && !cameraOn) || busy} className="bg-emerald-600 hover:bg-emerald-500 text-white" onClick={() => record("check-in")}>
                  <LogIn className="mr-1.5 size-4" /> Điểm danh Vào
                </Button>
                <Button variant="outline" disabled={(!image && !cameraOn) || busy} className="border-white/15 hover:bg-white/10" onClick={() => record("check-out")}>
                  <LogOut className="mr-1.5 size-4" /> Điểm danh Ra
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader><CardTitle>Lịch sử điểm danh gần đây</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {sessions.length === 0 && <p className="text-sm text-[#8B99B0]">Chưa có phiên điểm danh nào.</p>}
              {sessions.map((session) => (
                <div key={session.id} className="grid gap-2 border-b border-white/10 py-3 sm:grid-cols-[1fr_auto_auto]">
                  <div>
                    <p className="font-medium">{session.users?.name ?? "Người dùng hiện tại"}</p>
                    <p className="text-xs text-[#8B99B0]">{new Date(session.check_in_at).toLocaleString()}</p>
                  </div>
                  <Badge variant={session.check_out_at ? "outline" : "default"}>{session.check_out_at ? "Completed" : "Active"}</Badge>
                  <p className="text-xs text-[#8B99B0]">Vào: {(session.check_in_similarity * 100).toFixed(1)}%{session.check_out_similarity != null ? ` · Ra: ${(session.check_out_similarity * 100).toFixed(1)}%` : ""}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}
