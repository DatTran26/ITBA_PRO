"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Camera, Check, Loader2, Play, ScanFace, Square, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
const ANGLES = ANGLES_DETAIL.map((item) => item.name);
type Capture = { file: File; url: string };

export default function FaceReauthClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [status, setStatus] = useState<"loading" | "ready" | "invalid" | "done">("loading");
  const [error, setError] = useState("");
  const [userLabel, setUserLabel] = useState("");
  const [captures, setCaptures] = useState<Array<Capture | null>>(() => ANGLES.map(() => null));
  const [activeAngle, setActiveAngle] = useState(0);
  const [cameraOn, setCameraOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);
  const autoCapturingRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturesRef = useRef(captures);

  const load = useCallback(async () => {
    if (!token) {
      setStatus("invalid");
      setError("This face verification link is missing a token.");
      return;
    }
    const response = await fetch(`/api/face/reauth?token=${encodeURIComponent(token)}`, { cache: "no-store" });
    const data = await readApiResponse<{ error?: string; user?: { name?: string | null; email?: string | null } }>(response);
    if (!response.ok) {
      setStatus("invalid");
      setError(data.error ?? "This face verification link is invalid.");
      return;
    }
    setUserLabel([data.user?.name, data.user?.email].filter(Boolean).join(" · "));
    setStatus("ready");
  }, [token]);

  useEffect(() => {
    load().catch((loadError) => {
      setStatus("invalid");
      setError(loadError instanceof Error ? loadError.message : "Unable to validate this link");
    });
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

  function stopAutoCapture() {
    autoCapturingRef.current = false;
    setIsAutoCapturing(false);
    setAutoCountdown(null);
  }

  function stopCamera() {
    stopAutoCapture();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
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
    replaceCapture(angleIndex, new File([blob], `face-${angleIndex + 1}.jpg`, { type: "image/jpeg" }));
    toast.info(`Captured angle ${angleIndex + 1}/6: ${ANGLES[angleIndex]}`);
    return true;
  }

  async function enroll() {
    if (capturesRef.current.some((capture) => !capture)) return;
    setBusy(true);
    const body = new FormData();
    body.append("token", token);
    capturesRef.current.forEach((capture) => body.append("images", capture!.file));
    try {
      const response = await fetch("/api/face/reauth", { method: "POST", body });
      const data = await readApiResponse<{ error?: string; message?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Face verification failed");
      stopCamera();
      setStatus("done");
      toast.success(data.message ?? "Face verified. You can now sign in with Face ID.");
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Face verification failed");
    } finally {
      setBusy(false);
    }
  }

  function runAngleCountdown(angleIndex: number) {
    if (!autoCapturingRef.current) return;
    if (angleIndex >= 6) {
      setIsAutoCapturing(false);
      autoCapturingRef.current = false;
      setAutoCountdown(null);
      toast.success("All six angles captured. Saving verification automatically...");
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
            window.setTimeout(() => runAngleCountdown(angleIndex + 1), 400);
          } else {
            stopAutoCapture();
          }
        });
      }
    }, 1000);
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

  async function captureAngle() {
    void snapPhotoForAngle(activeAngle);
    const nextEmpty = captures.findIndex((capture, index) => index > activeAngle && !capture);
    if (nextEmpty !== -1) setActiveAngle(nextEmpty);
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121A2E] text-[#8B99B0]">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Checking verification link…
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121A2E] p-6 text-[#ECF0F7]">
        <Card className="w-full max-w-lg rounded-lg bg-[#10192B]/80">
          <CardHeader>
            <CardTitle>Face verification unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className={buttonVariants()}>
              Back to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121A2E] p-6 text-[#ECF0F7]">
        <Card className="w-full max-w-lg rounded-lg bg-[#10192B]/80">
          <CardHeader>
            <CardTitle>Face verified</CardTitle>
            <CardDescription>You can now sign in with Face ID or your password.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className={buttonVariants()}>
              Continue to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121A2E] p-6 text-[#ECF0F7]">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="font-display text-4xl font-light">Face verification</h1>
          <p className="mt-2 text-[#8B99B0]">
            Capture six face angles to restore Face ID for {userLabel || "this account"}. This link can be used once.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanFace className="size-4" />
                Six-angle capture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                {isAutoCapturing && autoCountdown !== null && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-400 bg-emerald-950/80">
                      <span className="font-mono text-4xl font-extrabold text-emerald-300">
                        {autoCountdown > 0 ? autoCountdown : <Camera className="size-6" />}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-emerald-400">
                      Angle {activeAngle + 1}/6: {ANGLES[activeAngle]}
                    </p>
                  </div>
                )}
              </div>
              <Button
                type="button"
                onClick={isAutoCapturing ? stopAutoCapture : startAuto6AngleCapture}
                className={`w-full font-semibold ${
                  isAutoCapturing
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                }`}
              >
                {isAutoCapturing ? (
                  <>
                    <Square className="mr-2 size-4" />
                    Stop automatic capture
                  </>
                ) : (
                  <>
                    <ScanFace className="mr-2 size-4" />
                    Automatic six-angle capture
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
              <Button className="w-full" disabled={busy || captures.some((capture) => !capture)} onClick={enroll}>
                {busy ? <Loader2 className="animate-spin" /> : <Upload />}Submit face verification
              </Button>
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader>
              <CardTitle>How this works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[#8B99B0]">
              <p>An administrator issued this one-time link because Face ID needs a fresh capture.</p>
              <p>After you submit six angles, Face ID sign-in is restored and this link stops working.</p>
              <p>You can still sign in with your password while this request is open.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
