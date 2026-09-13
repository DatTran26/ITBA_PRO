"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock3, LogIn, LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Session = { id: string; check_in_at: string; check_out_at: string | null; check_in_similarity: number; check_out_similarity: number | null; users?: { name?: string; email?: string } | null };

export default function AttendanceClient() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { const response = await fetch("/api/attendance", { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setSessions(data.sessions); }, []);
  useEffect(() => { load().catch((error) => toast.error(error.message)); }, [load]);

  async function record(action: "check-in" | "check-out") {
    if (!image) return;
    setBusy(true);
    const body = new FormData(); body.append("action", action); body.append("image", image);
    try { const response = await fetch("/api/attendance", { method: "POST", body }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Attendance failed"); toast.success(action === "check-in" ? "Checked in" : "Checked out"); setImage(null); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Attendance failed"); }
    finally { setBusy(false); }
  }

  return <div className="min-h-screen bg-[#121A2E] text-[#ECF0F7]"><AppNavbar /><PageContainer>
    <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Attendance" }]} />
    <div className="mb-8 flex items-end justify-between"><div><h1 className="font-display text-4xl font-light">Attendance</h1><p className="mt-2 text-sm text-[#8B99B0]">ArcFace verification is required for check-in and check-out.</p></div><Button variant="outline" size="icon" title="Refresh" onClick={() => load()}><RefreshCw /></Button></div>
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <Card className="rounded-lg bg-[#10192B]/80"><CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="size-4" />Face check</CardTitle><CardDescription>Take or select one current face image.</CardDescription></CardHeader><CardContent className="space-y-4"><Input type="file" accept="image/png,image/jpeg,image/webp" capture="user" onChange={(event) => setImage(event.target.files?.[0] ?? null)} /><div className="grid grid-cols-2 gap-2"><Button disabled={!image || busy} onClick={() => record("check-in")}><LogIn />Check in</Button><Button variant="outline" disabled={!image || busy} onClick={() => record("check-out")}><LogOut />Check out</Button></div></CardContent></Card>
      <Card className="rounded-lg bg-[#10192B]/80"><CardHeader><CardTitle>Recent sessions</CardTitle></CardHeader><CardContent className="space-y-2">{sessions.length === 0 && <p className="text-sm text-[#8B99B0]">No attendance sessions yet.</p>}{sessions.map((session) => <div key={session.id} className="grid gap-2 border-b border-white/10 py-3 sm:grid-cols-[1fr_auto_auto]"><div><p className="font-medium">{session.users?.name ?? "Current user"}</p><p className="text-xs text-[#8B99B0]">{new Date(session.check_in_at).toLocaleString()}</p></div><Badge variant={session.check_out_at ? "outline" : "default"}>{session.check_out_at ? "Completed" : "Active"}</Badge><p className="text-xs text-[#8B99B0]">In {(session.check_in_similarity * 100).toFixed(1)}%{session.check_out_similarity != null ? ` · Out ${(session.check_out_similarity * 100).toFixed(1)}%` : ""}</p></div>)}</CardContent></Card>
    </div>
  </PageContainer></div>;
}
