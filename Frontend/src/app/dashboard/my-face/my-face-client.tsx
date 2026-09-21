"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Check, Loader2, Play, RefreshCw, ScanFace, Square, Upload, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import AppNavbar from "@/components/ui/app-navbar";
import WorkplacePageHeader from "@/components/ui/workplace-page-header";
import PageContainer from "@/components/ui/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readApiResponse } from "@/lib/api-response";

const ANGLES_DETAIL = [
  { name: "Front", hint: "Look directly at the camera" },
  { name: "Left", hint: "Turn your face 15-30 degrees to the left" },
  { name: "Right", hint: "Turn your face 15-30 degrees to the right" },
  { name: "Looking up", hint: "Raise your chin slightly" },
  { name: "Looking down", hint: "Lower your head slightly" },
  { name: "Natural / Smile", hint: "Smile or use a natural expression" },
];
const ANGLES = ANGLES_DETAIL.map((d) => d.name);
type Capture = { file: File; url: string };

export default function MyFaceClient() {
  const [enrollment, setEnrollment] = useState<{ id: string; created_at: string } | null>(null);
  const [reauthRequired, setReauthRequired] = useState(false);
  const [canSelfEnroll, setCanSelfEnroll] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [captures, setCaptures] = useState<Array<Capture | null>>(() => ANGLES.map(() => null));
  const [activeAngle, setActiveAngle] = useState(0);
  const [cameraOn, setCameraOn] = useState(false);
  const [busy, setBusy] = useState(false);

  // 1-touch 3s auto capture state
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);
  const autoCapturingRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturesRef = useRef(captures);

  const load = useCallback(async () => {
    const response = await fetch("/api/face/self-enroll", { cache: "no-store" });
    const data = await readApiResponse<{
      enrolled: boolean;
      enrollment: { id: string; created_at: string } | null;
      reauthRequired?: boolean;
      canSelfEnroll?: boolean;
      error?: string;
    }>(response);
    if (!response.ok) throw new Error(data.error ?? "Unable to load enrollment status");
    setEnrollment(data.enrollment);
    setReauthRequired(Boolean(data.reauthRequired));
    setCanSelfEnroll(Boolean(data.canSelfEnroll));
    setLoaded(true);
  }, []);

  useEffect(() => {
    load().catch((error) => toast.error(error.message));
  }, [load]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    capturesRef.current.forEach((capture) => capture && URL.revokeObjectURL(capture.url));
  }, []);

  function replaceCapture(index: number, file: File | null) {
    setCaptures((current) => {
      if (current[index]) URL.revokeObjectURL(current[index].url);
      const next = [...current];
      next[index] = file ? { file, url: URL.createObjectURL(file) } : null;
      capturesRef.current = next;
      return next;
    });
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
    stopAutoCapture();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  function stopAutoCapture() {
    autoCapturingRef.current = false;
    setIsAutoCapturing(false);
    setAutoCountdown(null);
  }

  async function startAuto6AngleCapture() {
    let stream = streamRef.current;
    if (!cameraOn || !stream) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraOn(true);
      } catch {
        toast.error("Unable to open the camera. Please allow camera access.");
        return;
      }
    }

    setIsAutoCapturing(true);
    autoCapturingRef.current = true;
    setActiveAngle(0);
    toast.info("Automatic six-angle capture started. One image will be taken every three seconds.");
    runAngleCountdown(0);
  }

  function runAngleCountdown(angleIndex: number) {
    if (!autoCapturingRef.current) return;
    if (angleIndex >= 6) {
      setIsAutoCapturing(false);
      autoCapturingRef.current = false;
      setAutoCountdown(null);
      toast.success("All six angles captured. Saving enrollment automatically...");
      window.setTimeout(() => {
        void enroll();
      }, 500);
      return;
    }

    setActiveAngle(angleIndex);
    setAutoCountdown(3);

    let currentSec = 3;
    const timer = window.setInterval(() => {
      if (!autoCapturingRef.current) {
        window.clearInterval(timer);
        return;
      }
      currentSec -= 1;
      if (currentSec > 0) {
        setAutoCountdown(currentSec);
      } else {
        window.clearInterval(timer);
        setAutoCountdown(0);
        void snapPhotoForAngle(angleIndex).then((success) => {
          if (success && autoCapturingRef.current) {
            window.setTimeout(() => {
              runAngleCountdown(angleIndex + 1);
            }, 400);
          } else {
            stopAutoCapture();
          }
        });
      }
    }, 1000);
  }

  async function snapPhotoForAngle(angleIndex: number): Promise<boolean> {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) {
      toast.error("Camera is not ready to capture " + ANGLES[angleIndex]);
      return false;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) {
      toast.error("Unable to capture the " + ANGLES[angleIndex] + " angle");
      return false;
    }
    const file = new File([blob], `face-${angleIndex + 1}.jpg`, { type: "image/jpeg" });
    replaceCapture(angleIndex, file);
    toast.info(`Captured angle ${angleIndex + 1}/6: ${ANGLES[angleIndex]}`);
    return true;
  }

  async function captureAngle() {
    void snapPhotoForAngle(activeAngle);
    const nextEmpty = captures.findIndex((capture, index) => index > activeAngle && !capture);
    if (nextEmpty !== -1) setActiveAngle(nextEmpty);
  }

  function clearCaptures() {
    capturesRef.current.forEach((capture) => capture && URL.revokeObjectURL(capture.url));
    const empty = ANGLES.map(() => null);
    capturesRef.current = empty;
    setCaptures(empty);
    setActiveAngle(0);
  }

  async function enroll() {
    if (!canSelfEnroll) {
      toast.error("An administrator must send a face verification link first.");
      return;
    }
    if (captures.some((capture) => !capture)) return;
    setBusy(true);
    const body = new FormData();
    captures.forEach((capture) => body.append("images", capture!.file));
    try {
      const response = await fetch("/api/face/self-enroll", { method: "POST", body });
      const data = await readApiResponse<{ ok?: boolean; enrollment?: { id: string; created_at: string }; error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Face enrollment failed");
      toast.success("Face enrolled successfully!");
      clearCaptures();
      stopCamera();
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Face enrollment failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#121A2E] text-[#ECF0F7]">
      <AppNavbar />
      <PageContainer>
        <WorkplacePageHeader
          title="My Face"
          description={
            reauthRequired
              ? "An administrator requested a new six-angle face capture before Face ID can be used."
              : "Your enrolled face is used for Face ID sign-in and attendance. Updates require an administrator link."
          }
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "My Face" }]}
          actions={
            <Button variant="outline" size="icon" title="Refresh" onClick={() => load()}>
              <RefreshCw />
            </Button>
          }
        />

        {/* Current status */}
        {loaded && (
          <Card className="mb-6 rounded-lg bg-[#10192B]/80">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                {enrollment && !reauthRequired ? (
                  <>
                    <ShieldCheck className="size-5 text-[#36DDAB]" />
                    <div>
                      <p className="font-medium text-[#36DDAB]">Face enrolled</p>
                      <p className="text-xs text-[#8B99B0]">
                        Enrolled: {new Date(enrollment.created_at).toLocaleString("en-US")}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <ScanFace className="size-5 text-[#FF6B82]" />
                    <div>
                      <p className="font-medium text-[#FF6B82]">{reauthRequired ? "Face recapture required" : "Face not enrolled"}</p>
                      <p className="text-xs text-[#8B99B0]">
                        {canSelfEnroll
                          ? "Capture the six face angles below to continue."
                          : "Ask an administrator to send a face verification link."}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {canSelfEnroll ? (
        <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
          {/* Camera & capture panel */}
          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanFace className="size-4" />
                {enrollment ? "Update Face" : "Enroll Face"}
              </CardTitle>
              <CardDescription>
                Capture six angles: front, left, right, looking up, looking down, and natural.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative overflow-hidden rounded-lg bg-black aspect-video">
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                {isAutoCapturing && autoCountdown !== null && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-all">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-400 bg-emerald-950/80 shadow-lg shadow-emerald-500/30 animate-pulse">
                      <span className="font-mono text-4xl font-extrabold text-emerald-300">
                        {autoCountdown > 0 ? autoCountdown : <Camera className="size-6" />}
                      </span>
                    </div>
                    <div className="mt-3 rounded-full bg-black/80 px-4 py-1.5 text-center shadow">
                      <p className="text-xs font-semibold text-emerald-400">
                        Angle {activeAngle + 1}/6: {ANGLES[activeAngle]}
                      </p>
                      <p className="text-xs text-white/80">
                        {ANGLES_DETAIL[activeAngle]?.hint}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 1-touch Auto 6-Angle Capture Button */}
              <Button
                type="button"
                onClick={isAutoCapturing ? stopAutoCapture : startAuto6AngleCapture}
                className={`w-full font-semibold ${
                  isAutoCapturing
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-900/30"
                }`}
              >
                {isAutoCapturing ? (
                  <>
                    <Square className="mr-2 size-4" />
                    Stop Automatic Capture (Angle {activeAngle + 1}/6: {ANGLES[activeAngle]})
                  </>
                ) : (
                  <>
                    <ScanFace className="mr-2 size-4" />
                    Automatic Six-Angle Capture (one image every 3s)
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                {!cameraOn ? (
                  <Button variant="outline" onClick={startCamera}><Play className="mr-1 size-4" />Open Camera</Button>
                ) : (
                  <Button variant="outline" onClick={stopCamera}><Square className="mr-1 size-4" />Stop Camera</Button>
                )}
                <Button disabled={!cameraOn || isAutoCapturing} onClick={captureAngle}>
                  <Camera className="mr-1 size-4" />Manual Capture
                </Button>
              </div>

              {/* Angle grid */}
              <div className="grid grid-cols-2 gap-3">
                {ANGLES.map((angle, index) => (
                  <div key={angle} className={`overflow-hidden rounded-lg border ${activeAngle === index ? "border-[#5B6CF0]" : "border-white/10"}`}>
                    <button type="button" className="relative block aspect-video w-full bg-[#0B1220]" onClick={() => setActiveAngle(index)}>
                      {captures[index] ? (
                        <Image src={captures[index].url} alt={angle} fill unoptimized sizes="190px" className="object-cover" />
                      ) : (
                        <ScanFace className="absolute inset-0 m-auto size-7 text-[#56627A]" />
                      )}
                      {captures[index] && <Check className="absolute right-2 top-2 size-4 rounded-full bg-[#36DDAB] p-0.5 text-[#0B1220]" />}
                    </button>
                    <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs text-[#8B99B0]">
                      <span>{index + 1}. {angle}</span>
                      <div className="flex items-center gap-1">
                        <label className="cursor-pointer rounded p-1 hover:bg-white/10" title={`Upload ${angle}`}>
                          <Upload className="size-3.5" />
                          <Input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" capture="user" onChange={(event) => replaceCapture(index, event.target.files?.[0] ?? null)} />
                        </label>
                        {captures[index] && <button type="button" className="rounded p-1 hover:bg-white/10" title={`Remove ${angle}`} onClick={() => replaceCapture(index, null)}><X className="size-3.5" /></button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button className="w-full" disabled={busy || captures.some((capture) => !capture)} onClick={enroll}>
                  {busy ? <Loader2 className="animate-spin" /> : <Upload className="mr-1 size-4" />}
                  {enrollment ? "Update" : "Enroll"}
                </Button>
                <Button variant="outline" className="w-full" onClick={clearCaptures} disabled={busy || captures.every((c) => !c)}>
                  Clear All Images
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions panel */}
          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-[#8B99B0]">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge className="mt-0.5 shrink-0">1</Badge>
                  <p>Open the camera and ensure your face is clear and well lit.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="mt-0.5 shrink-0">2</Badge>
                  <p>Capture six angles: <strong>front</strong>, <strong>left</strong>, <strong>right</strong>, <strong>looking up</strong>, <strong>looking down</strong>, and <strong>natural</strong>.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="mt-0.5 shrink-0">3</Badge>
                  <p>You can retake or upload each angle using the adjacent <Upload className="inline size-3.5" /> button.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="mt-0.5 shrink-0">4</Badge>
                  <p>After all six images are ready, select <strong>Enroll</strong>.</p>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#0B1220]/60 p-4">
                <p className="text-sm font-medium text-[#ECF0F7] mb-2">Privacy</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Face images are processed by the internal server and are not sent to external services.</li>
                  <li>Recognition data is stored securely.</li>
                  <li>Face updates require an administrator verification link.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
        ) : loaded ? (
          <Card className="rounded-lg bg-[#10192B]/80">
            <CardContent className="py-8 text-sm text-[#8B99B0]">
              Face capture is locked until an administrator sends a verification link. Sign in with your password if you already have access, then wait for that link, or open the link from email/chat.
            </CardContent>
          </Card>
        ) : null}
      </PageContainer>
    </div>
  );
}
