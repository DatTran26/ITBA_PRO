"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Building2, CalendarDays, ChevronDown, ChevronUp, ExternalLink, Loader2, Phone, UserCheck, Video } from "lucide-react";
import { toast } from "sonner";

import AssignCandidatesPanel from "./assign-candidates-panel";
import AssignInterviewerPanel from "./assign-interviewer-panel";
import SessionTestPanel from "./session-test-panel";

const ROUND_CONFIG = {
  1: { label: "Round 1", color: "#7C8FFF" },
  2: { label: "Round 2", color: "#F59E0B" },
  3: { label: "Final", color: "#B48EFF" },
} as const;

const LOCATION_ICON = { online: Video, office: Building2, phone: Phone } as const;
const LOCATION_LABEL = { online: "Online", office: "Văn phòng", phone: "Điện thoại" };

const CONFIRM_CFG = {
  confirmed: { label: "Đã xác nhận", cls: "bg-[#36DDAB]/10 text-[#36DDAB] border-[#36DDAB]/20" },
  pending: { label: "Chờ xác nhận", cls: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20" },
  declined: { label: "Từ chối", cls: "bg-[#FF6B7A]/10 text-[#FF6B7A] border-[#FF6B7A]/20" },
} as const;

function formatViDateTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

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
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-[#7C8FFF]" /></div>;
  }

  if (!session) return null;

  const cfg = ROUND_CONFIG[session.round];
  const LocationIcon = LOCATION_ICON[session.location_type];

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-1 pb-10">
      <button onClick={() => router.push("/dashboard/recruitment/sessions")} className="group inline-flex items-center gap-2 rounded-full border border-[#8B99B0]/10 bg-[#0B1220]/70 px-3 py-1.5 text-sm text-[#8B99B0] transition-colors hover:border-[#8B99B0]/25 hover:text-[#ECF0F7]">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Sessions
      </button>

      <div className="relative overflow-hidden rounded-[28px] border border-[#8B99B0]/14 bg-[#0B1220]/95 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(124,143,255,0.18),transparent_28%),radial-gradient(circle_at_90%_0%,rgba(54,221,171,0.08),transparent_24%)]" />
        <div className="relative grid gap-5 p-5 lg:grid-cols-[1fr_360px] lg:p-6">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em]" style={{ borderColor: `${cfg.color}55`, background: `${cfg.color}1F`, color: cfg.color }}>{cfg.label}</span>
              <span className="rounded-full border border-[#8B99B0]/14 bg-[#111B2E]/80 px-3 py-1 text-xs text-[#8B99B0]">{session.tests ? "Test attached" : "Missing test"}</span>
              <span className="rounded-full border border-[#36DDAB]/20 bg-[#36DDAB]/10 px-3 py-1 text-xs text-[#7BEBCA]">{acceptedCount}/{Math.max(interviewers.length, 1)} accepted</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#F4F7FB] md:text-4xl">Session phỏng vấn</h1>
            <p className="mt-2 max-w-2xl truncate text-base text-[#8B99B0]">{session.job_descriptions?.title ?? "Không gắn JD"}</p>
          </div>

          <div className="grid gap-2 rounded-2xl border border-[#8B99B0]/10 bg-[#08101D]/70 p-4 text-sm text-[#C7D0E2]">
            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#8CA2FF]" />{formatViDateTime(session.scheduled_at)}</span>
            <span className="inline-flex items-center gap-2"><LocationIcon className="h-4 w-4 text-[#8CA2FF]" />{LOCATION_LABEL[session.location_type]}{session.location_detail ? ` · ${session.location_detail}` : ""}</span>
            <span className="inline-flex items-center gap-2 text-[#8B99B0]">Duration · {session.duration_minutes} phút</span>
          </div>
        </div>
      </div>

      {isInterviewer && (
        <div className="rounded-xl border border-[#8B99B0]/12 bg-[#0C1422] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#ECF0F7]">Xác nhận tham gia buổi phỏng vấn</p>
              <p className="text-xs text-[#8B99B0]">Sau khi accept, session này sẽ xuất hiện trong Interview Room.</p>
            </div>
            {canRespond ? (
              <div className="flex gap-2">
                <button disabled={responding} onClick={() => handleRespond("accept")} className="rounded-lg bg-[#36DDAB] px-3 py-2 text-sm font-semibold text-[#07111F] disabled:opacity-50">Accept</button>
                <button disabled={responding} onClick={() => handleRespond("decline")} className="rounded-lg border border-[#FF6B7A]/40 bg-[#FF6B7A]/10 px-3 py-2 text-sm font-semibold text-[#FF9BA6] disabled:opacity-50">Decline</button>
              </div>
            ) : (
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                isSessionPast
                  ? "bg-[#5A6882]/20 text-[#8B99B0]"
                  : myAssignmentStatus === "accepted"
                    ? "bg-[#36DDAB]/10 text-[#36DDAB]"
                    : myAssignmentStatus === "declined"
                      ? "bg-[#FF6B7A]/10 text-[#FF9BA6]"
                      : "bg-[#5A6882]/20 text-[#8B99B0]"
              }`}>
                {isSessionPast ? "Past" : myAssignmentStatus ? myAssignmentStatus[0].toUpperCase() + myAssignmentStatus.slice(1) : "Unavailable"}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Ứng viên" value={schedules.length} />
        <Stat label="Candidate confirmed" value={stats.confirmed} />
        <Stat label="Interviewer accepted" value={acceptedCount} />
        <Stat label="Session test" value={session.tests ? "Attached" : "Missing"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <Panel title="Interviewers" meta={`${acceptedCount}/${interviewers.length} accepted`}>
          {interviewers.length === 0 ? <p className="text-sm text-[#8B99B0]">Chưa gán interviewer.</p> : (
            <div className="space-y-2">
              {interviewers.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-[#8B99B0]/10 bg-[#07101D]/80 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#8B99B0]/12 bg-[#111B2E] text-sm font-bold text-[#D8E0F2]">{getInitial(item.users?.name ?? "I")}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#ECF0F7]">{item.users?.name ?? "Interviewer"}</p>
                    <p className="truncate text-xs text-[#8B99B0]">{item.users?.email ?? item.interviewer_id}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${item.status === "accepted" ? "bg-[#36DDAB]/10 text-[#36DDAB]" : item.status === "declined" ? "bg-[#FF6B7A]/10 text-[#FF6B7A]" : "bg-[#F59E0B]/10 text-[#F59E0B]"}`}>{item.status}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Collapsible title="Session test" open={showTest} onToggle={() => setShowTest((value) => !value)} prominent>
          <SessionTestPanel sessionId={id} currentTest={session.tests} onUpdated={() => fetchData(true)} />
        </Collapsible>
      </div>

      <div className="rounded-[22px] border border-[#8B99B0]/12 bg-[#0C1422]/90 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.16)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#ECF0F7]">Candidates</h2>
            <p className="text-xs text-[#8B99B0]">Danh sách ứng viên đã vào session này.</p>
          </div>
          {schedules.length > 0 && <button onClick={handleNotify} disabled={notifying} className="inline-flex items-center gap-2 rounded-xl border border-[#36DDAB]/30 bg-[#36DDAB]/10 px-3 py-2 text-xs font-semibold text-[#36DDAB] transition-colors hover:bg-[#36DDAB]/15 disabled:opacity-50">{notifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />} Notify</button>}
        </div>
        {schedules.length === 0 ? <div className="rounded-2xl border border-dashed border-[#8B99B0]/16 bg-[#07101D]/70 p-6 text-sm text-[#8B99B0]">Chưa có candidate trong session.</div> : (
          <div className="space-y-2">
            {schedules.map((schedule) => {
              const person = schedule.job_applications?.persons;
              if (!person) return null;
              const score = schedule.job_applications?.candidate_screenings?.[0]?.final_score ?? schedule.job_applications?.candidate_screenings?.[0]?.ai_score ?? null;
              return (
                <div key={schedule.id} className="flex items-center gap-3 rounded-2xl border border-[#8B99B0]/10 bg-[#07101D]/80 p-3 transition-colors hover:border-[#8B99B0]/22">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#7C8FFF]/25 bg-[#7C8FFF]/12 text-sm font-bold text-[#B6C2FF]">{getInitial(person.full_name)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#ECF0F7]">{person.full_name}</p>
                    <p className="truncate text-xs text-[#8B99B0]">{person.email}</p>
                  </div>
                  {score !== null && <span className="rounded-full bg-[#7C8FFF]/10 px-2 py-0.5 text-xs font-bold text-[#B6C2FF]">CV {Math.round(score)}</span>}
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${CONFIRM_CFG[schedule.candidate_confirmation].cls}`}>{CONFIRM_CFG[schedule.candidate_confirmation].label}</span>
                  <button onClick={() => router.push(`/dashboard/recruitment/${schedule.job_application_id}`)} className="rounded-lg p-1.5 text-[#8B99B0] hover:bg-[#7C8FFF]/10 hover:text-[#B6C2FF]"><ExternalLink className="w-3.5 h-3.5" /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {canManage && !canAssignCandidates && <div className="rounded-2xl border border-[#F59E0B]/25 bg-[#F59E0B]/10 p-3 text-sm text-[#F8C56B]">Cần ít nhất một interviewer accepted trước khi thêm candidate.</div>}

      {canManage && (
        <Collapsible title="Thêm candidate vào session" open={showAssign} onToggle={() => setShowAssign((value) => !value)}>
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

function Stat({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-2xl border border-[#8B99B0]/12 bg-[#0C1422]/85 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"><p className="text-[11px] uppercase tracking-[0.14em] text-[#6F7D95]">{label}</p><p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#F4F7FB]">{value}</p></div>;
}

function Panel({ title, meta, children }: { title: string; meta?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[22px] border border-[#8B99B0]/12 bg-[#0C1422]/90 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.16)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#ECF0F7]">{title}</h2>
        {meta && <span className="rounded-full border border-[#8B99B0]/12 bg-[#07101D] px-2.5 py-1 text-xs text-[#8B99B0]">{meta}</span>}
      </div>
      {children}
    </div>
  );
}

function Collapsible({ title, open, onToggle, children, prominent = false }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode; prominent?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-[22px] border border-[#8B99B0]/12 ${prominent ? "bg-[#0C1422]/95 shadow-[0_18px_60px_rgba(0,0,0,0.18)]" : "bg-[#0C1422]/85"}`}>
      <button onClick={onToggle} className="flex w-full items-center justify-between px-5 py-4 text-base font-semibold text-[#ECF0F7] hover:bg-[#8B99B0]/5">
        <span>{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-[#8B99B0]" /> : <ChevronDown className="w-4 h-4 text-[#8B99B0]" />}
      </button>
      {open && <div className="border-t border-[#8B99B0]/10 px-5 py-5">{children}</div>}
    </div>
  );
}
