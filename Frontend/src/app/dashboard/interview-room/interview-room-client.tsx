"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronRight, Loader2, MapPin, Video } from "lucide-react";
import { toast } from "sonner";

type RoomSession = {
  id: string;
  round: 1 | 2 | 3;
  scheduled_at: string;
  duration_minutes: number;
  location_type: string;
  location_detail: string | null;
  job_descriptions: { id: string; title: string } | null;
  tests: { id: string; title: string | null; job_role: string | null; status: string } | null;
};

export default function InterviewRoomClient() {
  const [sessions, setSessions] = useState<RoomSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recruitment/interview-room/sessions")
      .then((response) => response.ok ? response.json() : Promise.reject(response))
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => toast.error("Không tải được Interview Room sessions"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/12 bg-background p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Interview Room</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Chọn buổi phỏng vấn đã accepted</h1>
        <p className="mt-2 text-sm text-muted-foreground">Workspace cho interviewer: xem candidate, CV analysis, test link và session test score.</p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/20 bg-background p-10 text-center">
          <CalendarClock className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Chưa có session nào đã accepted.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sessions.map((session) => (
            <Link key={session.id} href={`/dashboard/interview-room/${session.id}`} className="group rounded-2xl border border-border/12 bg-background p-5 transition-colors hover:border-border/40 hover:bg-background">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{session.job_descriptions?.title ?? "Interview Session"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Round {session.round} · {new Date(session.scheduled_at).toLocaleString("vi-VN")}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-primary"><Video className="h-3 w-3" />{session.duration_minutes} phút</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1"><MapPin className="h-3 w-3" />{session.location_detail ?? session.location_type}</span>
                <span className={`inline-flex rounded-full px-2 py-1 ${session.tests ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{session.tests ? "Test attached" : "No test"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
