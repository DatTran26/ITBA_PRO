"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Building2, CalendarDays, ChevronDown, ChevronUp, Loader2, Phone, Video } from "lucide-react";
import { toast } from "sonner";

import AssignCandidatesPanel from "./assign-candidates-panel";
import AssignInterviewerPanel from "./assign-interviewer-panel";
import SessionTestPanel from "./session-test-panel";

import { ROUND } from "../session-agenda-row";
import { toneFor } from "@/lib/ui/tones";

const LOCATION_ICON = { online: Video, office: Building2, phone: Phone } as const;
const LOCATION_LABEL = { online: "Online", office: "Văn phòng", phone: "Điện thoại" };

const CONFIRM_COLS: { key: ConfirmStatus; label: string; color: string }[] = [
  { key: "confirmed", label: "Đã xác nhận", color: "var(--success)" },
  { key: "pending", label: "Chờ xác nhận", color: "var(--warning)" },
  { key: "declined", label: "Từ chối", color: "var(--danger)" },
];
const IV_COLOR = { accepted: "var(--success)", declined: "var(--danger)", pending: "var(--warning)" } as const;
const IV_LABEL = { accepted: "Nhận", declined: "Từ chối", pending: "Chờ" } as const;

function getInitial(name: string) {
  return (name || "?")[0].toUpperCase();
}

type ConfirmStatus = "pending" | "confirmed" | "declined";

type SessionTest = {
  id: string;
  title: string | null;
  job_role: string | null;
  share_token: string;
  status: string;
  time_limit_minutes?: number | null;
} | null;

type SessionInterviewer = {
  id: string;
  interviewer_id: string;
  status: "pending" | "accepted" | "declined";
  users?: { id: string; name: string | null; email: string | null } | null;
};

interface Schedule {
  id: string;
  job_application_id: string;
  interviewer_id: string | null;
  candidate_confirmation: ConfirmStatus;
  candidate_confirmed_at: string | null;
  status: string;
  users: { id: string; name: string } | null;
  job_applications: {
    id: string;
    pipeline_status: string;
    persons: { id: string; full_name: string; email: string } | null;
    candidate_screenings: Array<{ final_score: number | null; ai_score: number | null }>;
  } | null;
}

interface SessionData {
  id: string;
  round: 1 | 2 | 3;
  scheduled_at: string;
  duration_minutes: number;
  location_type: "online" | "office" | "phone";
  location_detail: string | null;
  recruiter_note: string | null;
  notification_sent_at: string | null;
  job_descriptions: { id: string; title: string } | null;
  tests: SessionTest;
  interview_session_interviewers?: SessionInterviewer[];
}

interface Props {
  id: string;
  userRole: string;
}

