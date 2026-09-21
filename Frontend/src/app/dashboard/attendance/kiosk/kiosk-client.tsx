"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, MonitorSmartphone } from "lucide-react";
import { toast } from "sonner";
import AppNavbar from "@/components/ui/app-navbar";
import PageContainer from "@/components/ui/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { readApiResponse } from "@/lib/api-response";

type KioskHit = {
  name: string;
  direction: "in" | "out";
  similarity: number;
  at: string;
};

export default function AttendanceKioskClient() {
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<KioskHit | null>(null);
  const [reel, setReel] = useState<KioskHit[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLive(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLive(true);
    } catch {
      toast.error("Unable to open the kiosk camera");
    }
  }

  const busyRef = useRef(false);

  const scan = useCallback(async () => {
    if (busyRef.current || !live) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;
    canvas.width = Math.min(640, video.videoWidth);
    canvas.height = Math.round(video.videoHeight * (canvas.width / video.videoWidth));
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
    if (!blob) return;
    setBusy(true);
    busyRef.current = true;
    try {
      const body = new FormData();
      body.append("image", new File([blob], "kiosk.jpg", { type: "image/jpeg" }));
      body.append("kioskId", "kiosk-lobby");
      const response = await fetch("/api/attendance/kiosk", { method: "POST", body });
      const data = await readApiResponse<{
        error?: string;
        match?: boolean;
        direction?: "in" | "out";
        similarity?: number;
        user?: { name: string };
      }>(response);
      if (!response.ok) {
        if (response.status !== 401) toast.error(data.error ?? "Kiosk scan failed");
        return;
      }
      const hit: KioskHit = {
        name: data.user?.name ?? "Unknown",
        direction: data.direction ?? "in",
        similarity: data.similarity ?? 0,
        at: new Date().toISOString(),
      };
      setLast(hit);
      setReel((current) => [hit, ...current].slice(0, 8));
      toast.success(`${hit.name} · ${hit.direction === "in" ? "Check-in" : "Check-out"}`);
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }, [live]);

  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => void scan(), 3500);
    return () => window.clearInterval(timer);
  }, [live, scan]);

  return (
    <div className="min-h-screen bg-[#121A2E] text-[#ECF0F7]">
      <AppNavbar />
      <PageContainer>
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-4xl font-light flex items-center gap-3">
              <MonitorSmartphone className="size-8 text-[#36DDAB]" />
              Attendance kiosk
            </h1>
            <Badge variant={live ? "default" : "outline"}>{live ? "Live 1:N" : "Standby"}</Badge>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-black aspect-video">
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-12 rounded-full border-2 border-[#36DDAB]/50" />
            {last && (
              <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-black/70 px-4 py-3">
                <p className="text-lg font-medium">{last.name}</p>
                <p className="text-sm text-[#8B99B0]">
                  {last.direction === "in" ? "Checked in" : "Checked out"} · {(last.similarity * 100).toFixed(0)}%
                </p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex gap-2">
            {!live ? (
              <Button onClick={() => void start()}><Camera className="mr-2 size-4" />Start kiosk</Button>
            ) : (
              <Button variant="outline" onClick={stop}>Stop</Button>
            )}
            <Button variant="secondary" disabled={!live || busy} onClick={() => void scan()}>Scan now</Button>
          </div>
          <div className="space-y-2">
            {reel.map((hit) => (
              <p key={`${hit.at}-${hit.name}`} className="text-sm text-[#8B99B0]">
                {new Date(hit.at).toLocaleTimeString()} · {hit.name} · {hit.direction}
              </p>
            ))}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
