"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Check, Loader2, Play, RefreshCw, ScanFace, Square, Trash2, Upload, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readApiResponse } from "@/lib/api-response";

const ANGLES = ["Chính diện", "Nghiêng trái", "Nghiêng phải", "Ngước lên", "Cúi xuống", "Tự nhiên"];
type Capture = { file: File; url: string };

export default function MyFaceClient() {
  const [enrollment, setEnrollment] = useState<{ id: string; created_at: string } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [captures, setCaptures] = useState<Array<Capture | null>>(() => ANGLES.map(() => null));
  const [activeAngle, setActiveAngle] = useState(0);
  const [cameraOn, setCameraOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturesRef = useRef(captures);

  const load = useCallback(async () => {
    const response = await fetch("/api/face/self-enroll", { cache: "no-store" });
    const data = await readApiResponse<{ enrolled: boolean; enrollment: { id: string; created_at: string } | null; error?: string }>(response);
    if (!response.ok) throw new Error(data.error ?? "Không thể tải trạng thái đăng ký");
    setEnrollment(data.enrollment);
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
    if (captures.some((capture) => !capture)) return;
    setBusy(true);
    const body = new FormData();
    captures.forEach((capture) => body.append("images", capture!.file));
    try {
      const response = await fetch("/api/face/self-enroll", { method: "POST", body });
      const data = await readApiResponse<{ ok?: boolean; enrollment?: { id: string; created_at: string }; error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Đăng ký khuôn mặt thất bại");
      toast.success("Đăng ký khuôn mặt thành công!");
      clearCaptures();
      stopCamera();
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Đăng ký khuôn mặt thất bại");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Bạn có chắc muốn xóa đăng ký khuôn mặt? Bạn sẽ không thể đăng nhập hoặc chấm công bằng khuôn mặt.")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/face/self-enroll", { method: "DELETE" });
      const data = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Không thể xóa đăng ký khuôn mặt");
      toast.success("Đã xóa đăng ký khuôn mặt");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xóa đăng ký khuôn mặt thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#121A2E] text-[#ECF0F7]">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Khuôn mặt của tôi" }]} />
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-light">Khuôn mặt của tôi</h1>
            <p className="mt-2 text-[#8B99B0]">Đăng ký khuôn mặt để đăng nhập và chấm công bằng nhận diện khuôn mặt.</p>
          </div>
          <Button variant="outline" size="icon" title="Làm mới" onClick={() => load()}>
            <RefreshCw />
          </Button>
        </div>

        {/* Current status */}
        {loaded && (
          <Card className="mb-6 rounded-lg bg-[#10192B]/80">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                {enrollment ? (
                  <>
                    <ShieldCheck className="size-5 text-[#36DDAB]" />
                    <div>
                      <p className="font-medium text-[#36DDAB]">Đã đăng ký khuôn mặt</p>
                      <p className="text-xs text-[#8B99B0]">
                        Đăng ký lúc: {new Date(enrollment.created_at).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <ScanFace className="size-5 text-[#FF6B82]" />
                    <div>
                      <p className="font-medium text-[#FF6B82]">Chưa đăng ký khuôn mặt</p>
                      <p className="text-xs text-[#8B99B0]">Hãy chụp 6 góc khuôn mặt bên dưới để đăng ký.</p>
                    </div>
                  </>
                )}
              </div>
              {enrollment && (
                <Button variant="destructive" size="sm" disabled={busy} onClick={remove}>
                  <Trash2 className="mr-1 size-4" /> Xóa
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
          {/* Camera & capture panel */}
          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanFace className="size-4" />
                {enrollment ? "Cập nhật khuôn mặt" : "Đăng ký khuôn mặt"}
              </CardTitle>
              <CardDescription>
                Chụp 6 góc khuôn mặt: chính diện, nghiêng trái/phải, ngước lên, cúi xuống, và tự nhiên.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-lg bg-black aspect-video">
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {!cameraOn ? (
                  <Button onClick={startCamera}><Play className="mr-1 size-4" />Mở Camera</Button>
                ) : (
                  <Button variant="outline" onClick={stopCamera}><Square className="mr-1 size-4" />Tắt Camera</Button>
                )}
                <Button disabled={!cameraOn} onClick={captureAngle}>
                  <Camera className="mr-1 size-4" />Chụp {ANGLES[activeAngle]}
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

              <div className="grid grid-cols-2 gap-2">
                <Button className="w-full" disabled={busy || captures.some((capture) => !capture)} onClick={enroll}>
                  {busy ? <Loader2 className="animate-spin" /> : <Upload className="mr-1 size-4" />}
                  {enrollment ? "Cập nhật" : "Đăng ký"}
                </Button>
                <Button variant="outline" className="w-full" onClick={clearCaptures} disabled={busy || captures.every((c) => !c)}>
                  Xóa tất cả ảnh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions panel */}
          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader>
              <CardTitle>Hướng dẫn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-[#8B99B0]">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge className="mt-0.5 shrink-0">1</Badge>
                  <p>Mở camera và đảm bảo khuôn mặt hiển thị rõ ràng, đủ ánh sáng.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="mt-0.5 shrink-0">2</Badge>
                  <p>Chụp lần lượt 6 góc: <strong>chính diện</strong>, <strong>nghiêng trái</strong>, <strong>nghiêng phải</strong>, <strong>ngước lên</strong>, <strong>cúi xuống</strong>, và <strong>tự nhiên</strong>.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="mt-0.5 shrink-0">3</Badge>
                  <p>Bạn có thể chụp lại hoặc tải ảnh lên cho từng góc bằng nút <Upload className="inline size-3.5" /> bên cạnh.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="mt-0.5 shrink-0">4</Badge>
                  <p>Sau khi đủ 6 ảnh, nhấn <strong>&quot;Đăng ký&quot;</strong> để hoàn tất.</p>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#0B1220]/60 p-4">
                <p className="text-sm font-medium text-[#ECF0F7] mb-2">Lưu ý bảo mật</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Ảnh khuôn mặt được xử lý trên máy chủ nội bộ, không gửi ra bên ngoài.</li>
                  <li>Dữ liệu nhận diện được mã hóa và lưu an toàn.</li>
                  <li>Bạn có thể xóa đăng ký bất cứ lúc nào.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}
