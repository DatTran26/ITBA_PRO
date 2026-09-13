"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, ScanFace, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type FaceUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  enrollment: { id: string; created_at: string } | null;
};

const ANGLES = ["Front", "Left profile", "Right profile", "Looking down"];

export default function FacesClient() {
  const [users, setUsers] = useState<FaceUser[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [files, setFiles] = useState<Array<File | null>>([null, null, null, null]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/face", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Unable to load face enrollments");
    setUsers(data.users);
  }, []);

  useEffect(() => {
    load().catch((error) => toast.error(error.message));
  }, [load]);

  async function enroll() {
    if (!selectedUser || files.some((file) => !file)) return;
    setBusy(true);
    const body = new FormData();
    body.append("userId", selectedUser);
    files.forEach((file) => body.append("images", file!));
    try {
      const response = await fetch("/api/face", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Face enrollment failed");
      toast.success("Face enrollment saved");
      setFiles([null, null, null, null]);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Face enrollment failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(userId: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/face?userId=${encodeURIComponent(userId)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to delete face enrollment");
      toast.success("Face enrollment deleted");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete face enrollment");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#121A2E] text-[#ECF0F7]">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Face Enrollment" }]} />
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-light">Face Enrollment</h1>
          </div>
          <Button variant="outline" size="icon" title="Refresh" onClick={() => load()}><RefreshCw /></Button>
        </div>
        <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ScanFace className="size-4" />Four-Angle Enrollment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <select className="h-9 w-full rounded-lg border border-white/10 bg-[#0B1220] px-3 text-sm" value={selectedUser} onChange={(event) => setSelectedUser(event.target.value)}>
                <option value="">Select account</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}
              </select>
              <div className="grid gap-3 sm:grid-cols-2">
                {ANGLES.map((angle, index) => (
                  <label key={angle} className="space-y-2 text-xs text-[#8B99B0]">
                    <span>{index + 1}. {angle}</span>
                    <Input type="file" accept="image/png,image/jpeg,image/webp" capture="user" onChange={(event) => setFiles((current) => current.map((file, i) => i === index ? event.target.files?.[0] ?? null : file))} />
                  </label>
                ))}
              </div>
              <Button className="w-full" disabled={busy || !selectedUser || files.some((file) => !file)} onClick={enroll}>
                {busy ? <Loader2 className="animate-spin" /> : <Upload />}Save Enrollment
              </Button>
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader>
              <CardTitle>Enrollments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3 border-b border-white/10 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{user.name}</p>
                    <p className="truncate text-xs text-[#8B99B0]">{user.email} · {user.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.enrollment ? "default" : "outline"}>{user.enrollment ? "Enrolled" : "Not enrolled"}</Badge>
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