export default function SessionDetailClient({ id, userRole }: Props) {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [responding, setResponding] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showAssignInterviewer, setShowAssignInterviewer] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [myAssignmentStatus, setMyAssignmentStatus] = useState<"pending" | "accepted" | "declined" | null>(null);
  const canManage = ["hr", "admin", "super_admin"].includes(userRole);
  const isInterviewer = userRole === "interviewer";

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/recruitment/sessions/${id}`);
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(json?.error ?? "Không tìm thấy session");
        return;
      }
      setSession(json.session);
      setSchedules(json.schedules ?? []);
      setMyAssignmentStatus(json.myAssignmentStatus ?? null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const interviewers = session?.interview_session_interviewers ?? [];
  const acceptedCount = interviewers.filter((item) => item.status === "accepted").length;
  const canAssignCandidates = acceptedCount > 0;
  const isSessionPast = new Date(session?.scheduled_at ?? "").getTime() < Date.now();
  const canRespond = isInterviewer && !isSessionPast && myAssignmentStatus === "pending";

  const handleRespond = async (action: "accept" | "decline") => {
    setResponding(true);
    try {
      const response = await fetch(`/api/recruitment/sessions/${id}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(json?.error ?? "Không cập nhật được phản hồi");
        return;
      }
      toast.success(action === "accept" ? "Đã xác nhận tham gia session" : "Đã từ chối session");
      fetchData(true);
    } finally {
      setResponding(false);
    }
  };

  const handleNotify = async () => {
    setNotifying(true);
    try {
      const response = await fetch(`/api/recruitment/sessions/${id}/notify`, { method: "POST" });
      const json = await response.json();
      if (!response.ok) {
        toast.error(json.error ?? "Gửi thất bại");
        return;
      }
      toast.success(`Đã gửi ${json.sent} email thông báo`);
      fetchData();
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setNotifying(false);
    }
  };

  const stats = useMemo(() => ({
    confirmed: schedules.filter((item) => item.candidate_confirmation === "confirmed").length,
    pending: schedules.filter((item) => item.candidate_confirmation === "pending").length,
    declined: schedules.filter((item) => item.candidate_confirmation === "declined").length,
  }), [schedules]);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!session) return null;

  const round = ROUND[session.round];
  const LocationIcon = LOCATION_ICON[session.location_type];
  const start = new Date(session.scheduled_at);
  const end = new Date(start.getTime() + session.duration_minutes * 60_000);
  const hhmm = (d: Date) => d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-1 pb-10">
      <button onClick={() => router.push("/dashboard/recruitment/sessions")} className="group inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary cursor-pointer">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Lịch phỏng vấn
      </button>

      {/* Vé sự kiện */}
      <div className="grid grid-cols-[220px_1fr_260px] rounded-2xl border border-border bg-card overflow-hidden shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]">
        <div className="p-6 text-white flex flex-col justify-between" style={{ background: `linear-gradient(160deg, ${round.tone.mark}, color-mix(in srgb, ${round.tone.mark} 70%, #000))` }}>
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">{start.toLocaleDateString("vi-VN", { weekday: "long" })}</p>
          <div>
            <p className="text-6xl font-black leading-none tabular-nums">{start.getDate()}</p>
            <p className="mt-1 text-sm font-bold opacity-90">tháng {start.getMonth() + 1}, {start.getFullYear()}</p>
          </div>
          <p className="text-xl font-black tabular-nums">{hhmm(start)} – {hhmm(end)}</p>
        </div>
        <div className="p-6 min-w-0 border-r-2 border-dashed border-border">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ color: round.tone.ink, backgroundColor: round.tone.bg }}>{round.label}</span>
            {isSessionPast && <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">Đã diễn ra</span>}
            {session.notification_sent_at && <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success">Đã gửi lịch</span>}
          </div>
          <h1 className="mt-3 text-3xl font-black leading-tight text-foreground truncate">{session.job_descriptions?.title ?? "Buổi phỏng vấn"}</h1>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-semibold" style={{ color: "var(--primary)", backgroundColor: "color-mix(in srgb, var(--primary) 10%, var(--card))" }}>
              <LocationIcon className="h-4 w-4" />{LOCATION_LABEL[session.location_type]}{session.location_detail ? ` · ${session.location_detail}` : ""}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 font-semibold text-foreground"><CalendarDays className="h-4 w-4" />{session.duration_minutes} phút</span>
          </div>
          {session.recruiter_note && <p className="mt-4 text-sm text-muted-foreground line-clamp-2">{session.recruiter_note}</p>}
        </div>
        <div className="p-6 flex flex-col justify-between gap-4 bg-muted/30">
          <div className="grid grid-cols-3 gap-2 text-center">
            {CONFIRM_COLS.map((c) => (
              <div key={c.key}>
                <p className="text-2xl font-black tabular-nums" style={{ color: c.color }}>{stats[c.key]}</p>
                <p className="text-[10px] font-bold text-muted-foreground">{c.label}</p>
              </div>
            ))}
          </div>
          {schedules.length > 0 && (
            <button onClick={handleNotify} disabled={notifying} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer">
              {notifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />} Gửi lịch cho ứng viên
            </button>
          )}
        </div>
      </div>

      {isInterviewer && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4">
          <div>
            <p className="text-sm font-bold text-foreground">Xác nhận tham gia buổi phỏng vấn</p>
            <p className="text-xs text-muted-foreground">Sau khi nhận, buổi này sẽ xuất hiện trong Interview Room.</p>
          </div>
          {canRespond ? (
            <div className="flex gap-2">
              <button disabled={responding} onClick={() => handleRespond("accept")} className="rounded-lg bg-success px-4 py-2 text-sm font-bold text-white disabled:opacity-50 cursor-pointer">Nhận</button>
              <button disabled={responding} onClick={() => handleRespond("decline")} className="rounded-lg bg-danger/10 px-4 py-2 text-sm font-bold text-danger disabled:opacity-50 cursor-pointer">Từ chối</button>
            </div>
          ) : (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
              {isSessionPast ? "Đã qua" : myAssignmentStatus ? IV_LABEL[myAssignmentStatus] : "Không khả dụng"}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-[1fr_320px] gap-5 items-start">
        {/* Ứng viên chia 3 cột theo xác nhận */}
        <div className="grid grid-cols-3 gap-4">
          {CONFIRM_COLS.map((c) => {
            const items = schedules.filter((sc) => sc.candidate_confirmation === c.key);
            return (
              <section key={c.key} className="rounded-2xl border p-3" style={{ backgroundColor: `color-mix(in srgb, ${c.color} 6%, var(--card))`, borderColor: `color-mix(in srgb, ${c.color} 25%, var(--card))` }}>
                <h2 className="flex items-center gap-2 px-1 pb-3 text-sm font-extrabold text-foreground">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />{c.label}
                  <span className="ml-auto rounded-full bg-card px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{items.length}</span>
                </h2>
                <div className="space-y-2">
                  {items.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">Trống</p>}
                  {items.map((schedule) => {
                    const person = schedule.job_applications?.persons;
                    if (!person) return null;
                    const score = schedule.job_applications?.candidate_screenings?.[0]?.final_score ?? schedule.job_applications?.candidate_screenings?.[0]?.ai_score ?? null;
                    const t = toneFor(person.full_name);
                    return (
                      <button key={schedule.id} type="button" onClick={() => router.push(`/dashboard/recruitment/${schedule.job_application_id}`)}
                              className="w-full text-left flex items-center gap-2.5 rounded-xl bg-card border border-border p-2.5 hover:shadow-[0_6px_18px_color-mix(in_srgb,var(--primary)_14%,transparent)] transition-shadow cursor-pointer">
                        <span className="w-9 h-9 shrink-0 rounded-full grid place-items-center text-xs font-bold" style={{ color: t.ink, backgroundColor: t.bg }}>{getInitial(person.full_name)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-foreground truncate">{person.full_name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{person.email}</p>
                        </div>
                        {score !== null && <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-black tabular-nums text-primary">{Math.round(score)}</span>}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between pb-3">
              <h2 className="text-sm font-extrabold text-foreground">Interviewer</h2>
              <span className="text-xs font-bold tabular-nums text-muted-foreground">{acceptedCount}/{interviewers.length} nhận</span>
            </div>
            {interviewers.length === 0 ? <p className="text-sm text-muted-foreground">Chưa gán interviewer.</p> : (
              <ul className="space-y-2">
                {interviewers.map((item) => {
                  const t = toneFor(item.users?.name ?? item.interviewer_id);
                  return (
                    <li key={item.id} className="flex items-center gap-2.5">
                      <span className="w-8 h-8 shrink-0 rounded-lg grid place-items-center text-xs font-bold" style={{ color: t.ink, backgroundColor: t.bg }}>{getInitial(item.users?.name ?? "I")}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{item.users?.name ?? "Interviewer"}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{item.users?.email ?? item.interviewer_id}</p>
                      </div>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: IV_COLOR[item.status], backgroundColor: `color-mix(in srgb, ${IV_COLOR[item.status]} 12%, var(--card))` }}>{IV_LABEL[item.status]}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Collapsible title={session.tests ? "Bài test đã gắn" : "Chưa gắn bài test"} open={showTest} onToggle={() => setShowTest((value) => !value)} prominent>
            <SessionTestPanel sessionId={id} currentTest={session.tests} onUpdated={() => fetchData(true)} />
          </Collapsible>
        </aside>
      </div>

      {canManage && !canAssignCandidates && <div className="rounded-2xl border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-foreground">Cần ít nhất một interviewer nhận lịch trước khi thêm ứng viên.</div>}

      {canManage && (
        <Collapsible title="Thêm ứng viên vào buổi" open={showAssign} onToggle={() => setShowAssign((value) => !value)}>
          <AssignCandidatesPanel
            sessionId={id}
            assignedApplicationIds={schedules.map((schedule) => schedule.job_application_id)}
            onAssigned={() => fetchData(true)}
            disabled={!canAssignCandidates}
            disabledReason="Cần ít nhất một interviewer accepted trước khi thêm candidate."
          />
        </Collapsible>
      )}

      {canManage && (
        <Collapsible title="Phân công interviewer" open={showAssignInterviewer} onToggle={() => setShowAssignInterviewer((value) => !value)}>
          <AssignInterviewerPanel sessionId={id} currentInterviewers={interviewers} onAssigned={() => fetchData(true)} />
        </Collapsible>
      )}
    </div>
  );
}

function Collapsible({ title, open, onToggle, children, prominent = false }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode; prominent?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-border bg-card ${prominent ? "shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]" : ""}`}>
      <button onClick={onToggle} className="flex w-full items-center justify-between px-5 py-4 text-sm font-extrabold text-foreground hover:bg-muted/40 cursor-pointer">
        <span>{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="border-t border-border/10 px-5 py-5">{children}</div>}
    </div>
  );
}
