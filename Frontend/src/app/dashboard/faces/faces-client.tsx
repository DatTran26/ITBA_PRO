"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  Check,
  FolderCog,
  HardDrive,
  Loader2,
  Play,
  RefreshCw,
  ScanFace,
  Square,
  Link2,
  Trash2,
  Upload,
  X,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";
import AppNavbar from "@/components/ui/app-navbar";
import WorkplacePageHeader from "@/components/ui/workplace-page-header";
import PageContainer from "@/components/ui/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readApiResponse } from "@/lib/api-response";

type FaceUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  enrollment: {
    id: string;
    created_at: string;
    imageCount?: number;
    hasLocalFiles?: boolean;
  } | null;
};

type PendingReauth = {
  id: string;
  userId: string;
  expiresAt: string;
};

type StorageConfig = {
  storagePath: string;
  exists: boolean;
  totalUsers: number;
  totalImages: number;
  totalSizeBytes: number;
  users?: Array<{ userId: string; imageCount: number; hasEmbeddings: boolean; sizeBytes: number }>;
};

const ANGLES_DETAIL = [
  { name: "Front", hint: "Look directly at the camera" },
  { name: "Left", hint: "Turn the face 15-30 degrees to the left" },
  { name: "Right", hint: "Turn the face 15-30 degrees to the right" },
  { name: "Looking up", hint: "Raise the chin slightly" },
  { name: "Looking down", hint: "Lower the head slightly" },
  { name: "Natural / Smile", hint: "Smile or use a natural expression" },
];
const ANGLES = ANGLES_DETAIL.map((d) => d.name);
type Capture = { file: File; url: string };

interface FacesClientProps {
  isSuperAdmin?: boolean;
  canIssueReauth?: boolean;
  currentUserRole?: string;
}

