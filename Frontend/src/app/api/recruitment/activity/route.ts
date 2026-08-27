import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ActivityEvent {
  type: "cv_analyzed" | "cv_uploaded" | "status_changed" | "interview_scheduled";
  text: string;
  sub: string;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  NEW: "Mới",
  SCREENED: "Đã sàng lọc",
  SHORTLISTED: "Shortlisted",
  INTERVIEWING: "Đang phỏng vấn",
  OFFERED: "Đã offer",
  HIRED: "Đã tuyển",
  REJECTED: "Từ chối",
};

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, isHr, isRecruiter } = ctx;
  if (!isAdmin && !isHr && !isRecruiter) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const [screenings, cvs, statusHistory, interviews] = await Promise.all([
    // CV analyzed
    admin
      .from("candidate_screenings")
      .select("created_at, ai_score, job_applications(persons(full_name), job_descriptions(title))")
      .order("created_at", { ascending: false })
      .limit(5),

    // CV uploaded
    admin
      .from("candidate_cvs")
      .select("created_at, job_applications(persons(full_name), job_descriptions(title))")
      .order("created_at", { ascending: false })
      .limit(5),

    // Status changes
    admin
      .from("candidate_status_history")
      .select("changed_at, to_status, job_applications(persons(full_name))")
      .order("changed_at", { ascending: false })
      .limit(5),

    // Interview scheduled
    admin
      .from("interview_schedules")
      .select("created_at, scheduled_at, job_applications(persons(full_name), job_descriptions(title))")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const events: ActivityEvent[] = [];

  type ScreeningRow = { created_at: string; ai_score: number | null; job_applications: { persons: { full_name: string } | null; job_descriptions: { title: string } | null } | null };
  for (const s of (screenings.data ?? []) as unknown as ScreeningRow[]) {
    const name = s.job_applications?.persons?.full_name ?? "Ứng viên";
    const score = s.ai_score != null ? ` — AI Score: ${Math.round(s.ai_score)}` : "";
    events.push({ type: "cv_analyzed", text: "CV phân tích hoàn tất", sub: `${name}${score}`, createdAt: s.created_at });
  }

  type CvRow = { created_at: string; job_applications: { persons: { full_name: string } | null; job_descriptions: { title: string } | null } | null };
  for (const c of (cvs.data ?? []) as unknown as CvRow[]) {
    const name = c.job_applications?.persons?.full_name ?? "Ứng viên";
    const jd = c.job_applications?.job_descriptions?.title ?? "";
    events.push({ type: "cv_uploaded", text: "CV mới được upload", sub: jd ? `${name} — ${jd}` : name, createdAt: c.created_at });
  }

  type StatusRow = { changed_at: string; to_status: string; job_applications: { persons: { full_name: string } | null } | null };
  for (const h of (statusHistory.data ?? []) as unknown as StatusRow[]) {
    const name = h.job_applications?.persons?.full_name ?? "Ứng viên";
    const label = STATUS_LABEL[h.to_status] ?? h.to_status;
    events.push({ type: "status_changed", text: `Chuyển sang ${label}`, sub: name, createdAt: h.changed_at });
  }

  type InterviewRow = { created_at: string; scheduled_at: string; job_applications: { persons: { full_name: string } | null; job_descriptions: { title: string } | null } | null };
  for (const i of (interviews.data ?? []) as unknown as InterviewRow[]) {
    const name = i.job_applications?.persons?.full_name ?? "Ứng viên";
    const jd = i.job_applications?.job_descriptions?.title ?? "";
    const date = new Date(i.scheduled_at).toLocaleDateString("vi-VN");
    events.push({ type: "interview_scheduled", text: "Lịch PV được đặt", sub: `${name}${jd ? ` — ${jd}` : ""} — ${date}`, createdAt: i.created_at });
  }

  events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ activities: events.slice(0, 8) });
}
