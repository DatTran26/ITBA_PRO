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
  Trash2,
  Upload,
  X,
  ShieldAlert,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
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

type StorageConfig = {
  storagePath: string;
  exists: boolean;
  totalUsers: number;
  totalImages: number;
  totalSizeBytes: number;
  users?: Array<{ userId: string; imageCount: number; hasEmbeddings: boolean; sizeBytes: number }>;
};

const ANGLES = ["Chính diện", "Nghiêng trái", "Nghiêng phải", "Ngước lên", "Cúi xuống", "Tự nhiên"];
type Capture = { file: File; url: string };

interface FacesClientProps {
  isSuperAdmin?: boolean;
  currentUserRole?: string;
}

export default function FacesClient({ isSuperAdmin = false }: FacesClientProps) {
  const [users, setUsers] = useState<FaceUser[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [captures, setCaptures] = useState<Array<Capture | null>>(() => ANGLES.map(() => null));
  const [activeAngle, setActiveAngle] = useState(0);
  const [cameraOn, setCameraOn] = useState(false);
  const [busy, setBusy] = useState(false);

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
    if (!response.ok) throw new Error(data.error ?? "Không thể tải danh sách khuôn mặt");
    setUsers(data.users);
    if (isSuperAdmin) {
      await loadStorageConfig();
    }
  }, [isSuperAdmin, loadStorageConfig]);

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
      toast.error("Không thể mở camera. Vui lòng cho phép truy cập camera.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function captureAngle() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return toast.error("Camera chưa sẵn sàng");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) return toast.error("Không thể chụp ảnh khuôn mặt");
    replaceCapture(activeAngle, new File([blob], `face-${activeAngle + 1}.jpg`, { type: "image/jpeg" }));
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
      if (!response.ok) throw new Error(data.error ?? "Đăng ký khuôn mặt thất bại");
      toast.success("Đã lưu đăng ký khuôn mặt");
      clearCaptures();
      stopCamera();
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Đăng ký khuôn mặt thất bại");
    } finally {
      setBusy(false);
    }
  }

  async function remove(userId: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa đăng ký khuôn mặt của người dùng này?")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/face?userId=${encodeURIComponent(userId)}`, { method: "DELETE" });
      const data = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Không thể xóa đăng ký khuôn mặt");
      toast.success("Đã xóa đăng ký khuôn mặt");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa đăng ký khuôn mặt");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateStoragePath() {
    if (!customPathInput.trim()) {
      toast.error("Vui lòng nhập đường dẫn thư mục lưu trữ");
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
      if (!res.ok) throw new Error(data.error ?? "Không thể cập nhật đường dẫn lưu trữ");
      toast.success(data.message ?? "Đã cập nhật đường dẫn lưu trữ thành công!");
      await loadStorageConfig();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cập nhật đường dẫn thất bại");
    } finally {
      setIsSavingPath(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#121A2E] text-[#ECF0F7]">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Quản lý khuôn mặt" }]} />
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-light">Quản lý khuôn mặt</h1>
            <p className="mt-1 text-sm text-[#8B99B0]">Đăng ký và quản lý dữ liệu nhận diện khuôn mặt 6 góc cho nhân sự.</p>
          </div>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <Link href="/dashboard/model-controller">
                <Button variant="outline" className="border-[#5B6CF0]/40 text-[#7C8FFF] hover:bg-[#5B6CF0]/10 text-xs">
                  <Cpu className="size-3.5 mr-1.5 text-indigo-400" />
                  Cấu hình Model AI (ArcFace & YOLO)
                </Button>
              </Link>
            )}
            <Button variant="outline" size="icon" title="Làm mới" onClick={() => load()}><RefreshCw /></Button>
          </div>
        </div>

        {/* Super Admin Path Configuration Card */}
        {isSuperAdmin && (
          <Card className="mb-6 border-[#5B6CF0]/40 bg-[#10192B]/90 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base text-[#7C8FFF]">
                  <FolderCog className="size-5" />
                  Cấu hình đường dẫn lưu trữ dữ liệu khuôn mặt trên máy (Super Admin)
                </CardTitle>
                <Badge variant="outline" className="border-[#5B6CF0] text-[#7C8FFF]">Role: super_admin</Badge>
              </div>
              <CardDescription className="text-xs text-[#8B99B0]">
                Ảnh 6 góc và vector đặc trưng (embeddings.npy) của từng nhân sự được lưu trữ trực tiếp trên ổ đĩa cục bộ của máy chủ.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {storageConfig && (
                <div className="grid grid-cols-1 gap-3 rounded-lg border border-white/5 bg-[#0B1220]/70 p-3 sm:grid-cols-3 text-xs">
                  <div className="flex items-center gap-2">
                    <HardDrive className="size-4 text-[#36DDAB]" />
                    <div>
                      <span className="text-[#8B99B0]">Trạng thái: </span>
                      <span className="font-semibold text-[#36DDAB]">{storageConfig.exists ? "Sẵn sàng" : "Chưa tạo"}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[#8B99B0]">Tài khoản trên đĩa: </span>
                    <span className="font-semibold text-white">{storageConfig.totalUsers} người</span>
                  </div>
                  <div>
                    <span className="text-[#8B99B0]">Tổng dung lượng ảnh: </span>
                    <span className="font-semibold text-white">
                      {storageConfig.totalImages} ảnh ({(storageConfig.totalSizeBytes / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-[#ECF0F7]">
                  Đường dẫn thư mục lưu trữ (Storage Path trên máy):
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
                    Lưu đường dẫn
                  </Button>
                </div>
              </div>

              {/* Preset buttons */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[#8B99B0]">Đường dẫn gợi ý nhanh:</span>
                <button
                  type="button"
                  className="rounded border border-white/10 bg-[#161F35] px-2 py-1 text-[#8B99B0] hover:text-white hover:border-[#5B6CF0]"
                  onClick={() => setCustomPathInput("D:\\Open AI\\down_town\\src\\data\\vision-ai\\faces")}
                >
                  Mặc định (data/vision-ai/faces)
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
              <CardTitle className="flex items-center gap-2"><ScanFace className="size-4" />Đăng ký 6 ảnh khuôn mặt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <select className="h-9 w-full rounded-lg border border-white/10 bg-[#0B1220] px-3 text-sm" value={selectedUser} onChange={(event) => setSelectedUser(event.target.value)}>
                <option value="">Chọn tài khoản cần đăng ký</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}
              </select>
              <div className="overflow-hidden rounded-lg bg-black aspect-video">
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {!cameraOn ? (
                  <Button onClick={startCamera}><Play />Mở Camera</Button>
                ) : (
                  <Button variant="outline" onClick={stopCamera}><Square />Tắt Camera</Button>
                )}
                <Button disabled={!cameraOn} onClick={captureAngle}><Camera />Chụp {ANGLES[activeAngle]}</Button>
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
                        <label className="cursor-pointer rounded p-1 hover:bg-white/10" title={`Tải lên ${angle}`}>
                          <Upload className="size-3.5" />
                          <Input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" capture="user" onChange={(event) => replaceCapture(index, event.target.files?.[0] ?? null)} />
                        </label>
                        {captures[index] && <button type="button" className="rounded p-1 hover:bg-white/10" title={`Xóa ${angle}`} onClick={() => replaceCapture(index, null)}><X className="size-3.5" /></button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full" disabled={busy || !selectedUser || captures.some((capture) => !capture)} onClick={enroll}>
                {busy ? <Loader2 className="animate-spin" /> : <Upload />}Lưu đăng ký khuôn mặt
              </Button>
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader>
              <CardTitle>Danh sách nhân sự & trạng thái khuôn mặt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3 border-b border-white/10 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{user.name}</p>
                    <p className="truncate text-xs text-[#8B99B0]">{user.email} · {user.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.enrollment ? "default" : "outline"}>
                      {user.enrollment ? (
                        user.enrollment.imageCount ? `Đã đăng ký (${user.enrollment.imageCount} ảnh)` : "Đã đăng ký"
                      ) : (
                        "Chưa đăng ký"
                      )}
                    </Badge>
                    {user.enrollment && (
                      <Button variant="destructive" size="icon" title="Xóa đăng ký" disabled={busy} onClick={() => remove(user.id)}>
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