export default function FacesClient({ isSuperAdmin = false, canIssueReauth = false }: FacesClientProps) {
  const [users, setUsers] = useState<FaceUser[]>([]);
  const [pendingReauth, setPendingReauth] = useState<Record<string, PendingReauth>>({});
  const [selectedUser, setSelectedUser] = useState("");
  const [captures, setCaptures] = useState<Array<Capture | null>>(() => ANGLES.map(() => null));
  const [activeAngle, setActiveAngle] = useState(0);
  const [cameraOn, setCameraOn] = useState(false);
  const [busy, setBusy] = useState(false);

  // 1-touch 3s auto capture state
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);
  const autoCapturingRef = useRef(false);

  // Storage configuration state (Super Admin only)
  const [storageConfig, setStorageConfig] = useState<StorageConfig | null>(null);
  const [customPathInput, setCustomPathInput] = useState("");
  const [isSavingPath, setIsSavingPath] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturesRef = useRef(captures);

  const loadStorageConfig = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await fetch("/api/face/storage-config", { cache: "no-store" });
      if (res.ok) {
        const data = await readApiResponse<StorageConfig>(res);
        setStorageConfig(data);
        setCustomPathInput(data.storagePath);
      }
    } catch {
      // ignore
    }
  }, [isSuperAdmin]);

  const load = useCallback(async () => {
    const response = await fetch("/api/face", { cache: "no-store" });
    const data = await readApiResponse<{ error?: string; users: FaceUser[] }>(response);
    if (!response.ok) throw new Error(data.error ?? "Unable to load face enrollments");
    setUsers(data.users);
    if (canIssueReauth) {
      const reauthResponse = await fetch("/api/face/reauth-requests", { cache: "no-store" });
      const reauthData = await readApiResponse<{ requests?: PendingReauth[]; error?: string }>(reauthResponse);
      if (reauthResponse.ok) {
        const map: Record<string, PendingReauth> = {};
        for (const row of reauthData.requests ?? []) map[row.userId] = row;
        setPendingReauth(map);
      }
    }
    if (isSuperAdmin) {
      await loadStorageConfig();
    }
  }, [canIssueReauth, isSuperAdmin, loadStorageConfig]);

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
    if (!selectedUser) {
      toast.error("Select a profile before starting automatic capture");
      return;
    }
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
      toast.error("Camera is not ready");
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
    toast.info(`✓ Đã chụp góc ${angleIndex + 1}/6: ${ANGLES[angleIndex]}`);
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
    if (!selectedUser || captures.some((capture) => !capture)) return;
    setBusy(true);
    const body = new FormData();
    body.append("userId", selectedUser);
    captures.forEach((capture) => body.append("images", capture!.file));
    try {
      const response = await fetch("/api/face", { method: "POST", body });
      const data = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Face enrollment failed");
      toast.success("Face enrollment saved");
      clearCaptures();
      stopCamera();
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Face enrollment failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(userId: string) {
    if (!confirm("Delete this user's face enrollment?")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/face?userId=${encodeURIComponent(userId)}`, { method: "DELETE" });
      const data = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Unable to delete face enrollment");
      toast.success("Face enrollment deleted");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete face enrollment");
    } finally {
      setBusy(false);
    }
  }

  async function requestFaceReauth(user: FaceUser) {
    setBusy(true);
    try {
      const response = await fetch("/api/face/reauth-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });
      const data = await readApiResponse<{ url?: string; request?: { url?: string }; error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Unable to create re-auth request");
      const url = data.request?.url ?? data.url;
      if (url) {
        await navigator.clipboard.writeText(url);
        toast.success(`Re-auth link copied for ${user.name}`);
      } else {
        toast.success("Re-auth request created");
      }
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create re-auth request");
    } finally {
      setBusy(false);
    }
  }

  async function revokeFaceReauth(userId: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/face/reauth-requests?userId=${encodeURIComponent(userId)}`, { method: "DELETE" });
      const data = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Unable to revoke re-auth request");
      toast.success("Re-auth request revoked");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to revoke re-auth request");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateStoragePath() {
    if (!customPathInput.trim()) {
      toast.error("Enter a storage directory path");
      return;
    }
    setIsSavingPath(true);
    try {
      const res = await fetch("/api/face/storage-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePath: customPathInput.trim() }),
      });
      const data = await readApiResponse<{ ok?: boolean; error?: string; message?: string; storagePath?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "Unable to update the storage path");
      toast.success(data.message ?? "Storage path updated successfully!");
      await loadStorageConfig();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update the storage path");
    } finally {
      setIsSavingPath(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#121A2E] text-[#ECF0F7]">
      <AppNavbar />
      <PageContainer>
        <WorkplacePageHeader
          title="Face Management"
          description={`Enroll a person in person here. ${canIssueReauth ? "Administrators can also issue a one-time face verification link." : "Face verification links are issued by an administrator."}`}
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Face Management" }]}
          actions={
            <>
            {isSuperAdmin && (
              <Link href="/dashboard/model-controller">
                <Button variant="outline" className="border-[#5B6CF0]/40 text-[#7C8FFF] hover:bg-[#5B6CF0]/10 text-xs">
                  <Cpu className="size-3.5 mr-1.5 text-indigo-400" />
                  AI Model Configuration
                </Button>
              </Link>
            )}
            <Button variant="outline" size="icon" title="Refresh" onClick={() => load()}><RefreshCw /></Button>
            </>
          }
        />

        {/* Super Admin Path Configuration Card */}
        {isSuperAdmin && (
          <Card className="mb-6 border-[#5B6CF0]/40 bg-[#10192B]/90 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base text-[#7C8FFF]">
                  <FolderCog className="size-5" />
                  Local Face Data Storage (Super Admin)
                </CardTitle>
                <Badge variant="outline" className="border-[#5B6CF0] text-[#7C8FFF]">Role: super_admin</Badge>
              </div>
              <CardDescription className="text-xs text-[#8B99B0]">
                Six face images and embeddings.npy are stored on the server&apos;s local disk for each profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {storageConfig && (
                <div className="grid grid-cols-1 gap-3 rounded-lg border border-white/5 bg-[#0B1220]/70 p-3 sm:grid-cols-3 text-xs">
                  <div className="flex items-center gap-2">
                    <HardDrive className="size-4 text-[#36DDAB]" />
                    <div>
                      <span className="text-[#8B99B0]">Status: </span>
                      <span className="font-semibold text-[#36DDAB]">{storageConfig.exists ? "Ready" : "Not created"}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[#8B99B0]">Profiles on disk: </span>
                    <span className="font-semibold text-white">{storageConfig.totalUsers}</span>
                  </div>
                  <div>
                    <span className="text-[#8B99B0]">Image storage: </span>
                    <span className="font-semibold text-white">
                      {storageConfig.totalImages} images ({(storageConfig.totalSizeBytes / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-[#ECF0F7]">
                  Local storage directory:
                </label>
                <div className="flex gap-2">
                  <Input
                    className="border-white/10 bg-[#0B1220] text-xs font-mono text-white"
                    placeholder="D:\Open AI\down_town\src\data\vision-ai\faces"
                    value={customPathInput}
                    onChange={(e) => setCustomPathInput(e.target.value)}
                  />
                  <Button
                    size="sm"
                    className="bg-[#5B6CF0] hover:bg-[#4F5FE0] shrink-0"
                    disabled={isSavingPath || !customPathInput.trim()}
                    onClick={handleUpdateStoragePath}
                  >
                    {isSavingPath ? <Loader2 className="animate-spin size-4" /> : <Check className="size-4 mr-1" />}
                    Save Path
                  </Button>
                </div>
              </div>

              {/* Preset buttons */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[#8B99B0]">Suggested paths:</span>
                <button
                  type="button"
                  className="rounded border border-white/10 bg-[#161F35] px-2 py-1 text-[#8B99B0] hover:text-white hover:border-[#5B6CF0]"
                  onClick={() => setCustomPathInput("D:\\Open AI\\down_town\\src\\data\\vision-ai\\faces")}
                >
                  Default (data/vision-ai/faces)
                </button>
                <button
                  type="button"
                  className="rounded border border-white/10 bg-[#161F35] px-2 py-1 text-[#8B99B0] hover:text-white hover:border-[#5B6CF0]"
                  onClick={() => setCustomPathInput("C:\\data\\faces")}
                >
                  C:\data\faces
                </button>
                <button
                  type="button"
                  className="rounded border border-white/10 bg-[#161F35] px-2 py-1 text-[#8B99B0] hover:text-white hover:border-[#5B6CF0]"
                  onClick={() => setCustomPathInput("D:\\data\\faces")}
                >
                  D:\data\faces
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ScanFace className="size-4" />Six-Angle Face Enrollment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <select className="h-9 w-full rounded-lg border border-white/10 bg-[#0B1220] px-3 text-sm" value={selectedUser} onChange={(event) => setSelectedUser(event.target.value)}>
                <option value="">Select a profile</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}
              </select>
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
              <Button className="w-full" disabled={busy || !selectedUser || captures.some((capture) => !capture)} onClick={enroll}>
                {busy ? <Loader2 className="animate-spin" /> : <Upload />}Save Face Enrollment
              </Button>
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader>
              <CardTitle>Profiles & Face Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3 border-b border-white/10 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{user.name}</p>
                    <p className="truncate text-xs text-[#8B99B0]">{user.email} · {user.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pendingReauth[user.id] && (
                      <Badge variant="outline" className="border-amber-400/40 text-amber-300">
                        Re-auth pending
                      </Badge>
                    )}
                    <Badge variant={user.enrollment ? "default" : "outline"}>
                      {user.enrollment ? (
                        user.enrollment.imageCount ? `Enrolled (${user.enrollment.imageCount} images)` : "Enrolled"
                      ) : (
                        "Not enrolled"
                      )}
                    </Badge>
                    {canIssueReauth && (
                      pendingReauth[user.id] ? (
                        <Button
                          variant="outline"
                          size="icon"
                          title="Revoke re-auth request"
                          disabled={busy}
                          onClick={() => revokeFaceReauth(user.id)}
                        >
                          <X />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="icon"
                          title="Create face re-auth link"
                          disabled={busy}
                          onClick={() => requestFaceReauth(user)}
                        >
                          <Link2 />
                        </Button>
                      )
                    )}
                    {user.enrollment && (
                      <Button variant="destructive" size="icon" title="Delete enrollment" disabled={busy} onClick={() => remove(user.id)}>
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}
