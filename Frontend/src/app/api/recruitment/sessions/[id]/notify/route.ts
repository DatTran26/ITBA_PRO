import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveEmailProvider } from "@/lib/email/get-active-provider";
import { renderTemplate } from "@/lib/email/render-template";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  if (!ctx.isAdmin && !ctx.isHr) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: sessionId } = await params;
  const admin = createAdminClient();

  // Fetch session
  const { data: session, error: sessErr } = await admin
    .from("interview_sessions")
    .select("id, scheduled_at, duration_minutes, location_type, location_detail, round, job_descriptions(title)")
    .eq("id", sessionId)
    .single();

  if (sessErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Fetch schedules with candidate info
  const { data: schedules, error: schedErr } = await admin
    .from("interview_schedules")
    .select(`
      id, confirmation_token,
      job_applications(
        persons(full_name, email)
      )
    `)
    .eq("session_id", sessionId)
    .eq("status", "scheduled");

  if (schedErr) return NextResponse.json({ error: schedErr.message }, { status: 500 });
  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ error: "No scheduled candidates in this session" }, { status: 400 });
  }

  // Fetch email template
  const { data: tpl } = await admin
    .from("email_templates")
    .select("subject, body_html")
    .eq("type", "schedule_interview")
    .eq("locale", "vi")
    .maybeSingle();

  if (!tpl) {
    return NextResponse.json({ error: "Email template 'schedule_interview' not found" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const roundLabel = session.round === 3 ? "Final" : `Round ${session.round}`;
  const scheduledDate = new Date(session.scheduled_at);
  const formattedDate = scheduledDate.toLocaleDateString("vi-VN", {
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
  });
  const formattedTime = scheduledDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit", minute: "2-digit",
  });
  const locationLabel =
    session.location_type === "online" ? "Online"
    : session.location_type === "office" ? "Văn phòng"
    : "Điện thoại";

  type JdRow = { title: string } | { title: string }[] | null;
  const jdRaw = session.job_descriptions as JdRow;
  const jd = Array.isArray(jdRaw) ? (jdRaw[0] ?? null) : jdRaw;
  const positionTitle = jd?.title ?? "Vị trí tuyển dụng";

  let { provider, sender } = await getActiveEmailProvider();
  let sent = 0;
  const errors: string[] = [];

  for (const schedule of schedules) {
    try {
      type PersonRow = { full_name: string; email: string };
      type AppRow = { persons: PersonRow | PersonRow[] } | { persons: PersonRow | PersonRow[] }[] | null;
      const appRaw = schedule.job_applications as AppRow;
      const appObj = Array.isArray(appRaw) ? (appRaw[0] ?? null) : appRaw;
      const personsRaw = appObj?.persons;
      const person = Array.isArray(personsRaw) ? (personsRaw[0] ?? null) : (personsRaw ?? null);
      if (!person?.email) continue;

      const confirmUrl = `${appUrl}/api/recruitment/confirm-interview?token=${schedule.confirmation_token}`;
      const vars = {
        candidate_name: person.full_name,
        position_name: positionTitle,
        round: roundLabel,
        interview_date: formattedDate,
        interview_time: formattedTime,
        duration_minutes: String(session.duration_minutes),
        interview_type: locationLabel,
        interview_location: session.location_detail ?? locationLabel,
        meeting_link: confirmUrl,
        confirm_url: confirmUrl,
        hr_name: "",
        company_name: "",
      };
      const html = renderTemplate(tpl.body_html, vars);
      const subject = renderTemplate(tpl.subject, vars);

      await provider.send({
        from: sender,
        to: { email: person.email, name: person.full_name },
        subject,
        html,
      });

      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(msg);
    }
  }

  // Update notification_sent_at
  await admin
    .from("interview_sessions")
    .update({ notification_sent_at: new Date().toISOString() })
    .eq("id", sessionId);

  return NextResponse.json({ success: true, sent, errors });
}
